"""rename fixed Medicare and Medicaid Records

Revision ID: 0012_rename_fixed_records
Revises: 0011_transcript_lifecycle
Create Date: 2026-07-28 18:00:00.000000

The three fixed Record IDs and every relationship remain unchanged. This
idempotent data migration updates only their researcher-facing catalog copy.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.engine import Connection


revision: str = "0012_rename_fixed_records"
down_revision: str | None = "0011_transcript_lifecycle"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


FIXED_RECORDS = (
    (
        "record-1",
        "Medicare Fraud Documenter",
        "Research and synthesized product knowledge for documenting Medicare fraud cases.",
    ),
    (
        "record-2",
        "Medicaid Fraud Documenter",
        "Research and synthesized product knowledge for documenting Medicaid fraud cases.",
    ),
    (
        "record-3",
        "Medicare Fraud Finder",
        "Research and synthesized product knowledge for finding Medicare fraud cases.",
    ),
)


def rename_fixed_records(connection: Connection) -> None:
    for record_id, name, description in FIXED_RECORDS:
        connection.execute(
            sa.text(
                """
                UPDATE records
                SET name = :name,
                    description = :description,
                    updated_at = now()
                WHERE id = :id
                  AND (name IS DISTINCT FROM :name OR description IS DISTINCT FROM :description)
                """
            ),
            {"id": record_id, "name": name, "description": description},
        )

        connection.execute(
            sa.text(
                """
                UPDATE session_relationships
                SET target_name = :name
                WHERE target_type = 'record'
                  AND (
                    lower(target_id) = :id
                    OR lower(target_name) = :legacy_name
                  )
                  AND target_name IS DISTINCT FROM :name
                """
            ),
            {
                "id": record_id,
                "legacy_name": record_id.replace("-", " "),
                "name": name,
            },
        )


def upgrade() -> None:
    rename_fixed_records(op.get_bind())


def downgrade() -> None:
    raise RuntimeError(
        "0012 is a forward-only display-name migration. Restore from a verified backup instead of reverting fixed Record names."
    )
