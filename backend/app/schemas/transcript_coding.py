from datetime import datetime
from typing import Literal

from app.schemas.research_session import SessionReference
from pydantic import BaseModel, Field, model_validator


class TranscriptCodingBlock(BaseModel):
    id: str
    chunk_id: str | None
    speaker: str
    location: str
    text: str
    start_char: int
    end_char: int


class TranscriptAnchor(BaseModel):
    document_id: str
    chunk_id: str | None
    block_id: str | None
    start_char: int
    end_char: int
    excerpt_snapshot: str
    speaker: str | None
    location: str | None
    start_ms: int | None
    end_ms: int | None
    content_checksum: str


class TranscriptAnchorCreate(BaseModel):
    chunk_id: str | None = None
    block_id: str | None = None
    start_char: int
    end_char: int
    excerpt_snapshot: str
    speaker: str | None = None
    location: str | None = None
    start_ms: int | None = Field(default=None, ge=0)
    end_ms: int | None = Field(default=None, ge=0)
    content_checksum: str


class RecordCodeRead(BaseModel):
    id: str
    record_id: str
    name: str
    description: str | None
    status: Literal["active", "archived"]
    created_at: datetime
    updated_at: datetime


class RecordCodeSupportingHighlightRead(BaseModel):
    id: str
    project_id: str
    project_name: str
    session_id: str
    session_title: str
    excerpt: str
    speaker: str | None
    location: str | None


class RecordCodeEvidenceGroupRead(BaseModel):
    session_id: str
    session_title: str
    highlights: list[RecordCodeSupportingHighlightRead]


class RecordAcceptedCodeRead(BaseModel):
    id: str
    record_id: str
    name: str
    description: str | None
    accepted_highlight_count: int
    session_count: int
    latest_evidence_at: datetime
    evidence_groups: list[RecordCodeEvidenceGroupRead]


class RecordTranscriptCodesRead(BaseModel):
    record_id: str
    accepted_code_count: int
    session_count: int
    codes: list[RecordAcceptedCodeRead]


class RecordCodeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1200)


class RecordCodeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1200)


class NewRecordCode(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1200)


class TranscriptHighlightRead(BaseModel):
    id: str
    project_id: str
    session_id: str
    document_id: str
    anchor: TranscriptAnchor
    origin: Literal["researcher", "ai-suggestion"]
    codes: list[RecordCodeRead]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class TranscriptHighlightCreate(BaseModel):
    anchor: TranscriptAnchorCreate
    code_ids: list[str] = Field(default_factory=list)
    new_code: NewRecordCode | None = None


class TranscriptHighlightUpdate(BaseModel):
    code_ids: list[str]


class HighlightCodesUpdate(BaseModel):
    code_ids: list[str] = Field(min_length=1)


class TranscriptCodeSuggestionEvidenceRead(BaseModel):
    id: str
    anchor: TranscriptAnchor
    display_order: int


class TranscriptCodeSuggestionRead(BaseModel):
    id: str
    run_id: str
    record_id: str
    proposed_name: str
    proposed_description: str | None
    confidence: float | None
    status: Literal["awaiting-review", "accepted", "rejected"]
    was_edited: bool
    accepted_code_id: str | None
    reviewed_at: datetime | None
    evidence: list[TranscriptCodeSuggestionEvidenceRead]


class TranscriptCodeSuggestionUpdate(BaseModel):
    proposed_name: str | None = Field(default=None, min_length=1, max_length=120)
    proposed_description: str | None = Field(default=None, max_length=1200)

    @model_validator(mode="after")
    def require_change(self):
        if "proposed_name" not in self.model_fields_set and "proposed_description" not in self.model_fields_set:
            raise ValueError("Provide a proposed name or description.")
        return self


class SuggestionRunRead(BaseModel):
    id: str | None
    status: Literal["idle", "queued", "processing", "complete", "failed"]
    error_detail: str | None


class TranscriptCodingTranscriptRead(BaseModel):
    content_checksum: str
    blocks: list[TranscriptCodingBlock]


class TranscriptCodingWorkspaceRead(BaseModel):
    project_id: str
    session_id: str
    document_id: str
    record: SessionReference | None
    transcript: TranscriptCodingTranscriptRead
    suggestion_run: SuggestionRunRead
    codes: list[RecordCodeRead]
    highlights: list[TranscriptHighlightRead]
    suggestions: list[TranscriptCodeSuggestionRead]
