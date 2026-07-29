"""normalize Decision titles as completed outcomes

Revision ID: 0014_decision_titles
Revises: 0013_record_knowledge
Create Date: 2026-07-29 12:00:00.000000

Generated Decision titles previously used task framing such as "Decide how
to address ...". This replay-safe data correction removes that prefix from
Session Report Decisions and synchronizes their promoted Record Knowledge
snapshots without changing IDs, status, provenance, ownership, or evidence.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.engine import Connection


revision: str = "0014_decision_titles"
down_revision: str | None = "0013_record_knowledge"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def normalize_decision_titles(connection: Connection) -> None:
    """Remove legacy task framing and preserve exact promoted copies."""

    connection.execute(
        sa.text(
            """
            WITH normalized AS (
                SELECT id,
                       trim(
                           regexp_replace(
                               title,
                               '^Decide how to address[[:space:]]+',
                               '',
                               'i'
                           )
                       ) AS title
                FROM session_report_items
                WHERE item_type = 'decision'
                  AND title ~* '^Decide how to address[[:space:]]+'
            )
            UPDATE session_report_items AS item
            SET title = upper(left(normalized.title, 1))
                        || substring(normalized.title FROM 2),
                updated_at = now()
            FROM normalized
            WHERE normalized.id = item.id
              AND normalized.title <> ''
              AND item.title IS DISTINCT FROM (
                  upper(left(normalized.title, 1))
                  || substring(normalized.title FROM 2)
              )
            """
        )
    )

    connection.execute(
        sa.text(
            """
            UPDATE record_knowledge_items AS knowledge
            SET title = source.title,
                updated_at = now()
            FROM session_report_items AS source
            WHERE knowledge.source_report_item_id = source.id
              AND knowledge.item_type = 'decision'
              AND source.item_type = 'decision'
              AND knowledge.title IS DISTINCT FROM source.title
            """
        )
    )


def upgrade() -> None:
    normalize_decision_titles(op.get_bind())


def downgrade() -> None:
    raise RuntimeError(
        "0014 is a forward-only approved-content wording correction. "
        "Restore from a verified backup instead of reintroducing task-framed Decision titles."
    )
