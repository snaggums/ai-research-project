"""add Session Report item ownership metadata

Revision ID: 0010_report_item_ownership
Revises: 0009_transcript_blocks
Create Date: 2026-07-25 21:00:00.000000

Existing Decisions and Action Items are preserved and marked for researcher
review. Other Session Report item types remain unchanged.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0010_report_item_ownership"
down_revision: str | None = "0009_transcript_blocks"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("session_report_items", sa.Column("ownership_role", sa.Text(), nullable=True))
    op.add_column("session_report_items", sa.Column("ownership_value", sa.Text(), nullable=True))
    op.add_column("session_report_items", sa.Column("ownership_status", sa.Text(), nullable=True))
    op.add_column("session_report_items", sa.Column("ownership_rationale", sa.Text(), nullable=True))

    op.execute(
        """
        UPDATE session_report_items
        SET ownership_role = CASE
                WHEN item_type = 'decision' THEN 'decision-maker'
                WHEN item_type = 'action-item' THEN 'assignee'
            END,
            ownership_status = 'needs-review'
        WHERE item_type IN ('decision', 'action-item')
          AND ownership_role IS NULL
          AND ownership_status IS NULL
        """
    )

    op.create_check_constraint(
        "ck_session_report_items_ownership_role",
        "session_report_items",
        "ownership_role IS NULL OR ownership_role IN ('decision-maker','assignee')",
    )
    op.create_check_constraint(
        "ck_session_report_items_ownership_status",
        "session_report_items",
        "ownership_status IS NULL OR ownership_status IN ('ai-suggested','confirmed','confirmed-empty','needs-review')",
    )


def downgrade() -> None:
    raise RuntimeError(
        "0010 is a forward-only data-preserving migration. Restore from a verified backup instead of deleting Session Report ownership metadata."
    )
