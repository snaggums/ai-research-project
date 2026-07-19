from datetime import datetime, timezone
from uuid import uuid4
from typing import TYPE_CHECKING

from app.db.base import Base
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.document import Document
    from app.models.participant import Participant
    from app.models.project import Project
    from app.models.record import SessionRecord
    from app.models.session_report import SessionReport
    from app.models.theme import Theme


class ResearchSession(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint("session_type IN ('interview','usability-test','focus-group','working-session','design-critique','other')", name="ck_sessions_type"),
        UniqueConstraint("project_id", "migration_source", name="uq_sessions_project_migration_source"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    session_type: Mapped[str] = mapped_column(Text, nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    migration_source: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_transcript_document_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="sessions")
    documents: Mapped[list["Document"]] = relationship(back_populates="session", foreign_keys="Document.session_id")
    primary_transcript: Mapped["Document | None"] = relationship(foreign_keys=[primary_transcript_document_id], post_update=True)
    participant_memberships: Mapped[list["SessionParticipant"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    relationships: Mapped[list["SessionRelationship"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    record_assignments: Mapped[list["SessionRecord"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    themes: Mapped[list["Theme"]] = relationship(back_populates="session", foreign_keys="Theme.session_id")
    reports: Mapped[list["SessionReport"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), primary_key=True)
    participant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    session: Mapped[ResearchSession] = relationship(back_populates="participant_memberships")
    participant: Mapped["Participant"] = relationship(back_populates="session_memberships")


class SessionRelationship(Base):
    __tablename__ = "session_relationships"
    __table_args__ = (
        CheckConstraint("target_type IN ('record','common-component')", name="ck_session_relationships_target_type"),
    )

    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), primary_key=True)
    target_type: Mapped[str] = mapped_column(Text, primary_key=True)
    target_id: Mapped[str] = mapped_column(Text, primary_key=True)
    target_name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    session: Mapped[ResearchSession] = relationship(back_populates="relationships")
