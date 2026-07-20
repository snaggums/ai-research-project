from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.chunk import Chunk
    from app.models.document import Document
    from app.models.research_session import ResearchSession
    from app.models.session_report import SessionReport, SessionReportItem


class ProductRecord(Base):
    __tablename__ = "records"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    session_assignments: Mapped[list["SessionRecord"]] = relationship(back_populates="record", cascade="all, delete-orphan", passive_deletes=True)
    synthesis_runs: Mapped[list["RecordSynthesisRun"]] = relationship(back_populates="record", cascade="all, delete-orphan", passive_deletes=True)


class SessionRecord(Base):
    __tablename__ = "session_records"

    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), primary_key=True)
    record_id: Mapped[str] = mapped_column(Text, ForeignKey("records.id", ondelete="RESTRICT"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    session: Mapped["ResearchSession"] = relationship(back_populates="record_assignments")
    record: Mapped[ProductRecord] = relationship(back_populates="session_assignments")


class RecordSynthesisRun(Base):
    __tablename__ = "record_synthesis_runs"
    __table_args__ = (
        CheckConstraint("status IN ('queued','processing','complete','failed')", name="ck_record_synthesis_runs_status"),
        UniqueConstraint("record_id", "client_request_key", name="uq_record_synthesis_runs_request_key"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    record_id: Mapped[str] = mapped_column(Text, ForeignKey("records.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="queued", server_default="queued")
    client_request_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_session_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    source_report_revision_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    provider: Mapped[str | None] = mapped_column(Text, nullable=True)
    model: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    record: Mapped[ProductRecord] = relationship(back_populates="synthesis_runs")
    sources: Mapped[list["RecordSynthesisSource"]] = relationship(back_populates="run", cascade="all, delete-orphan", passive_deletes=True)
    items: Mapped[list["RecordSynthesisItem"]] = relationship(back_populates="run", cascade="all, delete-orphan", passive_deletes=True, order_by="RecordSynthesisItem.position")


class RecordSynthesisSource(Base):
    __tablename__ = "record_synthesis_sources"

    run_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("record_synthesis_runs.id", ondelete="CASCADE"), primary_key=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="RESTRICT"), primary_key=True)
    report_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("session_reports.id", ondelete="RESTRICT"), nullable=False, unique=False)
    report_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    run: Mapped[RecordSynthesisRun] = relationship(back_populates="sources")
    session: Mapped["ResearchSession"] = relationship()
    report: Mapped["SessionReport"] = relationship()


class RecordSynthesisItem(Base):
    __tablename__ = "record_synthesis_items"
    __table_args__ = (
        CheckConstraint("item_type IN ('requirement','decision','action-item')", name="ck_record_synthesis_items_type"),
        CheckConstraint("status IN ('ai-generated','researcher-reviewed','approved','superseded')", name="ck_record_synthesis_items_status"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("record_synthesis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="ai-generated", server_default="ai-generated")
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_preview: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    source_session_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    source_report_item_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    provenance: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    researcher_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    run: Mapped[RecordSynthesisRun] = relationship(back_populates="items")
    source_items: Mapped[list["RecordSynthesisItemSource"]] = relationship(back_populates="item", cascade="all, delete-orphan", passive_deletes=True)
    evidence: Mapped[list["RecordSynthesisEvidence"]] = relationship(back_populates="item", cascade="all, delete-orphan", passive_deletes=True, order_by="RecordSynthesisEvidence.created_at")


class RecordSynthesisItemSource(Base):
    __tablename__ = "record_synthesis_item_sources"

    item_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("record_synthesis_items.id", ondelete="CASCADE"), primary_key=True)
    report_item_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("session_report_items.id", ondelete="RESTRICT"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    item: Mapped[RecordSynthesisItem] = relationship(back_populates="source_items")
    report_item: Mapped["SessionReportItem"] = relationship()


class RecordSynthesisEvidence(Base):
    __tablename__ = "record_synthesis_evidence"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    item_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("record_synthesis_items.id", ondelete="CASCADE"), nullable=False, index=True)
    source_report_item_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("session_report_items.id", ondelete="RESTRICT"), nullable=True)
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="RESTRICT"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="RESTRICT"), nullable=False, index=True)
    chunk_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True, index=True)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    speaker: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    relevance: Mapped[float] = mapped_column(Float, nullable=False, default=0.5, server_default="0.5")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    item: Mapped[RecordSynthesisItem] = relationship(back_populates="evidence")
    source_report_item: Mapped["SessionReportItem | None"] = relationship()
    document: Mapped["Document"] = relationship()
    chunk: Mapped["Chunk | None"] = relationship()
