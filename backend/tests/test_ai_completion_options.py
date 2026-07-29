import json
from types import SimpleNamespace

import pytest

from app.services.ai_completion_options import completion_model_options
from app.services import transcript_coding_service


@pytest.mark.parametrize("model", ["gpt-5.6-terra", "openai/gpt-5", "o1-mini", "o3"])
def test_openai_reasoning_models_use_their_default_temperature(model: str) -> None:
    assert completion_model_options("openai", model) == {"custom_llm_provider": "openai"}
    assert completion_model_options("openrouter", model) == {"custom_llm_provider": "openrouter"}


def test_non_reasoning_models_keep_low_temperature() -> None:
    assert completion_model_options("openai", "gpt-4.1-mini") == {
        "custom_llm_provider": "openai",
        "temperature": 0.2,
    }
    assert completion_model_options("anthropic", "claude-sonnet-4") == {
        "custom_llm_provider": "anthropic",
        "temperature": 0.2,
    }
    assert completion_model_options("azure_openai", "gpt-4.1-mini") == {
        "custom_llm_provider": "azure",
        "temperature": 0.2,
    }


def test_live_code_suggestions_omit_temperature_for_gpt_5_6_terra(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict = {}

    def fake_completion(**kwargs):
        captured.update(kwargs)
        content = json.dumps(
            {
                "suggestions": [
                    {
                        "name": "Duplicate billing",
                        "description": "Potential duplicate billing evidence.",
                        "confidence": 0.9,
                        "chunk_ids": ["chunk-1"],
                    }
                ]
            }
        )
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    import litellm

    monkeypatch.setattr(litellm, "completion", fake_completion)
    monkeypatch.setattr(transcript_coding_service.theme_service, "_api_key_for_provider", lambda _provider: "test-key")

    suggestions = transcript_coding_service._live_suggestions(
        SimpleNamespace(provider="openai", model="gpt-5.6-terra", base_url=None),
        [SimpleNamespace(id="chunk-1", text="Priya: Duplicate billing appears in this claim.")],
    )

    assert suggestions[0].name == "Duplicate billing"
    assert captured["model"] == "gpt-5.6-terra"
    assert captured["custom_llm_provider"] == "openai"
    assert "temperature" not in captured
    assert captured["response_format"] == {"type": "json_object"}
