from datetime import datetime, timezone
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, JSON, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if False:
    from app.models.document import Document


class TranscriptBlockRecord(Base):
    __tablename__ = "transcript_blocks"
    __table_args__ = (
        CheckConstraint("end_char > start_char", name="ck_transcript_blocks_offsets"),
        UniqueConstraint("document_id", "block_index", name="uq_transcript_blocks_document_index"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    document_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    block_index: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False, default="speech", server_default="speech")
    speaker: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    start_char: Mapped[int] = mapped_column(Integer, nullable=False)
    end_char: Mapped[int] = mapped_column(Integer, nullable=False)
    start_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    end_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    parser_name: Mapped[str] = mapped_column(Text, nullable=False)
    parser_version: Mapped[str] = mapped_column(Text, nullable=False)
    source_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    document: Mapped["Document"] = relationship(back_populates="transcript_blocks")
