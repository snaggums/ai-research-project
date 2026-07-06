import os
from datetime import datetime, timezone

from app.models.settings import AISettings
from app.schemas.settings import AISettingsTestResponse, AISettingsUpdate
from sqlalchemy import select
from sqlalchemy.orm import Session

DEFAULT_PROVIDER = "openai"
DEFAULT_MODEL = "gpt-4.1-mini"
DEFAULT_EMBEDDING_PROVIDER = "mock"
DEFAULT_EMBEDDING_MODEL = "mock-hash-64"

PROVIDER_ENV_VARS = {
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "gemini": "GEMINI_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "azure": "AZURE_OPENAI_API_KEY",
    "azure_openai": "AZURE_OPENAI_API_KEY",
    "ollama": None,
    "mock": None,
}


def get_or_create_settings(db: Session) -> AISettings:
    settings = db.scalar(select(AISettings).limit(1))
    if settings is not None:
        _refresh_key_status(settings)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    settings = AISettings(
        provider=DEFAULT_PROVIDER,
        model=DEFAULT_MODEL,
        embedding_provider=DEFAULT_EMBEDDING_PROVIDER,
        embedding_model=DEFAULT_EMBEDDING_MODEL,
    )
    _refresh_key_status(settings)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_settings(db: Session, payload: AISettingsUpdate) -> AISettings:
    settings = get_or_create_settings(db)
    settings.provider = _normalize_provider(payload.provider)
    settings.model = payload.model.strip()
    settings.base_url = payload.base_url.strip() if payload.base_url else None
    settings.embedding_provider = _normalize_provider(payload.embedding_provider)
    settings.embedding_model = payload.embedding_model.strip()
    settings.updated_at = datetime.now(timezone.utc)
    _refresh_key_status(settings)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def test_settings(db: Session) -> AISettingsTestResponse:
    settings = get_or_create_settings(db)
    provider = _normalize_provider(settings.provider)
    api_key_env_var = _key_env_var_for_provider(provider)
    has_api_key = _has_key(api_key_env_var)
    settings.api_key_env_var = api_key_env_var
    settings.has_api_key = has_api_key
    db.add(settings)
    db.commit()
    db.refresh(settings)

    if provider in {"mock", "ollama"}:
        return AISettingsTestResponse(
            ok=True,
            message=f"{provider} does not require a stored API key for this local MVP check.",
            provider=settings.provider,
            model=settings.model,
            api_key_env_var=settings.api_key_env_var,
            has_api_key=settings.has_api_key,
        )

    if not api_key_env_var:
        return AISettingsTestResponse(
            ok=False,
            message=f"No environment variable mapping exists for provider '{settings.provider}'.",
            provider=settings.provider,
            model=settings.model,
            api_key_env_var=None,
            has_api_key=False,
        )

    if not has_api_key:
        return AISettingsTestResponse(
            ok=False,
            message=f"Set {api_key_env_var} in backend/.env to test {settings.provider}. The key is not stored in the database.",
            provider=settings.provider,
            model=settings.model,
            api_key_env_var=api_key_env_var,
            has_api_key=False,
        )

    return AISettingsTestResponse(
        ok=True,
        message=f"{api_key_env_var} is present. Live provider calls will be added in a later sprint.",
        provider=settings.provider,
        model=settings.model,
        api_key_env_var=api_key_env_var,
        has_api_key=True,
    )


def _refresh_key_status(settings: AISettings) -> None:
    api_key_env_var = _key_env_var_for_provider(settings.provider)
    settings.api_key_env_var = api_key_env_var
    settings.has_api_key = _has_key(api_key_env_var)


def _key_env_var_for_provider(provider: str) -> str | None:
    return PROVIDER_ENV_VARS.get(_normalize_provider(provider))


def _normalize_provider(provider: str) -> str:
    return provider.strip().lower().replace(" ", "_")


def _has_key(api_key_env_var: str | None) -> bool:
    return bool(api_key_env_var and os.getenv(api_key_env_var))
