from uuid import UUID, uuid5

from app.models.research_session import ResearchSession
from sqlalchemy import select
from sqlalchemy.orm import Session

AIR_V2_MIGRATION_NAMESPACE = UUID("4b9bca8e-0f3d-4b7e-a6e6-b972bc98a5fb")
V1_IMPORT_SOURCE = "v1-project"


def deterministic_import_session_id(project_id: str) -> str:
    return str(uuid5(AIR_V2_MIGRATION_NAMESPACE, f"{V1_IMPORT_SOURCE}:{project_id}"))


def get_or_create_import_session(db: Session, project_id: str) -> ResearchSession:
    existing = db.scalar(select(ResearchSession).where(ResearchSession.project_id == project_id, ResearchSession.migration_source == V1_IMPORT_SOURCE))
    if existing is not None:
        return existing
    research_session = ResearchSession(
        id=deterministic_import_session_id(project_id),
        project_id=project_id,
        title="Imported research",
        session_type="other",
        description="Research imported from the AIR V1 Project workspace.",
        migration_source=V1_IMPORT_SOURCE,
    )
    db.add(research_session)
    db.flush()
    return research_session
