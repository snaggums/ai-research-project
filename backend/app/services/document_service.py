from datetime import datetime, timezone
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.document import Document
from app.models.project import Project
from app.services.parsing_service import SUPPORTED_EXTENSIONS, extract_text
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session


def list_project_documents(db: Session, project_id: str) -> list[Document]:
    statement = select(Document).where(Document.project_id == project_id).order_by(Document.uploaded_at.desc())
    return list(db.scalars(statement).all())


def get_document(db: Session, document_id: str) -> Document | None:
    return db.get(Document, document_id)


def create_uploaded_document(db: Session, project: Project, upload: UploadFile) -> Document:
    original_filename = upload.filename or "upload"
    extension = Path(original_filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(f"Unsupported file type. Upload one of: {supported}")

    document_id = str(uuid4())
    project_dir = Path(settings.upload_dir) / f"project_{project.id}"
    project_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"document_{document_id}_{_safe_filename(original_filename)}"
    file_path = project_dir / stored_filename

    with file_path.open("wb") as destination:
        copyfileobj(upload.file, destination)

    document = Document(
        id=document_id,
        project_id=project.id,
        filename=original_filename,
        file_path=str(file_path),
        mime_type=upload.content_type,
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def process_document(document_id: str) -> None:
    db = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if document is None:
            return

        document.status = "processing"
        document.error_message = None
        document.processed_at = None
        db.add(document)
        db.commit()

        try:
            content = extract_text(document.file_path)
            if not content:
                raise ValueError("No text could be extracted from this file.")
            document.content = content
            document.status = "complete"
            document.error_message = None
            document.processed_at = datetime.now(timezone.utc)
        except Exception as exc:
            document.status = "failed"
            document.error_message = str(exc)
            document.processed_at = datetime.now(timezone.utc)

        db.add(document)
        db.commit()
    finally:
        db.close()


def delete_document(db: Session, document: Document) -> None:
    file_path = Path(document.file_path)
    db.delete(document)
    db.commit()
    if file_path.exists():
        file_path.unlink()


def _safe_filename(filename: str) -> str:
    safe = "".join(character if character.isalnum() or character in {".", "-", "_"} else "_" for character in filename)
    return safe[:120] or "upload"
