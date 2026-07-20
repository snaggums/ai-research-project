from datetime import datetime, timezone
from uuid import uuid4
from typing import TYPE_CHECKING

from app.db.base import Base
from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.chunk import Chunk
    from app.models.document import Document
    from app.models.research_session import ResearchSession


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (CheckConstraint("status IN ('saved','archived','deleted')", name="ck_conversations_status"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="saved", server_default="saved")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

    session: Mapped["ResearchSession"] = relationship(back_populates="conversations")
    messages: Mapped[list["ConversationMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan", passive_deletes=True, order_by="ConversationMessage.created_at")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    __table_args__ = (CheckConstraint("role IN ('researcher','assistant')", name="ck_conversation_messages_role"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conversation_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    citations: Mapped[list["MessageCitation"]] = relationship(back_populates="message", cascade="all, delete-orphan", passive_deletes=True, order_by="MessageCitation.created_at")


class MessageCitation(Base):
    __tablename__ = "message_citations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    message_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("conversation_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True, index=True)
    document_name: Mapped[str] = mapped_column(Text, nullable=False)
    speaker: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    relevance: Mapped[float] = mapped_column(Float, nullable=False, default=0.5, server_default="0.5")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    message: Mapped[ConversationMessage] = relationship(back_populates="citations")
    document: Mapped["Document"] = relationship()
    chunk: Mapped["Chunk | None"] = relationship()
