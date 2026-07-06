from pathlib import Path

from app.models.document import Document
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from sqlalchemy import select
from sqlalchemy.orm import Session


def list_projects(db: Session) -> list[Project]:
    statement = select(Project).order_by(Project.updated_at.desc())
    return list(db.scalars(statement).all())


def get_project(db: Session, project_id: str) -> Project | None:
    return db.get(Project, project_id)


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
    file_paths = list(
        db.scalars(select(Document.file_path).where(Document.project_id == project.id)).all()
    )
    db.delete(project)
    db.commit()

    for file_path in file_paths:
        path = Path(file_path)
        if path.exists():
            path.unlink()
