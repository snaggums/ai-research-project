from uuid import UUID

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.research_session import ResearchSession
from app.services.v1_migration_service import deterministic_import_session_id, get_or_create_import_session

pytestmark = pytest.mark.integration


def test_import_session_identifier_is_stable() -> None:
    project_id = "e381815a-4b88-4af5-8228-4a2ed0f28847"
    first = deterministic_import_session_id(project_id)
    second = deterministic_import_session_id(project_id)
    assert first == second
    UUID(first)


def test_import_session_creation_is_idempotent(db_session: Session, client) -> None:
    project = client.post("/api/projects", json={"name": "V1 Project", "description": None}).json()
    first = get_or_create_import_session(db_session, project["id"])
    db_session.commit()
    second = get_or_create_import_session(db_session, project["id"])
    db_session.commit()
    assert first.id == second.id == deterministic_import_session_id(project["id"])
    count = db_session.scalar(select(func.count()).select_from(ResearchSession).where(ResearchSession.project_id == project["id"], ResearchSession.migration_source == "v1-project"))
    assert count == 1
