from datetime import datetime, timezone
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, JSON, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if False:
    from app.models.chunk import Chunk
    from app.models.project import Project
    from app.models.research_session import ResearchSession
    from app.models.transcript_block import TranscriptBlockRecord


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint(
            "lifecycle_status IN ('active','legacy','replacement-pending','replacement-failed','tombstoned')",
            name="ck_documents_lifecycle_status",
        ),
        UniqueConstraint("session_id", "replacement_request_key", name="uq_documents_session_replacement_request"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type: Mapped[str] = mapped_column(Text, nullable=False, default="transcript", server_default="transcript")
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    parser_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    parser_version: Mapped[str | None] = mapped_column(Text, nullable=True)
    extraction_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="uploaded", server_default="uploaded")
    lifecycle_status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="active",
        server_default="active",
        index=True,
    )
    replacement_for_document_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    replacement_request_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="documents")
    session: Mapped["ResearchSession"] = relationship(back_populates="documents", foreign_keys=[session_id])
    chunks: Mapped[list["Chunk"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    transcript_blocks: Mapped[list["TranscriptBlockRecord"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TranscriptBlockRecord.block_index",
    )
