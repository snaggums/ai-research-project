"""add V2 Project Session workspace and idempotent V1 backfill

Revision ID: 0006_add_v2_session_workspace
Revises: 0005_create_themes
Create Date: 2026-07-15 08:00:00.000000

This migration is intentionally additive and forward-only. Existing Project,
Document, Chunk, Theme, and ThemeEvidence rows retain their IDs and content.
"""

from collections.abc import Sequence
from uuid import UUID, uuid5

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine import Connection

revision: str = "0006_add_v2_session_workspace"
down_revision: str | None = "0005_create_themes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

AIR_V2_MIGRATION_NAMESPACE = UUID("4b9bca8e-0f3d-4b7e-a6e6-b972bc98a5fb")
V1_IMPORT_SOURCE = "v1-project"


def deterministic_import_session_id(project_id: str) -> str:
    return str(uuid5(AIR_V2_MIGRATION_NAMESPACE, f"{V1_IMPORT_SOURCE}:{project_id}"))


def backfill_v1_projects(connection: Connection) -> None:
    """Attach every existing V1 Document to one deterministic import Session.

    The function is safe to call repeatedly: the Project/migration-source
    unique constraint prevents duplicate Sessions and only unowned Documents
    are updated.
    """

    project_ids = connection.execute(
        sa.text("SELECT DISTINCT project_id::text FROM documents ORDER BY project_id::text")
    ).scalars().all()
    for project_id in project_ids:
        proposed_session_id = deterministic_import_session_id(project_id)
        connection.execute(
            sa.text(
                """
                INSERT INTO sessions (
                    id, project_id, title, session_type, description,
                    migration_source, created_at, updated_at
                )
                VALUES (
                    CAST(:session_id AS uuid), CAST(:project_id AS uuid),
                    'Imported research', 'other',
                    'Research imported from the AIR V1 Project workspace.',
                    :migration_source, now(), now()
                )
                ON CONFLICT (project_id, migration_source) DO NOTHING
                """
            ),
            {"session_id": proposed_session_id, "project_id": project_id, "migration_source": V1_IMPORT_SOURCE},
        )
        session_id = connection.execute(
            sa.text(
                """
                SELECT id::text FROM sessions
                WHERE project_id = CAST(:project_id AS uuid)
                  AND migration_source = :migration_source
                """
            ),
            {"project_id": project_id, "migration_source": V1_IMPORT_SOURCE},
        ).scalar_one()
        connection.execute(
            sa.text(
                """
                UPDATE documents
                SET session_id = CAST(:session_id AS uuid), document_type = 'transcript'
                WHERE project_id = CAST(:project_id AS uuid) AND session_id IS NULL
                """
            ),
            {"session_id": session_id, "project_id": project_id},
        )

    connection.execute(
        sa.text(
            """
            UPDATE themes AS theme
            SET session_id = imported.id
            FROM sessions AS imported
            WHERE theme.project_id = imported.project_id
              AND imported.migration_source = :migration_source
              AND theme.session_id IS NULL
            """
        ),
        {"migration_source": V1_IMPORT_SOURCE},
    )


def upgrade() -> None:
    op.create_table(
        "participants",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("first_name", sa.Text(), nullable=False),
        sa.Column("last_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("organization", sa.Text(), nullable=True),
        sa.Column("role", sa.Text(), nullable=True),
        sa.Column("researcher_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_participants_project_id", "participants", ["project_id"])

    op.create_table(
        "participant_records",
        sa.Column("participant_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("participant_id", "record_id"),
    )

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("session_type", sa.Text(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("migration_source", sa.Text(), nullable=True),
        sa.Column("primary_transcript_document_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("session_type IN ('interview','usability-test','focus-group','working-session','design-critique','other')", name="ck_sessions_type"),
        sa.ForeignKeyConstraint(["primary_transcript_document_id"], ["documents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "migration_source", name="uq_sessions_project_migration_source"),
    )
    op.create_index("ix_sessions_project_id", "sessions", ["project_id"])

    op.create_table(
        "session_participants",
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("participant_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("session_id", "participant_id"),
    )

    op.create_table(
        "session_relationships",
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("target_type", sa.Text(), nullable=False),
        sa.Column("target_id", sa.Text(), nullable=False),
        sa.Column("target_name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("target_type IN ('record','common-component')", name="ck_session_relationships_target_type"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("session_id", "target_type", "target_id"),
    )

    op.add_column("documents", sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column("documents", sa.Column("document_type", sa.Text(), server_default="transcript", nullable=False))
    op.add_column("documents", sa.Column("size_bytes", sa.BigInteger(), nullable=True))
    op.create_index("ix_documents_session_id", "documents", ["session_id"])
    op.create_foreign_key("fk_documents_session_id", "documents", "sessions", ["session_id"], ["id"], ondelete="CASCADE")

    op.add_column("themes", sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column("themes", sa.Column("status", sa.Text(), server_default="ai-generated", nullable=False))
    op.create_index("ix_themes_session_id", "themes", ["session_id"])
    op.create_foreign_key("fk_themes_session_id", "themes", "sessions", ["session_id"], ["id"], ondelete="CASCADE")

    backfill_v1_projects(op.get_bind())
    op.alter_column("documents", "session_id", existing_type=postgresql.UUID(as_uuid=False), nullable=False)

    op.create_table(
        "session_reports",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("revision_of_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("status", sa.Text(), server_default="ai-generated", nullable=False),
        sa.Column("executive_summary", sa.Text(), server_default="", nullable=False),
        sa.Column("detailed_notes", sa.Text(), server_default="", nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('ai-generated','researcher-reviewed','approved','superseded')", name="ck_session_reports_status"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["revision_of_id"], ["session_reports.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_reports_project_id", "session_reports", ["project_id"])
    op.create_index("ix_session_reports_session_id", "session_reports", ["session_id"])

    op.create_table(
        "session_report_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_type", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("provenance", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("item_type IN ('requirement','decision','action-item','open-question','key-insight')", name="ck_session_report_items_type"),
        sa.ForeignKeyConstraint(["report_id"], ["session_reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_report_items_report_id", "session_report_items", ["report_id"])

    op.create_table(
        "session_report_evidence",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("relevance", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["item_id"], ["session_report_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_report_evidence_item_id", "session_report_evidence", ["item_id"])
    op.create_index("ix_session_report_evidence_document_id", "session_report_evidence", ["document_id"])
    op.create_index("ix_session_report_evidence_chunk_id", "session_report_evidence", ["chunk_id"])

    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("status", sa.Text(), server_default="saved", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('saved','archived','deleted')", name="ck_conversations_status"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversations_project_id", "conversations", ["project_id"])
    op.create_index("ix_conversations_session_id", "conversations", ["session_id"])

    op.create_table(
        "conversation_messages",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('researcher','assistant')", name="ck_conversation_messages_role"),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversation_messages_conversation_id", "conversation_messages", ["conversation_id"])

    op.create_table(
        "message_citations",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("document_name", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("relevance", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["message_id"], ["conversation_messages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_message_citations_message_id", "message_citations", ["message_id"])
    op.create_index("ix_message_citations_document_id", "message_citations", ["document_id"])
    op.create_index("ix_message_citations_chunk_id", "message_citations", ["chunk_id"])


def downgrade() -> None:
    raise RuntimeError(
        "0006 is a forward-only data-preserving migration. Restore from a verified backup instead of deleting migrated V2 ownership data."
    )
