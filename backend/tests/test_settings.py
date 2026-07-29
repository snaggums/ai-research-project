from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings as app_settings


pytestmark = pytest.mark.integration


def _save_openai_settings(client: TestClient, model: str = "gpt-5.6-terra") -> None:
    response = client.put(
        "/api/settings/ai",
        json={
            "provider": "openai",
            "model": model,
            "base_url": None,
            "embedding_provider": "mock",
            "embedding_model": "mock-hash-64",
        },
    )
    assert response.status_code == 200


def test_provider_verification_uses_saved_model_and_sends_no_research_data(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(app_settings, "openai_api_key", "test-secret")
    _save_openai_settings(client)
    captured: dict = {}

    def fake_completion(**kwargs):
        captured.update(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="OK"))])

    import litellm

    monkeypatch.setattr(litellm, "completion", fake_completion)
    response = client.post("/api/settings/ai/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["message"] == "Connected to openai using gpt-5.6-terra. No research data was sent."
    assert captured["model"] == "gpt-5.6-terra"
    assert captured["api_key"] == "test-secret"
    assert captured["max_tokens"] == 8
    assert captured["timeout"] == 15
    assert captured["custom_llm_provider"] == "openai"
    assert "temperature" not in captured
    prompt = " ".join(message["content"] for message in captured["messages"])
    assert prompt == "This is a provider connection test. Reply with exactly OK. Reply with OK."
    assert all(term not in prompt for term in ("Project", "Session", "Transcript", "Participant"))


def test_provider_verification_reports_a_missing_api_key_without_calling_provider(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(app_settings, "openai_api_key", None)
    _save_openai_settings(client)

    def unexpected_completion(**_kwargs):
        pytest.fail("The provider must not be called without an API key.")

    import litellm

    monkeypatch.setattr(litellm, "completion", unexpected_completion)
    response = client.post("/api/settings/ai/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is False
    assert body["has_api_key"] is False
    assert body["message"] == (
        "API key not detected. Set OPENAI_API_KEY in backend/.env and restart the backend before testing openai."
    )


def test_provider_verification_returns_actionable_failure_and_redacts_the_key(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(app_settings, "openai_api_key", "test-secret")
    _save_openai_settings(client)

    def failed_completion(**_kwargs):
        raise RuntimeError("Authentication failed for test-secret")

    import litellm

    monkeypatch.setattr(litellm, "completion", failed_completion)
    response = client.post("/api/settings/ai/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is False
    assert body["has_api_key"] is True
    assert body["message"].startswith("Could not connect to openai using gpt-5.6-terra.")
    assert "Provider error: Authentication failed for [redacted]" in body["message"]
    assert "test-secret" not in body["message"]


def test_mock_provider_remains_explicitly_non_external(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    response = client.put(
        "/api/settings/ai",
        json={
            "provider": "mock",
            "model": "mock-chat",
            "base_url": None,
            "embedding_provider": "mock",
            "embedding_model": "mock-hash-64",
        },
    )
    assert response.status_code == 200

    def unexpected_completion(**_kwargs):
        pytest.fail("The mock provider must not make an external request.")

    import litellm

    monkeypatch.setattr(litellm, "completion", unexpected_completion)
    response = client.post("/api/settings/ai/test")

    assert response.status_code == 200
    assert response.json()["message"] == "Mock configuration verified. No external provider was contacted."
