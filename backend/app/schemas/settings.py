from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AISettingsUpdate(BaseModel):
    provider: str = Field(default="openai", min_length=1, max_length=80)
    model: str = Field(default="gpt-4.1-mini", min_length=1, max_length=160)
    base_url: str | None = None
    embedding_provider: str = Field(default="mock", min_length=1, max_length=80)
    embedding_model: str = Field(default="mock-hash-64", min_length=1, max_length=160)


class AISettingsRead(AISettingsUpdate):
    id: str
    api_key_env_var: str | None
    has_api_key: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AISettingsTestResponse(BaseModel):
    ok: bool
    message: str
    provider: str
    model: str
    api_key_env_var: str | None
    has_api_key: bool
