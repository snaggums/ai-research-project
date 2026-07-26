import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


def _workspace(client: TestClient) -> tuple[dict, dict, dict]:
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
    project_response = client.post(
        "/api/projects",
        json={"name": "Alpha Project", "description": "Session synthesis test"},
    )
    assert project_response.status_code == 201
    project = project_response.json()
    participant_response = client.post(
        f"/api/projects/{project['id']}/participants",
        json={
            "first_name": "Jordan",
            "last_name": "Moore",
            "organization": "Independent",
            "role": "Participant",
            "researcher_notes": "Completed checkout tasks.",
            "record_ids": [],
        },
    )
    assert participant_response.status_code == 201
    participant = participant_response.json()
    session_response = client.post(
        f"/api/projects/{project['id']}/sessions",
        json={
            "title": "Mobile checkout usability test",
            "type": "usability-test",
            "starts_at": "2026-07-10T14:00:00Z",
            "duration_minutes": 45,
            "participant_ids": [participant["id"]],
        },
    )
    assert session_response.status_code == 201
    research_session = session_response.json()
    upload = client.post(
        f"/api/projects/{project['id']}/sessions/{research_session['id']}/documents",
        files={
            "file": (
                "mobile-checkout.txt",
                b"Jordan Moore:\nThe order summary disappeared and I was confused about the checkout progress.",
                "text/plain",
            )
        },
    )
    assert upload.status_code == 201
    return project, research_session, upload.json()


def test_session_theme_report_and_conversation_contracts(client: TestClient) -> None:
    project, research_session, document = _workspace(client)
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"

    generated_themes = client.post(f"{root}/themes/generate")
    assert generated_themes.status_code == 200
    themes = generated_themes.json()["themes"]
    assert themes
    assert themes[0]["project_id"] == project["id"]
    assert themes[0]["session_id"] == research_session["id"]
    assert themes[0]["evidence"][0]["document_id"] == document["id"]

    reviewed = client.patch(
        f"{root}/themes/{themes[0]['id']}",
        json={"status": "researcher-reviewed", "name": "Reviewed checkout confidence"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "researcher-reviewed"

    generated_report = client.post(f"{root}/report/generate")
    assert generated_report.status_code == 200
    report = generated_report.json()["report"]
    assert [item["type"] for item in report["items"]] == [
        "requirement",
        "decision",
        "action-item",
        "open-question",
        "key-insight",
    ]
    assert report["participants"][0]["name"] == "Jordan Moore"
    assert report["detailed_notes"].startswith("Across ")
    assert "detailed patterns" in report["detailed_notes"].lower()
    decision = next(item for item in report["items"] if item["type"] == "decision")
    action_item = next(item for item in report["items"] if item["type"] == "action-item")
    assert decision["ownership"] == {
        "role": "decision-maker",
        "value": None,
        "status": "needs-review",
        "rationale": None,
    }
    assert action_item["ownership"]["role"] == "assignee"
    owned_decision = client.patch(
        f"{root}/report/items/{decision['id']}",
        json={
            "summary": "",
            "ownership": {"status": "confirmed", "value": "Research operations"},
        },
    )
    assert owned_decision.status_code == 200
    saved_decision = next(item for item in owned_decision.json()["items"] if item["id"] == decision["id"])
    assert saved_decision["summary"] == ""
    assert saved_decision["ownership"] == {
        "role": "decision-maker",
        "value": "Research operations",
        "status": "confirmed",
        "rationale": None,
    }
    owned_action = client.patch(
        f"{root}/report/items/{action_item['id']}",
        json={
            "ownership": {"status": "confirmed", "value": "Content design"},
        },
    )
    assert owned_action.status_code == 200
    saved_action = next(item for item in owned_action.json()["items"] if item["id"] == action_item["id"])
    assert saved_action["ownership"]["value"] == "Content design"
    persisted_report = client.get(f"{root}/report").json()
    persisted_decision = next(item for item in persisted_report["items"] if item["id"] == decision["id"])
    assert persisted_decision["ownership"]["value"] == "Research operations"
    edited_item = client.patch(
        f"{root}/report/items/{report['items'][0]['id']}",
        json={"title": "Require a persistent order summary", "summary": "Keep the order summary visible throughout checkout."},
    )
    assert edited_item.status_code == 200
    assert edited_item.json()["items"][0]["title"] == "Require a persistent order summary"
    assert edited_item.json()["items"][0]["provenance"].startswith("Researcher Edited")
    edited_report = client.patch(
        f"{root}/report",
        json={"executive_summary": "Researchers confirmed the checkout context problem.", "detailed_notes": "The persistent summary is the primary follow-up."},
    )
    assert edited_report.status_code == 200
    assert edited_report.json()["executive_summary"] == "Researchers confirmed the checkout context problem."
    assert edited_report.json()["detailed_notes"] == "The persistent summary is the primary follow-up."
    assert client.patch(f"{root}/report", json={"status": "approved"}).json()["status"] == "approved"
    revision = client.post(f"{root}/report/revisions")
    assert revision.status_code == 201
    assert revision.json()["status"] == "ai-generated"
    revised_decision = next(item for item in revision.json()["items"] if item["type"] == "decision")
    assert revised_decision["ownership"]["value"] == "Research operations"

    conversation = client.get(f"{root}/conversations")
    assert conversation.status_code == 200
    assert conversation.json()["turns"] == []
    answer = client.post(
        f"{root}/conversations/ask",
        json={"question": "What caused checkout confusion?"},
    )
    assert answer.status_code == 200
    assert [turn["role"] for turn in answer.json()["conversation"]["turns"]] == ["researcher", "assistant"]
    assert answer.json()["answer"]["citations"][0]["document_id"] == document["id"]


def test_session_synthesis_enforces_nested_project_ownership(client: TestClient) -> None:
    project, research_session, _document = _workspace(client)
    other_project = client.post("/api/projects", json={"name": "Other Project", "description": None}).json()
    response = client.get(f"/api/projects/{other_project['id']}/sessions/{research_session['id']}/themes")
    assert response.status_code == 404
    assert client.get(f"/api/projects/{project['id']}/sessions/{research_session['id']}/themes").status_code == 200
