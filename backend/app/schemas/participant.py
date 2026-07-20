from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ParticipantBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=320)
    organization: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=200)
    record_ids: list[str] = Field(default_factory=list)
    researcher_notes: str | None = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    last_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=320)
    organization: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=200)
    record_ids: list[str] | None = None
    researcher_notes: str | None = None


class ParticipantRead(ParticipantBase):
    id: str
    project_id: str
    session_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
