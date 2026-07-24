"""add structured Transcript blocks

Revision ID: 0009_transcript_blocks
Revises: 0008_transcript_coding
Create Date: 2026-07-23 19:00:00.000000

This migration is additive and does not reprocess existing Transcripts.
Existing content, Chunks, Highlights, suggestions, and source files remain
unchanged until a researcher explicitly retries an eligible Transcript.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0009_transcript_blocks"
down_revision: str | None = "0008_transcript_coding"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("parser_name", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("parser_version", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("extraction_metadata", sa.JSON(), nullable=True))

    op.create_table(
        "transcript_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("block_index", sa.Integer(), nullable=False),
        sa.Column("kind", sa.Text(), server_default="speech", nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("start_char", sa.Integer(), nullable=False),
        sa.Column("end_char", sa.Integer(), nullable=False),
        sa.Column("start_ms", sa.BigInteger(), nullable=True),
        sa.Column("end_ms", sa.BigInteger(), nullable=True),
        sa.Column("parser_name", sa.Text(), nullable=False),
        sa.Column("parser_version", sa.Text(), nullable=False),
        sa.Column("source_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("end_char > start_char", name="ck_transcript_blocks_offsets"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "block_index", name="uq_transcript_blocks_document_index"),
    )
    op.create_index("ix_transcript_blocks_document_id", "transcript_blocks", ["document_id"])


def downgrade() -> None:
    raise RuntimeError(
        "0009 is a forward-only data-preserving migration. Restore from a verified backup instead of deleting structured Transcript provenance."
    )
