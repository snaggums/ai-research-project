"""add safe single-Transcript lifecycle metadata

Revision ID: 0011_transcript_lifecycle
Revises: 0010_report_item_ownership
Create Date: 2026-07-28 12:00:00.000000

Existing primary Transcripts remain active. Existing non-primary Transcripts
are preserved as legacy sources; no files or evidence are deleted.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0011_transcript_lifecycle"
down_revision: str | None = "0010_report_item_ownership"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column("lifecycle_status", sa.Text(), nullable=False, server_default="active"),
    )
    op.add_column(
        "documents",
        sa.Column("replacement_for_document_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("replacement_request_key", sa.Text(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.execute(
        """
        UPDATE documents AS document
        SET lifecycle_status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM sessions AS session
                WHERE session.primary_transcript_document_id = document.id
            ) THEN 'active'
            ELSE 'legacy'
        END
        """
    )

    op.create_check_constraint(
        "ck_documents_lifecycle_status",
        "documents",
        "lifecycle_status IN ('active','legacy','replacement-pending','replacement-failed','tombstoned')",
    )
    op.create_foreign_key(
        "fk_documents_replacement_for_document_id",
        "documents",
        "documents",
        ["replacement_for_document_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_documents_lifecycle_status",
        "documents",
        ["lifecycle_status"],
    )
    op.create_index(
        "ix_documents_replacement_for_document_id",
        "documents",
        ["replacement_for_document_id"],
    )
    op.create_unique_constraint(
        "uq_documents_session_replacement_request",
        "documents",
        ["session_id", "replacement_request_key"],
    )


def downgrade() -> None:
    raise RuntimeError(
        "0011 is a forward-only data-preserving migration. Restore from a verified backup instead of deleting Transcript lifecycle metadata."
    )
