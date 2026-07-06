"""create ai settings table

Revision ID: 0004_create_ai_settings
Revises: 0003_create_chunks
Create Date: 2026-07-06 09:30:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_create_ai_settings"
down_revision: str | None = "0003_create_chunks"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_settings",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("provider", sa.Text(), server_default="openai", nullable=False),
        sa.Column("model", sa.Text(), server_default="gpt-4.1-mini", nullable=False),
        sa.Column("base_url", sa.Text(), nullable=True),
        sa.Column("embedding_provider", sa.Text(), server_default="mock", nullable=False),
        sa.Column("embedding_model", sa.Text(), server_default="mock-hash-64", nullable=False),
        sa.Column("api_key_env_var", sa.Text(), nullable=True),
        sa.Column("has_api_key", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("ai_settings")
