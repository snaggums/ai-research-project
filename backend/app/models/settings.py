from datetime import datetime, timezone
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import Boolean, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class AISettings(Base):
    __tablename__ = "ai_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    provider: Mapped[str] = mapped_column(Text, nullable=False, default="openai", server_default="openai")
    model: Mapped[str] = mapped_column(Text, nullable=False, default="gpt-4.1-mini", server_default="gpt-4.1-mini")
    base_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_provider: Mapped[str] = mapped_column(Text, nullable=False, default="mock", server_default="mock")
    embedding_model: Mapped[str] = mapped_column(Text, nullable=False, default="mock-hash-64", server_default="mock-hash-64")
    api_key_env_var: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_api_key: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
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
