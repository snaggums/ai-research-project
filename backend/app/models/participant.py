from datetime import datetime, timezone
from uuid import uuid4
from typing import TYPE_CHECKING

from app.db.base import Base
from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.research_session import SessionParticipant


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    organization: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str | None] = mapped_column(Text, nullable=True)
    researcher_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="participants")
    session_memberships: Mapped[list["SessionParticipant"]] = relationship(back_populates="participant", cascade="all, delete-orphan", passive_deletes=True)
    record_memberships: Mapped[list["ParticipantRecord"]] = relationship(back_populates="participant", cascade="all, delete-orphan", passive_deletes=True)


class ParticipantRecord(Base):
    __tablename__ = "participant_records"

    participant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True)
    record_id: Mapped[str] = mapped_column(Text, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    participant: Mapped[Participant] = relationship(back_populates="record_memberships")
