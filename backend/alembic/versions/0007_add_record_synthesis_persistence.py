"""add fixed Records and Record synthesis persistence

Revision ID: 0007_record_synthesis
Revises: 0006_add_v2_session_workspace
Create Date: 2026-07-16 12:00:00.000000

This migration is additive and forward-only. Provisional Record references in
session_relationships remain intact and recognized fixed Record references are
copied idempotently into the normalized session_records table.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine import Connection


revision: str = "0007_record_synthesis"
down_revision: str | None = "0006_add_v2_session_workspace"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


FIXED_RECORDS = (
    ("record-1", "Record 1", "Checkout and payment experience across interviews and usability tests.", 1),
    ("record-2", "Record 2", "Navigation, orientation, and information-finding research.", 2),
    ("record-3", "Record 3", "Account setup and ongoing profile-management research.", 3),
)


def seed_records_and_backfill(connection: Connection) -> None:
    """Seed the fixed catalog and copy recognized provisional references safely."""

    for record_id, name, description, position in FIXED_RECORDS:
        connection.execute(
            sa.text(
                """
                INSERT INTO records (id, name, description, position, created_at, updated_at)
                VALUES (:id, :name, :description, :position, now(), now())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    position = EXCLUDED.position,
                    updated_at = records.updated_at
                """
            ),
            {"id": record_id, "name": name, "description": description, "position": position},
        )

    connection.execute(
        sa.text(
            """
            INSERT INTO session_records (session_id, record_id, created_at)
            SELECT
                relationship.session_id,
                CASE
                    WHEN lower(relationship.target_id) IN ('record-1', 'record 1') OR lower(relationship.target_name) = 'record 1' THEN 'record-1'
                    WHEN lower(relationship.target_id) IN ('record-2', 'record 2') OR lower(relationship.target_name) = 'record 2' THEN 'record-2'
                    WHEN lower(relationship.target_id) IN ('record-3', 'record 3') OR lower(relationship.target_name) = 'record 3' THEN 'record-3'
                END,
                relationship.created_at
            FROM session_relationships AS relationship
            WHERE relationship.target_type = 'record'
              AND (
                lower(relationship.target_id) IN ('record-1', 'record 1', 'record-2', 'record 2', 'record-3', 'record 3')
                OR lower(relationship.target_name) IN ('record 1', 'record 2', 'record 3')
              )
            ON CONFLICT (session_id, record_id) DO NOTHING
            """
        )
    )


def upgrade() -> None:
    op.create_table(
        "records",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("position"),
    )

    op.create_table(
        "session_records",
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("session_id", "record_id"),
    )
    op.create_index("ix_session_records_record_id", "session_records", ["record_id"])

    op.create_table(
        "record_synthesis_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="queued", nullable=False),
        sa.Column("client_request_key", sa.Text(), nullable=True),
        sa.Column("source_session_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("source_report_revision_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("provider", sa.Text(), nullable=True),
        sa.Column("model", sa.Text(), nullable=True),
        sa.Column("prompt_version", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('queued','processing','complete','failed')", name="ck_record_synthesis_runs_status"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_id", "client_request_key", name="uq_record_synthesis_runs_request_key"),
    )
    op.create_index("ix_record_synthesis_runs_record_id", "record_synthesis_runs", ["record_id"])

    op.create_table(
        "record_synthesis_sources",
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("report_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["session_reports.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["run_id"], ["record_synthesis_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("run_id", "session_id"),
        sa.UniqueConstraint("run_id", "report_id", name="uq_record_synthesis_sources_run_report"),
    )

    op.create_table(
        "record_synthesis_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_type", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="ai-generated", nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("evidence_preview", sa.Text(), server_default="", nullable=False),
        sa.Column("source_session_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("source_report_item_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("provenance", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("researcher_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("item_type IN ('requirement','decision','action-item')", name="ck_record_synthesis_items_type"),
        sa.CheckConstraint("status IN ('ai-generated','researcher-reviewed','approved','superseded')", name="ck_record_synthesis_items_status"),
        sa.ForeignKeyConstraint(["run_id"], ["record_synthesis_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_record_synthesis_items_run_id", "record_synthesis_items", ["run_id"])

    op.create_table(
        "record_synthesis_item_sources",
        sa.Column("item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("report_item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["item_id"], ["record_synthesis_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["report_item_id"], ["session_report_items.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("item_id", "report_item_id"),
    )

    op.create_table(
        "record_synthesis_evidence",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source_report_item_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("relevance", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["item_id"], ["record_synthesis_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_report_item_id"], ["session_report_items.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_record_synthesis_evidence_item_id", "record_synthesis_evidence", ["item_id"])
    op.create_index("ix_record_synthesis_evidence_project_id", "record_synthesis_evidence", ["project_id"])
    op.create_index("ix_record_synthesis_evidence_session_id", "record_synthesis_evidence", ["session_id"])
    op.create_index("ix_record_synthesis_evidence_document_id", "record_synthesis_evidence", ["document_id"])
    op.create_index("ix_record_synthesis_evidence_chunk_id", "record_synthesis_evidence", ["chunk_id"])

    seed_records_and_backfill(op.get_bind())


def downgrade() -> None:
    raise RuntimeError(
        "0007 is a forward-only data-preserving migration. Restore from a verified backup instead of deleting Record synthesis provenance."
    )
