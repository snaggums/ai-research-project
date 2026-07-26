from datetime import datetime, timezone
from uuid import uuid4
from typing import TYPE_CHECKING

from app.db.base import Base
from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.chunk import Chunk
    from app.models.document import Document
    from app.models.research_session import ResearchSession


class SessionReport(Base):
    __tablename__ = "session_reports"
    __table_args__ = (CheckConstraint("status IN ('ai-generated','researcher-reviewed','approved','superseded')", name="ck_session_reports_status"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_of_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("session_reports.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="ai-generated", server_default="ai-generated")
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    detailed_notes: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    session: Mapped["ResearchSession"] = relationship(back_populates="reports")
    items: Mapped[list["SessionReportItem"]] = relationship(back_populates="report", cascade="all, delete-orphan", passive_deletes=True, order_by="SessionReportItem.position")


class SessionReportItem(Base):
    __tablename__ = "session_report_items"
    __table_args__ = (
        CheckConstraint("item_type IN ('requirement','decision','action-item','open-question','key-insight')", name="ck_session_report_items_type"),
        CheckConstraint("ownership_role IS NULL OR ownership_role IN ('decision-maker','assignee')", name="ck_session_report_items_ownership_role"),
        CheckConstraint("ownership_status IS NULL OR ownership_status IN ('ai-suggested','confirmed','confirmed-empty','needs-review')", name="ck_session_report_items_ownership_status"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    report_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("session_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    provenance: Mapped[str] = mapped_column(Text, nullable=False)
    ownership_role: Mapped[str | None] = mapped_column(Text, nullable=True)
    ownership_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    ownership_status: Mapped[str | None] = mapped_column(Text, nullable=True)
    ownership_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    report: Mapped[SessionReport] = relationship(back_populates="items")
    evidence: Mapped[list["SessionReportEvidence"]] = relationship(back_populates="item", cascade="all, delete-orphan", passive_deletes=True, order_by="SessionReportEvidence.created_at")


class SessionReportEvidence(Base):
    __tablename__ = "session_report_evidence"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    item_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("session_report_items.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True, index=True)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    speaker: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    relevance: Mapped[float] = mapped_column(Float, nullable=False, default=0.5, server_default="0.5")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    item: Mapped[SessionReportItem] = relationship(back_populates="evidence")
    document: Mapped["Document"] = relationship()
    chunk: Mapped["Chunk | None"] = relationship()
