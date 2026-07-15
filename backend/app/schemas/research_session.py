from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.participant import ParticipantRead

SessionType = Literal["interview", "usability-test", "focus-group", "working-session", "design-critique", "other"]


class SessionReference(BaseModel):
    id: str
    name: str


class SessionBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    type: SessionType
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=0, le=24 * 60)
    description: str | None = None
    participant_ids: list[str] = Field(default_factory=list)
    related_record_ids: list[str] = Field(default_factory=list)
    related_common_component_ids: list[str] = Field(default_factory=list)


class SessionCreate(SessionBase):
    related_records: list[SessionReference] = Field(default_factory=list)
    related_common_components: list[SessionReference] = Field(default_factory=list)


class SessionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    type: SessionType | None = None
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=0, le=24 * 60)
    description: str | None = None
    participant_ids: list[str] | None = None
    related_record_ids: list[str] | None = None
    related_common_component_ids: list[str] | None = None
    related_records: list[SessionReference] | None = None
    related_common_components: list[SessionReference] | None = None


class SessionRead(BaseModel):
    id: str
    project_id: str
    title: str
    type: SessionType
    starts_at: datetime | None
    duration_minutes: int | None
    description: str | None
    participants: list[ParticipantRead]
    participant_ids: list[str]
    document_count: int
    transcript_names: list[str]
    transcript_status: Literal["none", "uploaded", "processing", "complete", "failed"]
    has_primary_transcript: bool
    theme_status: Literal["not-generated", "generating", "ai-generated", "researcher-reviewed", "approved", "superseded", "failed"]
    report_status: Literal["not-generated", "generating", "ai-generated", "researcher-reviewed", "approved", "superseded", "failed"]
    related_records: list[SessionReference]
    related_common_components: list[SessionReference]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionFilters(BaseModel):
    q: str | None = None
    type: SessionType | None = None
    transcript_status: str | None = None
    analysis_status: str | None = None
    date: str | None = None
    record_id: str | None = None
    common_component_id: str | None = None
