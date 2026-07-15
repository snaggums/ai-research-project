import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


def _project(client: TestClient, name: str = "Alpha Project") -> dict:
    response = client.post("/api/projects", json={"name": name, "description": "Participant API test"})
    assert response.status_code == 201
    return response.json()


def test_participant_crud_search_and_records(client: TestClient) -> None:
    project = _project(client)
    payload = {
        "first_name": "Alex",
        "last_name": "Morgan",
        "email": "alex@example.com",
        "organization": "Sky",
        "role": "Product manager",
        "record_ids": ["record-1", "record-2"],
        "researcher_notes": "Primary checkout stakeholder.",
    }
    created = client.post(f"/api/projects/{project['id']}/participants", json=payload)
    assert created.status_code == 201
    participant = created.json()
    assert participant["record_ids"] == ["record-1", "record-2"]
    assert participant["session_count"] == 0

    listed = client.get(f"/api/projects/{project['id']}/participants", params={"q": "alex@"})
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [participant["id"]]

    updated = client.patch(
        f"/api/projects/{project['id']}/participants/{participant['id']}",
        json={"first_name": "Alexa", "record_ids": ["record-2"]},
    )
    assert updated.status_code == 200
    assert updated.json()["first_name"] == "Alexa"
    assert updated.json()["record_ids"] == ["record-2"]

    assert client.delete(f"/api/projects/{project['id']}/participants/{participant['id']}").status_code == 204
    assert client.get(f"/api/projects/{project['id']}/participants/{participant['id']}").status_code == 404


def test_participant_detail_enforces_project_ownership(client: TestClient) -> None:
    first = _project(client, "First Project")
    second = _project(client, "Second Project")
    participant = client.post(
        f"/api/projects/{first['id']}/participants",
        json={"first_name": "Jordan", "last_name": "Moore", "record_ids": []},
    ).json()
    response = client.get(f"/api/projects/{second['id']}/participants/{participant['id']}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Participant not found"}
