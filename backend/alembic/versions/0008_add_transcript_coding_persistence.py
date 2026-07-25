"""add Transcript Coding persistence

Revision ID: 0008_transcript_coding
Revises: 0007_record_synthesis
Create Date: 2026-07-22 12:00:00.000000

This migration is additive and forward-only. Existing Projects, Sessions,
Transcripts, Chunks, Records, Themes, Reports, and synthesis provenance are
not rewritten.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0008_transcript_coding"
down_revision: str | None = "0007_record_synthesis"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "record_codes",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("normalized_name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('active','archived')", name="ck_record_codes_status"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_id", "normalized_name", name="uq_record_codes_record_normalized_name"),
    )
    op.create_index("ix_record_codes_record_id", "record_codes", ["record_id"])

    op.create_table(
        "transcript_highlights",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("block_id", sa.Text(), nullable=True),
        sa.Column("start_char", sa.Integer(), nullable=False),
        sa.Column("end_char", sa.Integer(), nullable=False),
        sa.Column("excerpt_snapshot", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("start_ms", sa.BigInteger(), nullable=True),
        sa.Column("end_ms", sa.BigInteger(), nullable=True),
        sa.Column("content_checksum", sa.Text(), nullable=False),
        sa.Column("origin", sa.Text(), server_default="researcher", nullable=False),
        sa.Column("client_request_key", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("origin IN ('researcher','ai-suggestion')", name="ck_transcript_highlights_origin"),
        sa.CheckConstraint("end_char > start_char", name="ck_transcript_highlights_offsets"),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "start_char", "end_char", name="uq_transcript_highlights_anchor"),
        sa.UniqueConstraint("session_id", "client_request_key", name="uq_transcript_highlights_request_key"),
    )
    op.create_index("ix_transcript_highlights_project_id", "transcript_highlights", ["project_id"])
    op.create_index("ix_transcript_highlights_session_id", "transcript_highlights", ["session_id"])
    op.create_index("ix_transcript_highlights_document_id", "transcript_highlights", ["document_id"])

    op.create_table(
        "code_suggestion_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="queued", nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("model", sa.Text(), nullable=False),
        sa.Column("prompt_version", sa.Text(), nullable=False),
        sa.Column("content_checksum", sa.Text(), nullable=False),
        sa.Column("client_request_key", sa.Text(), nullable=True),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('queued','processing','complete','failed')", name="ck_code_suggestion_runs_status"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "client_request_key", name="uq_code_suggestion_runs_request_key"),
    )
    op.create_index("ix_code_suggestion_runs_project_id", "code_suggestion_runs", ["project_id"])
    op.create_index("ix_code_suggestion_runs_session_id", "code_suggestion_runs", ["session_id"])
    op.create_index("ix_code_suggestion_runs_record_id", "code_suggestion_runs", ["record_id"])

    op.create_table(
        "code_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("proposed_name", sa.Text(), nullable=False),
        sa.Column("proposed_description", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("status", sa.Text(), server_default="awaiting-review", nullable=False),
        sa.Column("was_edited", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("accepted_code_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_request_key", sa.Text(), nullable=True),
        sa.CheckConstraint("status IN ('awaiting-review','accepted','rejected')", name="ck_code_suggestions_status"),
        sa.ForeignKeyConstraint(["accepted_code_id"], ["record_codes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["run_id"], ["code_suggestion_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_code_suggestions_run_id", "code_suggestions", ["run_id"])
    op.create_index("ix_code_suggestions_record_id", "code_suggestions", ["record_id"])

    op.create_table(
        "code_suggestion_evidence",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("suggestion_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("block_id", sa.Text(), nullable=True),
        sa.Column("start_char", sa.Integer(), nullable=False),
        sa.Column("end_char", sa.Integer(), nullable=False),
        sa.Column("excerpt_snapshot", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("start_ms", sa.BigInteger(), nullable=True),
        sa.Column("end_ms", sa.BigInteger(), nullable=True),
        sa.Column("content_checksum", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.CheckConstraint("end_char > start_char", name="ck_code_suggestion_evidence_offsets"),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["suggestion_id"], ["code_suggestions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("suggestion_id", "display_order", name="uq_code_suggestion_evidence_order"),
    )
    op.create_index("ix_code_suggestion_evidence_suggestion_id", "code_suggestion_evidence", ["suggestion_id"])

    op.create_table(
        "highlight_code_assignments",
        sa.Column("highlight_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("code_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("assignment_origin", sa.Text(), server_default="researcher", nullable=False),
        sa.Column("suggestion_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "assignment_origin IN ('researcher','accepted-suggestion','edited-suggestion')",
            name="ck_highlight_code_assignments_origin",
        ),
        sa.ForeignKeyConstraint(["code_id"], ["record_codes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["highlight_id"], ["transcript_highlights.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["suggestion_id"], ["code_suggestions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("highlight_id", "code_id"),
    )


def downgrade() -> None:
    raise RuntimeError(
        "0008 is a forward-only data-preserving migration. Restore from a verified backup instead of deleting Transcript Coding provenance."
    )
