from fastapi.testclient import TestClient
import pytest


pytestmark = pytest.mark.integration


def _project(client: TestClient, name: str = "Transcript Coding Project") -> dict:
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
    response = client.post("/api/projects", json={"name": name, "description": "Transcript Coding persistence"})
    assert response.status_code == 201
    return response.json()


def _session(client: TestClient, project_id: str, record_id: str | None = "record-1") -> dict:
    payload = {
        "title": "Checkout research interview",
        "type": "interview",
        "participant_ids": [],
        "related_record_ids": [record_id] if record_id else [],
    }
    response = client.post(f"/api/projects/{project_id}/sessions", json=payload)
    assert response.status_code == 201
    return response.json()


def _workspace(client: TestClient, project_id: str, session_id: str) -> dict:
    upload = client.post(
        f"/api/projects/{project_id}/sessions/{session_id}/documents",
        files={
            "file": (
                "interview.txt",
                (
                    b"Jordan Moore:\n"
                    b"I expected uploaded transcripts to be under Documents, but the menu called it Source Material.\n\n"
                    b"Jordan Moore:\n"
                    b"The navigation labels made the workflow confusing and reduced my confidence."
                ),
                "text/plain",
            )
        },
    )
    assert upload.status_code == 201
    response = client.get(f"/api/projects/{project_id}/sessions/{session_id}/coding")
    assert response.status_code == 200, response.text
    return response.json()


def _anchor(workspace: dict, start_offset: int = 0, end_offset: int | None = None) -> dict:
    block = workspace["transcript"]["blocks"][0]
    text = block["text"]
    end_offset = len(text) if end_offset is None else end_offset
    return {
        "chunk_id": block["chunk_id"],
        "block_id": block["id"],
        "start_char": block["start_char"] + start_offset,
        "end_char": block["start_char"] + end_offset,
        "excerpt_snapshot": text[start_offset:end_offset],
        "speaker": block["speaker"],
        "location": block["location"],
        "content_checksum": workspace["transcript"]["content_checksum"],
    }


def test_uncoded_highlight_is_persisted_without_a_record_and_is_idempotent(client: TestClient) -> None:
    project = _project(client)
    research_session = _session(client, project["id"], record_id=None)
    workspace = _workspace(client, project["id"], research_session["id"])
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    payload = {"anchor": _anchor(workspace, 0, 32), "code_ids": [], "new_code": None}

    first = client.post(f"{root}/highlights", json=payload, headers={"Idempotency-Key": "highlight-1"})
    replay = client.post(f"{root}/highlights", json=payload, headers={"Idempotency-Key": "highlight-1"})
    assert first.status_code == 201, first.text
    assert replay.status_code == 201, replay.text
    assert replay.json()["id"] == first.json()["id"]
    assert first.json()["codes"] == []

    listed = client.get(f"{root}/highlights", params={"status": "uncoded"})
    assert listed.status_code == 200
    assert [value["id"] for value in listed.json()] == [first.json()["id"]]

    cannot_code = client.post(
        f"{root}/highlights/{first.json()['id']}/codes",
        json={"code_ids": ["00000000-0000-0000-0000-000000000001"]},
        headers={"Idempotency-Key": "apply-without-record"},
    )
    assert cannot_code.status_code == 409
    assert cannot_code.json()["code"] == "record_required_for_code"


def test_manual_codes_assignments_filters_and_record_guard(client: TestClient) -> None:
    project = _project(client)
    research_session = _session(client, project["id"])
    workspace = _workspace(client, project["id"], research_session["id"])
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"

    code_response = client.post(
        "/api/records/record-1/codes",
        json={"name": "Navigation terminology", "description": "Labels and navigation language."},
        headers={"Idempotency-Key": "code-1"},
    )
    assert code_response.status_code == 201, code_response.text
    code = code_response.json()

    highlight_response = client.post(
        f"{root}/highlights",
        json={"anchor": _anchor(workspace, 0, 48), "code_ids": [code["id"]], "new_code": None},
        headers={"Idempotency-Key": "coded-highlight-1"},
    )
    assert highlight_response.status_code == 201, highlight_response.text
    highlight = highlight_response.json()
    assert [value["id"] for value in highlight["codes"]] == [code["id"]]
    assert highlight["anchor"]["chunk_id"] == workspace["transcript"]["blocks"][0]["chunk_id"]

    document_id = workspace["document_id"]
    protected_delete = client.delete(f"{root}/documents/{document_id}")
    assert protected_delete.status_code == 409
    assert protected_delete.json()["code"] == "transcript_confirmation_required"
    dependencies = client.get(f"{root}/documents/{document_id}/dependencies")
    assert dependencies.status_code == 200
    assert dependencies.json()["accepted_highlight_count"] == 1
    assert dependencies.json()["uncoded_highlight_count"] == 0

    accepted = client.get(
        f"{root}/highlights",
        params=[("status", "accepted-coded"), ("code_id", code["id"])],
    )
    assert accepted.status_code == 200
    assert [value["id"] for value in accepted.json()] == [highlight["id"]]

    record_highlights = client.get(
        "/api/records/record-1/highlights",
        params=[("status", "accepted-coded"), ("code_id", code["id"]), ("view", "list")],
    )
    assert record_highlights.status_code == 200
    assert [value["id"] for value in record_highlights.json()] == [highlight["id"]]
    assert record_highlights.json()[0]["session_id"] == research_session["id"]

    invalid_cursor = client.get(f"{root}/highlights", params={"cursor": "missing-highlight"})
    assert invalid_cursor.status_code == 422
    assert invalid_cursor.json()["code"] == "invalid_cursor"

    blocked = client.patch(
        f"/api/projects/{project['id']}/sessions/{research_session['id']}",
        json={"related_record_ids": ["record-2"]},
    )
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "record_change_blocked_by_codes"

    removed = client.delete(
        f"{root}/highlights/{highlight['id']}/codes/{code['id']}",
        headers={"Idempotency-Key": "remove-code-1"},
    )
    assert removed.status_code == 200
    assert removed.json()["codes"] == []

    unblocked = client.patch(
        f"/api/projects/{project['id']}/sessions/{research_session['id']}",
        json={"related_record_ids": ["record-2"]},
    )
    assert unblocked.status_code == 200, unblocked.text
    assert unblocked.json()["related_records"][0]["id"] == "record-2"


def test_replacement_preserves_codes_but_excludes_archived_highlights_from_current_counts(
    client: TestClient,
) -> None:
    project = _project(client)
    research_session = _session(client, project["id"])
    workspace = _workspace(client, project["id"], research_session["id"])
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    code = client.post(
        "/api/records/record-1/codes",
        json={"name": "Preserved Record code"},
        headers={"Idempotency-Key": "preserved-code"},
    ).json()
    created = client.post(
        f"{root}/highlights",
        json={"anchor": _anchor(workspace, 0, 36), "code_ids": [code["id"]], "new_code": None},
        headers={"Idempotency-Key": "archived-highlight"},
    )
    assert created.status_code == 201

    replacement = client.post(
        f"{root}/transcript-replacement",
        headers={"Idempotency-Key": "replacement-with-history"},
        files={"file": ("replacement.txt", b"Moderator: This replacement is the current source.", "text/plain")},
    )
    assert replacement.status_code == 201

    current_workspace = client.get(f"{root}/coding")
    assert current_workspace.status_code == 200
    assert current_workspace.json()["document_id"] != workspace["document_id"]
    assert current_workspace.json()["highlights"] == []

    record_highlights = client.get(
        "/api/records/record-1/highlights",
        params={"status": "accepted-coded"},
    )
    assert record_highlights.status_code == 200
    assert record_highlights.json() == []

    record_codes = client.get("/api/records/record-1/codes")
    assert record_codes.status_code == 200
    assert any(value["id"] == code["id"] for value in record_codes.json())


def test_stale_and_cross_record_anchors_are_rejected(client: TestClient) -> None:
    project = _project(client)
    research_session = _session(client, project["id"])
    workspace = _workspace(client, project["id"], research_session["id"])
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"
    anchor = _anchor(workspace, 0, 24)
    anchor["content_checksum"] = "sha256:stale"

    stale = client.post(
        f"{root}/highlights",
        json={"anchor": anchor, "code_ids": [], "new_code": None},
        headers={"Idempotency-Key": "stale-anchor"},
    )
    assert stale.status_code == 409
    assert stale.json()["code"] == "stale_transcript_anchor"

    other_code = client.post(
        "/api/records/record-2/codes",
        json={"name": "Other Record Code"},
        headers={"Idempotency-Key": "other-code"},
    ).json()
    cross_record = client.post(
        f"{root}/highlights",
        json={"anchor": _anchor(workspace, 0, 24), "code_ids": [other_code["id"]], "new_code": None},
        headers={"Idempotency-Key": "cross-record"},
    )
    assert cross_record.status_code == 422
    assert cross_record.json()["code"] == "cross_record_code"


def test_suggestion_review_is_transactional_and_idempotent(client: TestClient) -> None:
    project = _project(client)
    research_session = _session(client, project["id"])
    _workspace(client, project["id"], research_session["id"])
    root = f"/api/projects/{project['id']}/sessions/{research_session['id']}"

    generated = client.post(
        f"{root}/code-suggestions/generate",
        headers={"Idempotency-Key": "suggestion-run-1"},
    )
    assert generated.status_code == 201, generated.text
    workspace = generated.json()
    assert workspace["suggestion_run"]["status"] == "complete", workspace["suggestion_run"]
    assert workspace["suggestions"]
    suggestion = workspace["suggestions"][0]
    assert suggestion["status"] == "awaiting-review"
    assert suggestion["evidence"]

    edited = client.patch(
        f"{root}/code-suggestions/{suggestion['id']}",
        json={"proposed_name": "Edited navigation terminology"},
        headers={"Idempotency-Key": "edit-suggestion-1"},
    )
    assert edited.status_code == 200
    assert edited.json()["was_edited"] is True

    accepted = client.post(
        f"{root}/code-suggestions/{suggestion['id']}/accept",
        headers={"Idempotency-Key": "accept-suggestion-1"},
    )
    replay = client.post(
        f"{root}/code-suggestions/{suggestion['id']}/accept",
        headers={"Idempotency-Key": "accept-suggestion-1"},
    )
    assert accepted.status_code == 200, accepted.text
    assert replay.status_code == 200, replay.text
    accepted_workspace = accepted.json()
    accepted_suggestion = next(value for value in accepted_workspace["suggestions"] if value["id"] == suggestion["id"])
    assert accepted_suggestion["status"] == "accepted"
    assert accepted_suggestion["accepted_code_id"]
    assert len(accepted_workspace["highlights"]) == len(suggestion["evidence"])
    assert len(replay.json()["highlights"]) == len(accepted_workspace["highlights"])

    second_accept = client.post(
        f"{root}/code-suggestions/{suggestion['id']}/accept",
        headers={"Idempotency-Key": "different-accept-key"},
    )
    assert second_accept.status_code == 409
    assert second_accept.json()["code"] == "suggestion_already_reviewed"

    if len(workspace["suggestions"]) > 1:
        rejected_id = workspace["suggestions"][1]["id"]
        rejected = client.post(
            f"{root}/code-suggestions/{rejected_id}/reject",
            headers={"Idempotency-Key": "reject-suggestion-1"},
        )
        assert rejected.status_code == 200
        assert rejected.json()["status"] == "rejected"
