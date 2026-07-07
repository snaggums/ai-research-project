"""create themes and evidence tables

Revision ID: 0005_create_themes
Revises: 0004_create_ai_settings
Create Date: 2026-07-06 13:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005_create_themes"
down_revision: str | None = "0004_create_ai_settings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "themes",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("evidence_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by", sa.Text(), server_default="mock", nullable=False),
        sa.Column("model", sa.Text(), nullable=True),
        sa.Column("user_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_themes_project_id"), "themes", ["project_id"], unique=False)

    op.create_table(
        "theme_evidence",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("theme_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column("reasoning", sa.Text(), nullable=False),
        sa.Column("relevance_score", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("evidence_type", sa.Text(), server_default="supporting", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["theme_id"], ["themes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_theme_evidence_chunk_id"), "theme_evidence", ["chunk_id"], unique=False)
    op.create_index(op.f("ix_theme_evidence_document_id"), "theme_evidence", ["document_id"], unique=False)
    op.create_index(op.f("ix_theme_evidence_theme_id"), "theme_evidence", ["theme_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_theme_evidence_theme_id"), table_name="theme_evidence")
    op.drop_index(op.f("ix_theme_evidence_document_id"), table_name="theme_evidence")
    op.drop_index(op.f("ix_theme_evidence_chunk_id"), table_name="theme_evidence")
    op.drop_table("theme_evidence")
    op.drop_index(op.f("ix_themes_project_id"), table_name="themes")
    op.drop_table("themes")
