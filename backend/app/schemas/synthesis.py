from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ThemeStatus = Literal["ai-generated", "researcher-reviewed", "approved", "rejected"]
ReportStatus = Literal["ai-generated", "researcher-reviewed", "approved", "superseded"]


class SessionEvidenceRead(BaseModel):
    id: str
    document_id: str
    document_name: str
    speaker: str
    location: str
    excerpt: str
    relevance: float
    context_result_id: str


class SessionThemeRead(BaseModel):
    id: str
    project_id: str
    session_id: str
    name: str
    summary: str
    status: ThemeStatus
    confidence: float
    source_label: str
    evidence: list[SessionEvidenceRead]


class SessionThemeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    summary: str | None = Field(default=None, min_length=1)
    status: ThemeStatus | None = None


class SessionThemeGenerateResponse(BaseModel):
    themes: list[SessionThemeRead]
    message: str


class SessionReportParticipantRead(BaseModel):
    id: str
    name: str
    role: str | None
    organization: str | None
    notes: str | None


class SessionReportItemRead(BaseModel):
    id: str
    type: Literal["requirement", "decision", "action-item", "open-question", "key-insight"]
    title: str
    summary: str
    provenance: str
    evidence: list[SessionEvidenceRead]


class SessionReportRead(BaseModel):
    id: str
    project_id: str
    session_id: str
    status: ReportStatus
    session_title: str
    session_type: str
    session_date: datetime
    duration_minutes: int | None
    participants: list[SessionReportParticipantRead]
    executive_summary: str
    items: list[SessionReportItemRead]
    detailed_notes: str
    generated_at: datetime


class SessionReportGenerateResponse(BaseModel):
    report: SessionReportRead
    message: str


class SessionReportUpdate(BaseModel):
    status: ReportStatus


class SessionCitationRead(BaseModel):
    id: str
    document_id: str
    document_name: str
    speaker: str
    location: str
    excerpt: str
    context_result_id: str


class SessionConversationTurnRead(BaseModel):
    id: str
    role: Literal["researcher", "assistant"]
    content: str
    citations: list[SessionCitationRead]
    created_at: datetime


class SessionConversationRead(BaseModel):
    id: str
    project_id: str
    session_id: str
    status: Literal["saved", "archived", "deleted"]
    turns: list[SessionConversationTurnRead]


class AskSessionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class AskSessionResponse(BaseModel):
    conversation: SessionConversationRead
    answer: SessionConversationTurnRead
