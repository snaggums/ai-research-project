from pathlib import Path

from app.models.document import Document
from app.models.participant import Participant
from app.models.project import Project
from app.models.record import RecordKnowledgePromotion, RecordSynthesisRun, RecordSynthesisSource
from app.models.research_session import ResearchSession
from app.models.session_report import SessionReport
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session


def list_projects(db: Session) -> list[ProjectRead]:
    statement = select(Project).order_by(Project.updated_at.desc())
    return [project_to_read(db, project) for project in db.scalars(statement).all()]


def get_project(db: Session, project_id: str) -> Project | None:
    return db.get(Project, project_id)


def project_to_read(db: Session, project: Project) -> ProjectRead:
    participant_count = db.scalar(
        select(func.count()).select_from(Participant).where(Participant.project_id == project.id)
    ) or 0
    session_count = db.scalar(
        select(func.count()).select_from(ResearchSession).where(ResearchSession.project_id == project.id)
    ) or 0
    ready_transcript_count = db.scalar(
        select(func.count())
        .select_from(ResearchSession)
        .join(Document, Document.id == ResearchSession.primary_transcript_document_id)
        .where(ResearchSession.project_id == project.id, Document.status == "complete")
    ) or 0
    return ProjectRead(
        id=project.id,
        name=project.name,
        description=project.description,
        participant_count=participant_count,
        session_count=session_count,
        ready_transcript_count=ready_transcript_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def create_project(db: Session, payload: ProjectCreate) -> Project:
    project = Project(name=payload.name.strip(), description=payload.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project, payload: ProjectUpdate) -> Project:
    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        project.name = updates["name"].strip()
    if "description" in updates:
        project.description = updates["description"]

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    promoted = db.scalar(
        select(RecordKnowledgePromotion.id)
        .where(RecordKnowledgePromotion.project_id == project.id)
        .limit(1)
    )
    if promoted is not None:
        raise ValueError(
            "This Project contains approved Record Knowledge and cannot be deleted. Preserve it as part of the Record history."
        )
    file_paths = list(
        db.scalars(select(Document.file_path).where(Document.project_id == project.id)).all()
    )
    affected_runs = (
        select(RecordSynthesisSource.run_id)
        .join(SessionReport, SessionReport.id == RecordSynthesisSource.report_id)
        .where(SessionReport.project_id == project.id)
    )
    # A completed Record synthesis may span multiple Projects. If any source
    # Project is deleted, remove that immutable run as a unit so it cannot retain
    # broken provenance or block the established Project deletion workflow.
    db.execute(delete(RecordSynthesisRun).where(RecordSynthesisRun.id.in_(affected_runs)))
    db.flush()
    db.delete(project)
    db.commit()

    for file_path in file_paths:
        path = Path(file_path)
        if path.exists():
            path.unlink()
