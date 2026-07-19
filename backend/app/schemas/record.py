from datetime import datetime
from typing import Literal

from app.schemas.document import TranscriptContext
from app.schemas.research_session import SessionRead
from pydantic import BaseModel, Field


class RecordCatalogRead(BaseModel):
    id: str
    name: str
    description: str
    related_session_count: int
    eligible_session_count: int
    readiness: Literal["ready", "needs-data", "up-to-date"]
    latest_synthesis_at: datetime | None


class RecordAssignment(BaseModel):
    record_id: str | None


class RecordSynthesisGenerateRequest(BaseModel):
    client_request_key: str | None = Field(default=None, min_length=1, max_length=160)


class RecordSynthesisSourceSessionRead(BaseModel):
    id: str
    title: str
    report_id: str
    report_status: Literal["ai-generated", "researcher-reviewed", "approved", "superseded"]


class RecordSynthesisExcludedSessionRead(BaseModel):
    id: str
    title: str
    reason: str


class RecordSynthesisEligibilityRead(BaseModel):
    record_id: str
    description: str
    minimum_eligible_sessions: int
    included_sessions: list[RecordSynthesisSourceSessionRead]
    excluded_sessions: list[RecordSynthesisExcludedSessionRead]


class RecordSynthesisItemRead(BaseModel):
    id: str
    type: Literal["requirement", "decision", "action-item"]
    status: Literal["ai-generated", "researcher-reviewed", "approved", "superseded"]
    title: str
    summary: str
    evidence_preview: str
    source_session_count: int
    source_report_item_count: int
    provenance: str
    evidence_ids: list[str]


class RecordSynthesisItemUpdate(BaseModel):
    status: Literal["ai-generated", "researcher-reviewed", "approved", "superseded"]


class RecordSynthesisRead(BaseModel):
    id: str
    record_id: str
    status: Literal["not-generated", "processing", "complete", "failed"]
    generated_at: datetime | None
    source_session_count: int
    source_report_revision_count: int
    provider: str | None
    model: str | None
    prompt_version: str | None
    items: list[RecordSynthesisItemRead]
    error_message: str | None


class RecordSynthesisEvidenceRead(BaseModel):
    id: str
    record_id: str
    item_id: str
    item_title: str
    project_id: str
    session_id: str
    session_title: str
    context: TranscriptContext


class GeneratedRecordSynthesisItem(BaseModel):
    type: Literal["requirement", "decision", "action-item"]
    title: str = Field(min_length=1, max_length=240)
    summary: str = Field(min_length=1)
    source_report_item_ids: list[str] = Field(min_length=1)


class GeneratedRecordSynthesisPayload(BaseModel):
    items: list[GeneratedRecordSynthesisItem] = Field(min_length=1)


RecordSessionsRead = list[SessionRead]
