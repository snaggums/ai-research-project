from datetime import datetime, timezone
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, Float, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


def _now() -> datetime:
    return datetime.now(timezone.utc)


class RecordCode(Base):
    __tablename__ = "record_codes"
    __table_args__ = (
        CheckConstraint("status IN ('active','archived')", name="ck_record_codes_status"),
        UniqueConstraint("record_id", "normalized_name", name="uq_record_codes_record_normalized_name"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    record_id: Mapped[str] = mapped_column(Text, ForeignKey("records.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now, server_default=func.now())


class TranscriptHighlight(Base):
    __tablename__ = "transcript_highlights"
    __table_args__ = (
        CheckConstraint("origin IN ('researcher','ai-suggestion')", name="ck_transcript_highlights_origin"),
        CheckConstraint("end_char > start_char", name="ck_transcript_highlights_offsets"),
        UniqueConstraint("document_id", "start_char", "end_char", name="uq_transcript_highlights_anchor"),
        UniqueConstraint("session_id", "client_request_key", name="uq_transcript_highlights_request_key"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    block_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_char: Mapped[int] = mapped_column(Integer, nullable=False)
    end_char: Mapped[int] = mapped_column(Integer, nullable=False)
    excerpt_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    speaker: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    end_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    content_checksum: Mapped[str] = mapped_column(Text, nullable=False)
    origin: Mapped[str] = mapped_column(Text, nullable=False, default="researcher", server_default="researcher")
    client_request_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    assignments: Mapped[list["HighlightCodeAssignment"]] = relationship(
        back_populates="highlight",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CodeSuggestionRun(Base):
    __tablename__ = "code_suggestion_runs"
    __table_args__ = (
        CheckConstraint("status IN ('queued','processing','complete','failed')", name="ck_code_suggestion_runs_status"),
        UniqueConstraint("session_id", "client_request_key", name="uq_code_suggestion_runs_request_key"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    record_id: Mapped[str] = mapped_column(Text, ForeignKey("records.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="queued", server_default="queued")
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_version: Mapped[str] = mapped_column(Text, nullable=False)
    content_checksum: Mapped[str] = mapped_column(Text, nullable=False)
    client_request_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    suggestions: Mapped[list["CodeSuggestion"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CodeSuggestion(Base):
    __tablename__ = "code_suggestions"
    __table_args__ = (
        CheckConstraint("status IN ('awaiting-review','accepted','rejected')", name="ck_code_suggestions_status"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("code_suggestion_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id: Mapped[str] = mapped_column(Text, ForeignKey("records.id", ondelete="RESTRICT"), nullable=False, index=True)
    proposed_name: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="awaiting-review", server_default="awaiting-review")
    was_edited: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    accepted_code_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("record_codes.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_request_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    run: Mapped[CodeSuggestionRun] = relationship(back_populates="suggestions")
    evidence: Mapped[list["CodeSuggestionEvidence"]] = relationship(
        back_populates="suggestion",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="CodeSuggestionEvidence.display_order",
    )


class CodeSuggestionEvidence(Base):
    __tablename__ = "code_suggestion_evidence"
    __table_args__ = (
        CheckConstraint("end_char > start_char", name="ck_code_suggestion_evidence_offsets"),
        UniqueConstraint("suggestion_id", "display_order", name="uq_code_suggestion_evidence_order"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    suggestion_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("code_suggestions.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    block_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_char: Mapped[int] = mapped_column(Integer, nullable=False)
    end_char: Mapped[int] = mapped_column(Integer, nullable=False)
    excerpt_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    speaker: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    end_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    content_checksum: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    suggestion: Mapped[CodeSuggestion] = relationship(back_populates="evidence")


class HighlightCodeAssignment(Base):
    __tablename__ = "highlight_code_assignments"
    __table_args__ = (
        CheckConstraint(
            "assignment_origin IN ('researcher','accepted-suggestion','edited-suggestion')",
            name="ck_highlight_code_assignments_origin",
        ),
    )

    highlight_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("transcript_highlights.id", ondelete="CASCADE"),
        primary_key=True,
    )
    code_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("record_codes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    assignment_origin: Mapped[str] = mapped_column(Text, nullable=False, default="researcher", server_default="researcher")
    suggestion_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("code_suggestions.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, server_default=func.now())
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    highlight: Mapped[TranscriptHighlight] = relationship(back_populates="assignments")
    code: Mapped[RecordCode] = relationship()
