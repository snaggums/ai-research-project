from datetime import datetime, timezone
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import DateTime, Float, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if False:
    from app.models.chunk import Chunk
    from app.models.document import Document
    from app.models.theme import Theme


class ThemeEvidence(Base):
    __tablename__ = "theme_evidence"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    theme_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("themes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("chunks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.5, server_default="0.5")
    evidence_type: Mapped[str] = mapped_column(Text, nullable=False, default="supporting", server_default="supporting")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    theme: Mapped["Theme"] = relationship(back_populates="evidence")
    document: Mapped["Document"] = relationship()
    chunk: Mapped["Chunk"] = relationship()
