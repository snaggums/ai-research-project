from datetime import datetime, timezone
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if False:
    from app.models.project import Project
    from app.models.research_session import ResearchSession
    from app.models.theme_evidence import ThemeEvidence


class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(Text, nullable=False, default="ai-generated", server_default="ai-generated")
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.5, server_default="0.5")
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_by: Mapped[str] = mapped_column(Text, nullable=False, default="mock", server_default="mock")
    model: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    project: Mapped["Project"] = relationship(back_populates="themes")
    session: Mapped["ResearchSession | None"] = relationship(back_populates="themes", foreign_keys=[session_id])
    evidence: Mapped[list["ThemeEvidence"]] = relationship(
        back_populates="theme",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ThemeEvidence.created_at",
    )
