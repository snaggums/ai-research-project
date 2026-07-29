from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chunk import Chunk


pytestmark = pytest.mark.integration


def create_project(
    client: TestClient,
    *,
    name: str = "Checkout usability study",
    description: str | None = "Research on the checkout experience",
) -> dict:
    response = client.post(
        "/api/projects",
        json={"name": name, "description": description},
    )
    assert response.status_code == 201
    return response.json()


def test_create_and_get_project(client: TestClient) -> None:
    created = create_project(client)

    UUID(created["id"])
    assert created["name"] == "Checkout usability study"
    assert created["description"] == "Research on the checkout experience"
    assert created["created_at"]
    assert created["updated_at"]

    response = client.get(f"/api/projects/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_list_projects(client: TestClient) -> None:
    first = create_project(client, name="First project")
    second = create_project(client, name="Second project")

    response = client.get("/api/projects")

    assert response.status_code == 200
    projects = response.json()
    assert {project["id"] for project in projects} == {first["id"], second["id"]}


def test_project_summary_counts_participants_and_sessions(client: TestClient) -> None:
    project = create_project(client, name="Counted project")
    for first_name in ("Alex", "Jordan"):
        response = client.post(
            f"/api/projects/{project['id']}/participants",
            json={"first_name": first_name, "last_name": "Morgan", "record_ids": []},
        )
        assert response.status_code == 201
    session = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={
            "title": "Counted session",
            "type": "interview",
            "participant_ids": [],
            "related_record_ids": ["record-1"],
        },
    )
    assert session.status_code == 201

    summary = client.get(f"/api/projects/{project['id']}")

    assert summary.status_code == 200
    assert summary.json()["participant_count"] == 2
    assert summary.json()["session_count"] == 1
    assert summary.json()["ready_transcript_count"] == 0

    listed = client.get("/api/projects")
    listed_project = next(value for value in listed.json() if value["id"] == project["id"])
    assert listed_project["participant_count"] == 2
    assert listed_project["session_count"] == 1
    assert listed_project["ready_transcript_count"] == 0


def test_project_chat_citations_include_session_speaker_and_timestamp(
    client: TestClient,
    db_session: Session,
) -> None:
    project = create_project(client, name="Healthcare Fraud Project")
    research_session = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={
            "title": "Medicare Fraud Documenter - S001",
            "type": "interview",
            "participant_ids": [],
        },
    ).json()
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    upload = client.post(
        f"{root}/documents",
        files={
            "file": (
                "S001_Transcript.docx.txt",
                (
                    "Priya Nair:\nThe submission record needs a complete "
                    "audit trail for every decision."
                ).encode(),
                "text/plain",
            )
        },
    )
    assert upload.status_code == 201
    document = upload.json()

    chunk = db_session.scalar(
        select(Chunk).where(Chunk.document_id == document["id"])
    )
    assert chunk is not None
    chunk.extra_metadata = {
        **(chunk.extra_metadata or {}),
        "speaker": "Priya Nair",
        "timestamp": "00:12:25",
    }
    db_session.add(chunk)
    db_session.commit()

    response = client.post(
        f"/api/projects/{project['id']}/chat",
        json={"question": "How should submission records preserve auditability?"},
    )

    assert response.status_code == 200
    citation = response.json()["citations"][0]
    assert citation == {
        "chunk_id": chunk.id,
        "document_id": document["id"],
        "document_name": "S001_Transcript.docx.txt",
        "session_id": research_session["id"],
        "session_title": "Medicare Fraud Documenter - S001",
        "speaker": "Priya Nair",
        "location": "00:12:25",
        "context_result_id": chunk.id,
        "chunk_index": 0,
        "text": chunk.text,
        "score": citation["score"],
    }

    context = client.get(
        f"{root}/documents/{document['id']}/context/{citation['context_result_id']}"
    )
    assert context.status_code == 200
    assert context.json()["result"]["speaker"] == "Priya Nair"
    assert context.json()["result"]["location"] == "00:12:25"


def test_update_project(client: TestClient) -> None:
    project = create_project(client)

    response = client.patch(
        f"/api/projects/{project['id']}",
        json={"name": "Updated study", "description": None},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated study"
    assert response.json()["description"] is None


def test_delete_project(client: TestClient) -> None:
    project = create_project(client)

    response = client.delete(f"/api/projects/{project['id']}")

    assert response.status_code == 204
    assert client.get(f"/api/projects/{project['id']}").status_code == 404


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_missing_project_returns_404(client: TestClient, method: str) -> None:
    project_id = "00000000-0000-0000-0000-000000000000"
    request = getattr(client, method)
    kwargs = {"json": {"name": "Missing"}} if method == "patch" else {}

    response = request(f"/api/projects/{project_id}", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


@pytest.mark.parametrize(
    "payload",
    [
        {"description": "Name is required"},
        {"name": ""},
        {"name": "x" * 201},
    ],
)
def test_create_project_validates_payload(client: TestClient, payload: dict) -> None:
    response = client.post("/api/projects", json=payload)

    assert response.status_code == 422
