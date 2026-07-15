import pytest
from fastapi.testclient import TestClient

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
    assert session["related_records"] == [{"id": "record-1", "name": "Checkout experience"}]
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


def test_session_transcript_contract_enforces_nested_ownership(client: TestClient) -> None:
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
