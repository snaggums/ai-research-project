"""add deterministic Record Knowledge promotion

Revision ID: 0013_record_knowledge
Revises: 0012_rename_fixed_records
Create Date: 2026-07-28 22:00:00.000000

Approved Session Report Requirements, Decisions, and Action Items are copied
verbatim into immutable Record Knowledge snapshots. Existing generated Record
synthesis data is preserved unchanged.
"""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine import Connection


revision: str = "0013_record_knowledge"
down_revision: str | None = "0012_rename_fixed_records"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


ELIGIBLE_ITEM_TYPES = ("requirement", "decision", "action-item")


def backfill_approved_report_knowledge(connection: Connection) -> None:
    """Replay-safe backfill from approved reports without synthesizing content."""

    reports = connection.execute(
        sa.text(
            """
            SELECT report.id, report.project_id, report.session_id, report.updated_at,
                   assignment.record_id, session.title AS session_title
            FROM session_reports AS report
            JOIN session_records AS assignment ON assignment.session_id = report.session_id
            JOIN sessions AS session ON session.id = report.session_id
            WHERE report.status = 'approved'
            ORDER BY report.updated_at, report.created_at, report.id
            """
        )
    ).mappings().all()

    for report in reports:
        promotion_id = str(uuid4())
        connection.execute(
            sa.text(
                """
                INSERT INTO record_knowledge_promotions
                    (id, record_id, project_id, session_id, report_id, item_count, promoted_at, created_at)
                VALUES
                    (:id, :record_id, :project_id, :session_id, :report_id, 0, :promoted_at, now())
                ON CONFLICT (record_id, report_id) DO NOTHING
                """
            ),
            {
                "id": promotion_id,
                "record_id": report["record_id"],
                "project_id": report["project_id"],
                "session_id": report["session_id"],
                "report_id": report["id"],
                "promoted_at": report["updated_at"],
            },
        )
        persisted_promotion_id = connection.execute(
            sa.text(
                """
                SELECT id
                FROM record_knowledge_promotions
                WHERE record_id = :record_id AND report_id = :report_id
                """
            ),
            {"record_id": report["record_id"], "report_id": report["id"]},
        ).scalar_one()

        items = connection.execute(
            sa.text(
                """
                SELECT id, item_type, title, summary, provenance,
                       ownership_role, ownership_value, ownership_status,
                       ownership_rationale, position
                FROM session_report_items
                WHERE report_id = :report_id
                  AND item_type IN ('requirement', 'decision', 'action-item')
                ORDER BY position, created_at, id
                """
            ),
            {"report_id": report["id"]},
        ).mappings().all()

        for item in items:
            knowledge_item_id = str(uuid4())
            connection.execute(
                sa.text(
                    """
                    INSERT INTO record_knowledge_items
                        (id, promotion_id, record_id, source_project_id,
                         source_session_id, source_report_id, source_report_item_id,
                         item_type, status, title, summary, provenance,
                         ownership_role, ownership_value, ownership_status,
                         ownership_rationale, source_session_title,
                         source_report_updated_at, position, promoted_at,
                         created_at, updated_at)
                    VALUES
                        (:id, :promotion_id, :record_id, :project_id,
                         :session_id, :report_id, :report_item_id,
                         :item_type, 'current', :title, :summary, :provenance,
                         :ownership_role, :ownership_value, :ownership_status,
                         :ownership_rationale, :session_title,
                         :report_updated_at, :position, :promoted_at,
                         now(), now())
                    ON CONFLICT (record_id, source_report_item_id) DO NOTHING
                    """
                ),
                {
                    "id": knowledge_item_id,
                    "promotion_id": persisted_promotion_id,
                    "record_id": report["record_id"],
                    "project_id": report["project_id"],
                    "session_id": report["session_id"],
                    "report_id": report["id"],
                    "report_item_id": item["id"],
                    "item_type": item["item_type"],
                    "title": item["title"],
                    "summary": item["summary"],
                    "provenance": item["provenance"],
                    "ownership_role": item["ownership_role"],
                    "ownership_value": item["ownership_value"],
                    "ownership_status": item["ownership_status"],
                    "ownership_rationale": item["ownership_rationale"],
                    "session_title": report["session_title"],
                    "report_updated_at": report["updated_at"],
                    "position": item["position"],
                    "promoted_at": report["updated_at"],
                },
            )
            persisted_item_id = connection.execute(
                sa.text(
                    """
                    SELECT id
                    FROM record_knowledge_items
                    WHERE record_id = :record_id
                      AND source_report_item_id = :report_item_id
                    """
                ),
                {
                    "record_id": report["record_id"],
                    "report_item_id": item["id"],
                },
            ).scalar_one()
            evidence_rows = connection.execute(
                sa.text(
                    """
                    SELECT evidence.id, evidence.document_id, evidence.chunk_id,
                           document.filename AS document_name, evidence.excerpt,
                           evidence.speaker, evidence.location, evidence.relevance
                    FROM session_report_evidence AS evidence
                    JOIN documents AS document ON document.id = evidence.document_id
                    WHERE evidence.item_id = :report_item_id
                    ORDER BY evidence.created_at, evidence.id
                    """
                ),
                {"report_item_id": item["id"]},
            ).mappings().all()
            for evidence in evidence_rows:
                connection.execute(
                    sa.text(
                        """
                        INSERT INTO record_knowledge_evidence
                            (id, item_id, source_report_evidence_id, document_id,
                             chunk_id, document_name, excerpt, speaker, location,
                             relevance, created_at)
                        SELECT
                            :id, :item_id, :source_report_evidence_id, :document_id,
                            :chunk_id, :document_name, :excerpt, :speaker, :location,
                            :relevance, now()
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM record_knowledge_evidence
                            WHERE item_id = :item_id
                              AND source_report_evidence_id = :source_report_evidence_id
                        )
                        """
                    ),
                    {
                        "id": str(uuid4()),
                        "item_id": persisted_item_id,
                        "source_report_evidence_id": evidence["id"],
                        "document_id": evidence["document_id"],
                        "chunk_id": evidence["chunk_id"],
                        "document_name": evidence["document_name"],
                        "excerpt": evidence["excerpt"],
                        "speaker": evidence["speaker"],
                        "location": evidence["location"],
                        "relevance": evidence["relevance"],
                    },
                )

        connection.execute(
            sa.text(
                """
                UPDATE record_knowledge_promotions
                SET item_count = (
                    SELECT count(*)
                    FROM record_knowledge_items
                    WHERE promotion_id = record_knowledge_promotions.id
                )
                WHERE id = :promotion_id
                """
            ),
            {"promotion_id": persisted_promotion_id},
        )

    connection.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT item.id,
                       dense_rank() OVER (
                           PARTITION BY item.record_id, item.source_session_id
                           ORDER BY item.source_report_updated_at DESC,
                                    item.source_report_id DESC
                       ) AS revision_rank
                FROM record_knowledge_items AS item
            )
            UPDATE record_knowledge_items AS item
            SET status = 'superseded',
                superseded_at = now(),
                updated_at = now()
            FROM ranked
            WHERE ranked.id = item.id
              AND ranked.revision_rank > 1
              AND item.status <> 'superseded'
            """
        )
    )


def upgrade() -> None:
    op.create_table(
        "record_knowledge_promotions",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("promoted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["report_id"], ["session_reports.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_id", "report_id", name="uq_record_knowledge_promotions_record_report"),
    )
    op.create_index("ix_record_knowledge_promotions_record_id", "record_knowledge_promotions", ["record_id"])
    op.create_index("ix_record_knowledge_promotions_project_id", "record_knowledge_promotions", ["project_id"])
    op.create_index("ix_record_knowledge_promotions_session_id", "record_knowledge_promotions", ["session_id"])
    op.create_index("ix_record_knowledge_promotions_report_id", "record_knowledge_promotions", ["report_id"])

    op.create_table(
        "record_knowledge_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("promotion_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("source_project_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source_session_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source_report_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source_report_item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_type", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="current", nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("provenance", sa.Text(), nullable=False),
        sa.Column("ownership_role", sa.Text(), nullable=True),
        sa.Column("ownership_value", sa.Text(), nullable=True),
        sa.Column("ownership_status", sa.Text(), nullable=True),
        sa.Column("ownership_rationale", sa.Text(), nullable=True),
        sa.Column("source_session_title", sa.Text(), nullable=False),
        sa.Column("source_report_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("promoted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("superseded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("item_type IN ('requirement','decision','action-item')", name="ck_record_knowledge_items_type"),
        sa.CheckConstraint("status IN ('current','superseded')", name="ck_record_knowledge_items_status"),
        sa.ForeignKeyConstraint(["promotion_id"], ["record_knowledge_promotions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_project_id"], ["projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_report_id"], ["session_reports.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_report_item_id"], ["session_report_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_session_id"], ["sessions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_id", "source_report_item_id", name="uq_record_knowledge_items_record_source"),
    )
    for column in ("promotion_id", "record_id", "source_project_id", "source_session_id", "source_report_id", "source_report_item_id"):
        op.create_index(f"ix_record_knowledge_items_{column}", "record_knowledge_items", [column])

    op.create_table(
        "record_knowledge_evidence",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source_report_evidence_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("document_name", sa.Text(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("relevance", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["item_id"], ["record_knowledge_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_report_evidence_id"], ["session_report_evidence.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("item_id", "source_report_evidence_id", "document_id", "chunk_id"):
        op.create_index(f"ix_record_knowledge_evidence_{column}", "record_knowledge_evidence", [column])

    backfill_approved_report_knowledge(op.get_bind())


def downgrade() -> None:
    raise RuntimeError(
        "0013 is a forward-only, data-preserving migration. Restore from a verified backup instead of deleting approved Record Knowledge."
    )
