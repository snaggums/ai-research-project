from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.session_report import SessionReport
from app.services import document_service

pytestmark = pytest.mark.integration


def _project(client: TestClient, name: str = "Alpha Project") -> dict:
    response = client.post("/api/projects", json={"name": name, "description": "Session API test"})
    assert response.status_code == 201
    return response.json()


def _participant(client: TestClient, project_id: str, first_name: str = "Alex") -> dict:
    response = client.post(
        f"/api/projects/{project_id}/participants",
        json={"first_name": first_name, "last_name": "Morgan", "record_ids": []},
    )
    assert response.status_code == 201
    return response.json()


def test_session_crud_memberships_relationships_and_filters(client: TestClient) -> None:
    project = _project(client)
    participant = _participant(client, project["id"])
    payload = {
        "title": "Mobile checkout usability test",
        "type": "usability-test",
        "starts_at": "2026-07-10T14:00:00Z",
        "duration_minutes": 45,
        "description": "Observe checkout recovery behavior.",
        "participant_ids": [participant["id"]],
        "related_record_ids": ["record-1"],
        "related_common_component_ids": ["component-summary"],
        "related_records": [{"id": "record-1", "name": "Checkout experience"}],
        "related_common_components": [{"id": "component-summary", "name": "Order summary"}],
    }
    created = client.post(f"/api/projects/{project['id']}/sessions", json=payload)
    assert created.status_code == 201
    session = created.json()
    assert session["participant_ids"] == [participant["id"]]
    assert session["related_records"] == [{"id": "record-1", "name": "Medicare Fraud Documenter"}]
    assert session["transcript_status"] == "none"

    filtered = client.get(
        f"/api/projects/{project['id']}/sessions",
        params={"q": "checkout", "type": "usability-test", "record_id": "record-1", "date": "2026-07-10"},
    )
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [session["id"]]

    updated = client.patch(
        f"/api/projects/{project['id']}/sessions/{session['id']}",
        json={"title": "Updated checkout session", "participant_ids": []},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated checkout session"
    assert updated.json()["participant_ids"] == []
    persisted = client.get(f"/api/projects/{project['id']}/sessions/{session['id']}")
    assert persisted.status_code == 200
    assert persisted.json()["title"] == "Updated checkout session"
    assert persisted.json()["participant_ids"] == []
    assert client.delete(f"/api/projects/{project['id']}/sessions/{session['id']}").status_code == 204


def test_session_rejects_cross_project_participants(client: TestClient) -> None:
    first = _project(client, "First Project")
    second = _project(client, "Second Project")
    participant = _participant(client, second["id"], "Jordan")
    response = client.post(
        f"/api/projects/{first['id']}/sessions",
        json={"title": "Invalid membership", "type": "interview", "participant_ids": [participant["id"]]},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Every Session participant must belong to this Project."}


def test_session_transcript_contract_enforces_nested_ownership(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    created = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={"title": "Transcript session", "type": "interview", "participant_ids": []},
    ).json()
    upload = client.post(
        f"/api/projects/{project['id']}/sessions/{created['id']}/documents",
        files={"file": ("interview.txt", b"Jordan Moore:\nThe order summary disappeared during checkout.", "text/plain")},
    )
    assert upload.status_code == 201
    document = upload.json()
    assert document["session_id"] == created["id"]
    assert document["is_primary"] is True
    stored_document = db_session.get(Document, document["id"])
    assert stored_document is not None
    stored_file = Path(stored_document.file_path)
    assert stored_file.exists()

    listed = client.get(f"/api/projects/{project['id']}/sessions/{created['id']}/documents")
    assert listed.status_code == 200
    assert listed.json()[0]["status"] == "complete"

    search = client.get(
        f"/api/projects/{project['id']}/sessions/{created['id']}/documents/{document['id']}/search",
        params={"q": "order summary"},
    )
    assert search.status_code == 200
    result = search.json()["results"][0]
    assert result["speaker"] == "Jordan Moore"
    context = client.get(
        f"/api/projects/{project['id']}/sessions/{created['id']}/documents/{document['id']}/context/{result['id']}"
    )
    assert context.status_code == 200
    assert context.json()["focused_passage_id"] == result["id"]

    download = client.get(
        f"/api/projects/{project['id']}/sessions/{created['id']}/documents/{document['id']}/download"
    )
    assert download.status_code == 200
    assert download.content == b"Jordan Moore:\nThe order summary disappeared during checkout."
    assert 'filename="interview.txt"' in download.headers["content-disposition"]

    other_project = _project(client, "Other Project")
    assert client.get(f"/api/projects/{other_project['id']}/sessions/{created['id']}/documents").status_code == 404

    deleted = client.delete(f"/api/projects/{project['id']}/sessions/{created['id']}")
    assert deleted.status_code == 204
    assert db_session.scalar(select(func.count()).select_from(Document).where(Document.session_id == created["id"])) == 0
    assert not stored_file.exists()
    assert client.get(f"/api/projects/{project['id']}/sessions/{created['id']}").status_code == 404


def test_session_transcript_replacement_promotes_only_after_processing(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    research_session = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={"title": "Replacement session", "type": "interview", "participant_ids": []},
    ).json()
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"

    original_response = client.post(
        f"{root}/documents",
        files={"file": ("original.txt", b"Moderator: Original evidence remains traceable.", "text/plain")},
    )
    assert original_response.status_code == 201
    original = original_response.json()

    duplicate = client.post(
        f"{root}/documents",
        files={"file": ("duplicate.txt", b"This must use the replacement workflow.", "text/plain")},
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "transcript_already_exists"

    replacement_response = client.post(
        f"{root}/transcript-replacement",
        headers={"Idempotency-Key": "replacement-request-1"},
        files={"file": ("replacement.txt", b"Moderator: Replacement evidence is now active.", "text/plain")},
    )
    assert replacement_response.status_code == 201

    listed = client.get(f"{root}/documents")
    assert listed.status_code == 200
    documents = {value["filename"]: value for value in listed.json()}
    assert documents["replacement.txt"]["is_primary"] is True
    assert documents["replacement.txt"]["lifecycle_status"] == "active"
    assert documents["replacement.txt"]["status"] == "complete"
    assert documents["original.txt"]["is_primary"] is False
    assert documents["original.txt"]["lifecycle_status"] == "legacy"

    persisted_original = db_session.get(Document, original["id"])
    assert persisted_original is not None
    assert persisted_original.archived_at is not None

    replay = client.post(
        f"{root}/transcript-replacement",
        headers={"Idempotency-Key": "replacement-request-1"},
        files={"file": ("ignored-replay.txt", b"Idempotent replay.", "text/plain")},
    )
    assert replay.status_code == 201
    assert replay.json()["id"] == documents["replacement.txt"]["id"]


def test_failed_replacement_preserves_active_transcript(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    project = _project(client)
    research_session = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={"title": "Failed replacement session", "type": "interview", "participant_ids": []},
    ).json()
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    original = client.post(
        f"{root}/documents",
        files={"file": ("original.txt", b"Moderator: Keep this evidence active.", "text/plain")},
    ).json()

    def fail_extraction(_path: str) -> None:
        raise ValueError("Replacement text could not be extracted.")

    monkeypatch.setattr(document_service, "extract_transcript", fail_extraction)
    response = client.post(
        f"{root}/transcript-replacement",
        headers={"Idempotency-Key": "failed-replacement-request"},
        files={"file": ("failed.txt", b"Unreadable replacement.", "text/plain")},
    )
    assert response.status_code == 201

    documents = {value["filename"]: value for value in client.get(f"{root}/documents").json()}
    assert documents["original.txt"]["id"] == original["id"]
    assert documents["original.txt"]["is_primary"] is True
    assert documents["original.txt"]["lifecycle_status"] == "active"
    assert documents["failed.txt"]["is_primary"] is False
    assert documents["failed.txt"]["status"] == "failed"
    assert documents["failed.txt"]["lifecycle_status"] == "replacement-failed"


def test_confirmed_delete_tombstones_source_and_supersedes_report(
    client: TestClient,
    db_session: Session,
) -> None:
    project = _project(client)
    research_session = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={"title": "Delete transcript session", "type": "interview", "participant_ids": []},
    ).json()
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    uploaded = client.post(
        f"{root}/documents",
        files={"file": ("delete-me.txt", b"Moderator: Preserve this source in research history.", "text/plain")},
    ).json()
    stored_document = db_session.get(Document, uploaded["id"])
    assert stored_document is not None
    stored_file = Path(stored_document.file_path)

    report = SessionReport(
        project_id=project["id"],
        session_id=research_session["id"],
        status="researcher-reviewed",
        executive_summary="Summary based on the active Transcript.",
        detailed_notes="Preserve this historical report.",
    )
    db_session.add(report)
    db_session.commit()

    confirmation_required = client.delete(f"{root}/documents/{uploaded['id']}")
    assert confirmation_required.status_code == 409
    assert confirmation_required.json()["code"] == "transcript_confirmation_required"

    dependencies = client.get(f"{root}/documents/{uploaded['id']}/dependencies")
    assert dependencies.status_code == 200
    summary = dependencies.json()
    assert summary["is_primary"] is True
    assert summary["retention_consequence"] == "preserve-lineage"

    changed = client.delete(
        f"{root}/documents/{uploaded['id']}",
        headers={
            "If-Match": "stale-dependency-version",
            "X-Transcript-Confirmation": "preserve-lineage",
        },
    )
    assert changed.status_code == 409
    assert changed.json()["code"] == "transcript_dependency_changed"

    deleted = client.delete(
        f"{root}/documents/{uploaded['id']}",
        headers={
            "If-Match": summary["version"],
            "X-Transcript-Confirmation": "preserve-lineage",
        },
    )
    assert deleted.status_code == 204

    listed = client.get(f"{root}/documents").json()
    tombstoned = next(value for value in listed if value["id"] == uploaded["id"])
    assert tombstoned["is_primary"] is False
    assert tombstoned["lifecycle_status"] == "tombstoned"
    assert stored_file.exists()

    db_session.expire_all()
    assert db_session.get(SessionReport, report.id).status == "superseded"
    session_after = client.get(root).json()
    assert session_after["has_primary_transcript"] is False
    assert session_after["transcript_status"] == "none"

    replacement_upload = client.post(
        f"{root}/documents",
        files={"file": ("new-active.txt", b"Moderator: A new active Transcript.", "text/plain")},
    )
    assert replacement_upload.status_code == 201
    assert replacement_upload.json()["is_primary"] is True
