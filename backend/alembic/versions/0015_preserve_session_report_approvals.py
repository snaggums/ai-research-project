"""preserve Session Report approval history

Revision ID: 0015_report_approved_at
Revises: 0014_decision_titles
Create Date: 2026-07-29 12:00:00.000000

Approval is durable even after a report revision is superseded. This lets a
Session assigned to a Record later replay every known approved report in order.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0015_report_approved_at"
down_revision: str | None = "0014_decision_titles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "session_reports",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE session_reports AS report
            SET approved_at = COALESCE(promotion.promoted_at, report.updated_at)
            FROM record_knowledge_promotions AS promotion
            WHERE promotion.report_id = report.id
              AND report.approved_at IS NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE session_reports
            SET approved_at = updated_at
            WHERE status = 'approved'
              AND approved_at IS NULL
            """
        )
    )
    op.create_index(
        "ix_session_reports_approved_at",
        "session_reports",
        ["approved_at"],
    )


def downgrade() -> None:
    raise RuntimeError(
        "0015 is a forward-only, data-preserving migration. Restore from a verified backup instead of deleting Session Report approval history."
    )
