from dataclasses import replace
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.record import (
    ProductRecord,
    RecordSynthesisEvidence,
    RecordSynthesisItem,
    RecordSynthesisItemSource,
    RecordSynthesisRun,
    RecordSynthesisSource,
    SessionRecord,
)
from app.models.conversation import Conversation
from app.models.research_session import SessionRelationship
from app.models.session_report import SessionReport, SessionReportItem
from app.services import record_service


pytestmark = pytest.mark.integration


def _project(client: TestClient) -> dict:
    settings_response = client.put(
        "/api/settings/ai",
        json={
            "provider": "mock",
            "model": "mock-chat",
            "base_url": None,
            "embedding_provider": "mock",
            "embedding_model": "mock-hash-64",
        },
    )
    assert settings_response.status_code == 200
    response = client.post("/api/projects", json={"name": "Record synthesis project", "description": "Backend contract"})
    assert response.status_code == 201
    return response.json()


def _session(client: TestClient, project_id: str, title: str, record_id: str | None = None) -> dict:
    payload = {"title": title, "type": "interview", "participant_ids": []}
    if record_id:
        payload["related_record_ids"] = [record_id]
    response = client.post(f"/api/projects/{project_id}/sessions", json=payload)
    assert response.status_code == 201
    return response.json()


def _eligible_session(client: TestClient, project_id: str, title: str, report_status: str) -> tuple[dict, dict]:
    research_session = _session(client, project_id, title, "record-1")
    root = f"/api/projects/{project_id}/sessions/{research_session['id']}"
    upload = client.post(
        f"{root}/documents",
        files={"file": (f"{title.lower().replace(' ', '-')}.txt", f"Jordan Moore:\n{title} showed that checkout confirmation and navigation context must remain clear.".encode(), "text/plain")},
    )
    assert upload.status_code == 201
    assert client.post(f"{root}/themes/generate").status_code == 200
    report = client.post(f"{root}/report/generate")
    assert report.status_code == 200
    reviewed = client.patch(f"{root}/report", json={"status": report_status})
    assert reviewed.status_code == 200
    return research_session, reviewed.json()


def test_fixed_catalog_and_single_record_assignment(client: TestClient, db_session: Session) -> None:
    catalog = client.get("/api/records")
    assert catalog.status_code == 200
    assert [(record["id"], record["name"]) for record in catalog.json()] == [
        ("record-1", "Record 1"),
        ("record-2", "Record 2"),
        ("record-3", "Record 3"),
    ]

    project = _project(client)
    research_session = _session(client, project["id"], "Navigation interview")
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    first = client.put(f"{root}/record", json={"record_id": "record-2"})
    second = client.put(f"{root}/record", json={"record_id": "record-2"})
    assert first.status_code == second.status_code == 200
    assert second.json()["related_records"] == [{"id": "record-2", "name": "Record 2"}]
    assert db_session.scalar(select(func.count()).select_from(SessionRecord).where(SessionRecord.session_id == research_session["id"])) == 1
    assert client.put(f"{root}/record", json={"record_id": "not-a-record"}).status_code == 400
    assert [item["id"] for item in client.get("/api/records/record-2/sessions").json()] == [research_session["id"]]


def test_record_eligibility_uses_reviewed_evidence_linked_reports(client: TestClient) -> None:
    project = _project(client)
    first, first_report = _eligible_session(client, project["id"], "Checkout interview", "researcher-reviewed")
    second, second_report = _eligible_session(client, project["id"], "Checkout usability test", "approved")
    excluded = _session(client, project["id"], "Unreviewed working session", "record-1")

    eligibility = client.get("/api/records/record-1/synthesis/eligibility")
    assert eligibility.status_code == 200
    body = eligibility.json()
    assert {item["id"] for item in body["included_sessions"]} == {first["id"], second["id"]}
    assert {item["report_id"] for item in body["included_sessions"]} == {first_report["id"], second_report["id"]}
    assert body["minimum_eligible_sessions"] == 2
    assert body["excluded_sessions"] == [{
        "id": excluded["id"],
        "title": "Unreviewed working session",
        "reason": "Session Report has not been generated",
    }]
    record = client.get("/api/records/record-1").json()
    assert record["related_session_count"] == 3
    assert record["eligible_session_count"] == 2
    assert record["readiness"] == "ready"


def test_record_chat_searches_all_related_transcripts_without_persisting_history(
    client: TestClient,
    db_session: Session,
) -> None:
    project = _project(client)
    _eligible_session(
        client,
        project["id"],
        "Reviewed checkout interview",
        "researcher-reviewed",
    )
    excluded = _session(
        client,
        project["id"],
        "Excluded navigation follow-up",
        "record-1",
    )
    excluded_root = (
        f"/api/projects/{project['id']}/sessions/{excluded['id']}"
    )
    upload = client.post(
        f"{excluded_root}/documents",
        files={
            "file": (
                "excluded-follow-up.txt",
                (
                    "Morgan Lee:\nThe cobalt breadcrumb remained visible, "
                    "which made navigation feel recoverable."
                ).encode(),
                "text/plain",
            )
        },
    )
    assert upload.status_code == 201

    sources = client.get("/api/records/record-1/chat/sources")
    assert sources.status_code == 200
    assert sources.json() == {
        "record_id": "record-1",
        "primary_transcript_count": 2,
        "reviewed_report_count": 1,
        "record_knowledge_available": False,
        "searchable": True,
    }

    response = client.post(
        "/api/records/record-1/chat/ask",
        json={"question": "What did the cobalt breadcrumb change?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "answered"
    assert body["answer"]
    assert body["record_knowledge_used"] is False
    assert "not consolidated through Record Knowledge" in body["traceability_note"]
    assert body["citations"][0]["session_id"] == excluded["id"]
    assert body["citations"][0]["project_name"] == project["name"]
    assert body["citations"][0]["context_result_id"]
    assert db_session.scalar(select(func.count()).select_from(Conversation)) == 0


def test_record_chat_reports_no_sources_and_withholds_unsupported_conclusions(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    no_sources = client.get("/api/records/record-2/chat/sources")
    assert no_sources.status_code == 200
    assert no_sources.json()["searchable"] is False
    assert client.post(
        "/api/records/record-2/chat/ask",
        json={"question": "What did participants say?"},
    ).status_code == 409

    project = _project(client)
    _eligible_session(
        client,
        project["id"],
        "Account recovery interview",
        "approved",
    )
    original_search = record_service._search_record_chunks

    def low_relevance_search(*args, **kwargs):
        return [
            replace(item, score=0.01)
            for item in original_search(*args, **kwargs)
        ]

    monkeypatch.setattr(
        record_service,
        "_search_record_chunks",
        low_relevance_search,
    )
    response = client.post(
        "/api/records/record-1/chat/ask",
        json={"question": "Did participants prefer biometric verification?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "insufficient-evidence"
    assert body["answer"] is None
    assert body["citations"]
    assert {citation["relevance"] for citation in body["citations"]} == {"partial"}


def test_record_synthesis_generation_is_evidence_linked_and_idempotent(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    first, _first_report = _eligible_session(client, project["id"], "Checkout confirmation interview", "researcher-reviewed")
    second, _second_report = _eligible_session(client, project["id"], "Checkout confirmation usability test", "approved")

    payload = {"client_request_key": "record-1-generation-request"}
    generated = client.post("/api/records/record-1/synthesis", json=payload)
    replay = client.post("/api/records/record-1/synthesis", json=payload)
    assert generated.status_code == replay.status_code == 201
    body = generated.json()
    assert replay.json()["id"] == body["id"]
    assert body["status"] == "complete"
    assert body["source_session_count"] == 2
    assert body["source_report_revision_count"] == 2
    assert body["provider"] == "mock"
    assert body["prompt_version"] == "record-synthesis-v1"
    assert {item["type"] for item in body["items"]} == {"requirement", "decision", "action-item"}
    assert all(item["evidence_ids"] for item in body["items"])
    assert all(item["source_session_count"] == 2 for item in body["items"])
    assert db_session.scalar(select(func.count()).select_from(RecordSynthesisRun)) == 1
    assert db_session.scalar(select(func.count()).select_from(RecordSynthesisSource)) == 2

    first_evidence = body["items"][0]["evidence_ids"][0]
    evidence = client.get(
        f"/api/records/record-1/synthesis/items/{body['items'][0]['id']}/evidence/{first_evidence}"
    )
    assert evidence.status_code == 200
    assert evidence.json()["session_id"] in {first["id"], second["id"]}
    deleted = client.delete(f"/api/projects/{project['id']}")
    assert deleted.status_code == 204
    assert db_session.scalar(select(func.count()).select_from(RecordSynthesisRun)) == 0


def test_deleting_a_source_session_invalidates_affected_record_synthesis(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    first, _first_report = _eligible_session(client, project["id"], "Checkout interview", "approved")
    second, _second_report = _eligible_session(client, project["id"], "Checkout usability test", "approved")
    generated = client.post(
        "/api/records/record-1/synthesis",
        json={"client_request_key": "delete-source-session"},
    )
    assert generated.status_code == 201
    assert db_session.scalar(select(func.count()).select_from(RecordSynthesisRun)) == 1

    deleted = client.delete(f"/api/projects/{project['id']}/sessions/{first['id']}")
    assert deleted.status_code == 204
    assert db_session.scalar(select(func.count()).select_from(RecordSynthesisRun)) == 0
    assert client.get(f"/api/projects/{project['id']}/sessions/{second['id']}").status_code == 200


def test_record_synthesis_requires_two_eligible_reports_and_preserves_source_snapshots(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    first, first_report = _eligible_session(client, project["id"], "Navigation interview", "approved")
    insufficient = client.post(
        "/api/records/record-1/synthesis",
        json={"client_request_key": "insufficient-run"},
    )
    assert insufficient.status_code == 409

    _second, _second_report = _eligible_session(client, project["id"], "Navigation usability test", "approved")
    original = client.post(
        "/api/records/record-1/synthesis",
        json={"client_request_key": "original-source-snapshot"},
    )
    assert original.status_code == 201

    root = f"/api/projects/{project['id']}/sessions/{first['id']}"
    revision = client.post(f"{root}/report/revisions")
    assert revision.status_code == 201
    approved_revision = client.patch(f"{root}/report", json={"status": "approved"})
    assert approved_revision.status_code == 200
    regenerated = client.post(
        "/api/records/record-1/synthesis",
        json={"client_request_key": "revised-source-snapshot"},
    )
    assert regenerated.status_code == 201
    assert regenerated.json()["id"] != original.json()["id"]

    original_source_ids = set(db_session.scalars(
        select(RecordSynthesisSource.report_id).where(RecordSynthesisSource.run_id == original.json()["id"])
    ).all())
    revised_source_ids = set(db_session.scalars(
        select(RecordSynthesisSource.report_id).where(RecordSynthesisSource.run_id == regenerated.json()["id"])
    ).all())
    assert first_report["id"] in original_source_ids
    assert approved_revision.json()["id"] in revised_source_ids
    assert first_report["id"] not in revised_source_ids


def test_record_synthesis_uses_the_configured_live_provider_contract(client: TestClient, db_session: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    project = _project(client)
    _eligible_session(client, project["id"], "Account setup interview", "approved")
    _eligible_session(client, project["id"], "Account setup usability test", "approved")
    source_item_id = db_session.scalar(
        select(SessionReportItem.id)
        .where(SessionReportItem.item_type == "requirement")
        .order_by(SessionReportItem.created_at)
        .limit(1)
    )
    assert source_item_id
    settings = client.put(
        "/api/settings/ai",
        json={
            "provider": "openai",
            "model": "test-live-model",
            "base_url": None,
            "embedding_provider": "mock",
            "embedding_model": "mock-hash-64",
        },
    )
    assert settings.status_code == 200
    monkeypatch.setattr(record_service.theme_service, "_should_use_mock", lambda _settings: False)
    monkeypatch.setattr(record_service.theme_service, "_api_key_for_provider", lambda _provider: "test-key")

    def fake_completion(**_kwargs):
        content = json.dumps({
            "items": [{
                "type": "requirement",
                "title": "Keep account setup guidance visible",
                "summary": "Users need persistent guidance throughout account setup.",
                "source_report_item_ids": [source_item_id],
            }],
        })
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    import litellm

    monkeypatch.setattr(litellm, "completion", fake_completion)
    response = client.post(
        "/api/records/record-1/synthesis",
        json={"client_request_key": "live-provider-contract"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "complete"
    assert body["provider"] == "openai"
    assert body["model"] == "test-live-model"
    assert body["items"][0]["title"] == "Keep account setup guidance visible"


def test_persisted_synthesis_item_and_evidence_enforce_record_ownership(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    research_session, report_read = _eligible_session(client, project["id"], "Payment confirmation interview", "approved")
    report = db_session.scalar(
        select(SessionReport)
        .options(selectinload(SessionReport.items).selectinload(SessionReportItem.evidence))
        .where(SessionReport.id == report_read["id"])
    )
    assert report is not None
    source_item = next(item for item in report.items if item.item_type == "requirement")
    source_evidence = source_item.evidence[0]

    run = RecordSynthesisRun(
        record_id="record-1",
        status="complete",
        client_request_key="record-1-test-run",
        source_session_count=1,
        source_report_revision_count=1,
        provider="mock",
        model="mock-chat",
        prompt_version="record-synthesis-v1",
        completed_at=datetime.now(timezone.utc),
    )
    run.sources.append(RecordSynthesisSource(
        session_id=research_session["id"],
        report_id=report.id,
        report_updated_at=report.updated_at,
    ))
    item = RecordSynthesisItem(
        item_type="requirement",
        title="Confirmation must communicate payment success",
        summary="Show an unambiguous payment confirmation.",
        evidence_preview=source_evidence.excerpt,
        source_session_count=1,
        source_report_item_count=1,
        provenance="mock / record-synthesis-v1",
    )
    item.source_items.append(RecordSynthesisItemSource(report_item_id=source_item.id))
    item.evidence.append(RecordSynthesisEvidence(
        source_report_item_id=source_item.id,
        project_id=project["id"],
        session_id=research_session["id"],
        document_id=source_evidence.document_id,
        chunk_id=source_evidence.chunk_id,
        excerpt=source_evidence.excerpt,
        speaker=source_evidence.speaker,
        location=source_evidence.location,
        relevance=source_evidence.relevance,
    ))
    run.items.append(item)
    db_session.add(run)
    db_session.commit()

    latest = client.get("/api/records/record-1/synthesis/latest")
    assert latest.status_code == 200
    latest_body = latest.json()
    assert latest_body["source_report_revision_count"] == 1
    assert latest_body["items"][0]["evidence_ids"] == [item.evidence[0].id]

    reviewed = client.patch(
        f"/api/records/record-1/synthesis/items/{item.id}",
        json={"status": "researcher-reviewed"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "researcher-reviewed"

    evidence_path = f"/api/records/record-1/synthesis/items/{item.id}/evidence/{item.evidence[0].id}"
    evidence = client.get(evidence_path)
    assert evidence.status_code == 200
    assert evidence.json()["context"]["focused_passage_id"] == source_evidence.chunk_id
    wrong_record_path = evidence_path.replace("record-1", "record-2", 1)
    assert client.get(wrong_record_path).status_code == 404


def test_provisional_record_backfill_is_replay_safe(client: TestClient, db_session: Session) -> None:
    project = _project(client)
    research_session = _session(client, project["id"], "Imported navigation research")
    db_session.add(SessionRelationship(
        session_id=research_session["id"],
        target_type="record",
        target_id="legacy-navigation-record",
        target_name="Record 2",
    ))
    db_session.commit()

    migration_path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "0007_add_record_synthesis_persistence.py"
    spec = importlib.util.spec_from_file_location("record_migration", migration_path)
    assert spec and spec.loader
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    migration.seed_records_and_backfill(db_session.connection())
    migration.seed_records_and_backfill(db_session.connection())
    db_session.commit()

    assert db_session.scalar(select(func.count()).select_from(ProductRecord)) == 3
    assert db_session.scalar(
        select(func.count()).select_from(SessionRecord).where(
            SessionRecord.session_id == research_session["id"],
            SessionRecord.record_id == "record-2",
        )
    ) == 1
    assert db_session.scalar(select(func.count()).select_from(SessionRelationship).where(SessionRelationship.session_id == research_session["id"])) == 1
