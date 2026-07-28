from app.db.session import get_db
from pathlib import Path

from app.schemas.document import DocumentDetail, DocumentRead, TranscriptContext, TranscriptDependencySummary, TranscriptDocumentRead, TranscriptSearchResponse
from app.services import document_service, project_service, research_session_service, transcript_coding_service, transcript_service
from app.core.domain_errors import ApplicationError
from fastapi import APIRouter, BackgroundTasks, Depends, File, Header, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

router = APIRouter(tags=["documents"])


@router.get("/projects/{project_id}/documents", response_model=list[DocumentRead])
def list_project_documents(project_id: str, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return document_service.list_project_documents(db, project_id)


@router.post("/projects/{project_id}/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def upload_document(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        document = document_service.create_uploaded_document(db, project, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    background_tasks.add_task(document_service.process_document, document.id)
    return document


@router.get("/documents/{document_id}", response_model=DocumentDetail)
def get_document(document_id: str, db: Session = Depends(get_db)):
    document = document_service.get_document(db, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.post("/documents/{document_id}/process", response_model=DocumentRead)
def retry_document_processing(document_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = document_service.get_document(db, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    _guard_coding_dependencies(db, document.id)
    document.status = "uploaded"
    document.error_message = None
    document.processed_at = None
    db.add(document)
    db.commit()
    db.refresh(document)
    background_tasks.add_task(document_service.process_document, document.id)
    return document


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = document_service.get_document(db, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    research_session = research_session_service.get_session(db, document.project_id, document.session_id)
    if research_session and research_session.primary_transcript_document_id == document.id:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_confirmation_required",
            "Delete the active Transcript from its Session so AIR can preserve its evidence history.",
        )
    _guard_coding_dependencies(db, document.id)
    document_service.delete_document(db, document)
    return None


@router.get("/projects/{project_id}/sessions/{session_id}/documents", response_model=list[TranscriptDocumentRead])
def list_session_documents(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    return [transcript_service.document_to_read(db, document, research_session) for document in document_service.list_session_documents(db, project_id, session_id)]


@router.post("/projects/{project_id}/sessions/{session_id}/documents", response_model=TranscriptDocumentRead, status_code=status.HTTP_201_CREATED)
def upload_session_document(
    project_id: str,
    session_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = project_service.get_project(db, project_id)
    research_session = _require_session(db, project_id, session_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if research_session.primary_transcript_document_id is not None:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_already_exists",
            "This Session already has an active Transcript. Use Replace transcript to preserve its evidence history.",
        )
    try:
        document = document_service.create_uploaded_document(db, project, file, research_session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    background_tasks.add_task(document_service.process_document, document.id)
    return transcript_service.document_to_read(db, document, research_session)


@router.post(
    "/projects/{project_id}/sessions/{session_id}/transcript-replacement",
    response_model=TranscriptDocumentRead,
    status_code=status.HTTP_201_CREATED,
)
def replace_session_transcript(
    project_id: str,
    session_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: Session = Depends(get_db),
):
    project = project_service.get_project(db, project_id)
    research_session = _require_session(db, project_id, session_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    try:
        document = document_service.create_replacement_document(
            db,
            project,
            research_session,
            file,
            idempotency_key,
        )
    except ValueError as exc:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_replacement_failed",
            str(exc),
        ) from exc
    if document.status == "uploaded":
        background_tasks.add_task(document_service.process_document, document.id)
    return transcript_service.document_to_read(db, document, research_session)


@router.get("/projects/{project_id}/sessions/{session_id}/documents/{document_id}", response_model=TranscriptDocumentRead)
def get_session_document(project_id: str, session_id: str, document_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    return transcript_service.document_to_read(db, document, research_session)


@router.get(
    "/projects/{project_id}/sessions/{session_id}/documents/{document_id}/dependencies",
    response_model=TranscriptDependencySummary,
)
def get_session_document_dependencies(
    project_id: str,
    session_id: str,
    document_id: str,
    db: Session = Depends(get_db),
):
    research_session = _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    return document_service.get_transcript_dependencies(db, research_session, document)


@router.post("/projects/{project_id}/sessions/{session_id}/documents/{document_id}/process", response_model=TranscriptDocumentRead)
def retry_session_document(project_id: str, session_id: str, document_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    _guard_coding_dependencies(db, document.id)
    document.status = "uploaded"
    document.error_message = None
    document.processed_at = None
    db.add(document)
    db.commit()
    db.refresh(document)
    background_tasks.add_task(document_service.process_document, document.id)
    return transcript_service.document_to_read(db, document, research_session)


@router.post("/projects/{project_id}/sessions/{session_id}/documents/{document_id}/primary", response_model=TranscriptDocumentRead)
def set_primary_session_document(project_id: str, session_id: str, document_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    if research_session.primary_transcript_document_id != document.id:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_replacement_required",
            "Use Replace transcript to change the active Transcript while preserving evidence history.",
        )
    return transcript_service.document_to_read(db, document, research_session)


@router.delete("/projects/{project_id}/sessions/{session_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session_document(
    project_id: str,
    session_id: str,
    document_id: str,
    confirmation: str | None = Header(None, alias="X-Transcript-Confirmation"),
    dependency_version: str | None = Header(None, alias="If-Match"),
    db: Session = Depends(get_db),
):
    research_session = _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    dependencies = document_service.get_transcript_dependencies(db, research_session, document)
    if confirmation != "preserve-lineage" or dependency_version is None:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_confirmation_required",
            "Review the linked evidence and confirm that research history will be preserved.",
        )
    if dependency_version != dependencies.version:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_dependency_changed",
            "Linked evidence changed after the confirmation opened. Review the refreshed counts and try again.",
        )
    try:
        document_service.tombstone_active_transcript(db, research_session, document)
    except ValueError as exc:
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_delete_failed",
            str(exc),
        ) from exc
    return None


@router.get("/projects/{project_id}/sessions/{session_id}/documents/{document_id}/search", response_model=TranscriptSearchResponse)
def search_session_document(project_id: str, session_id: str, document_id: str, q: str = Query(min_length=1), db: Session = Depends(get_db)):
    _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    try:
        return transcript_service.search_document(db, document, q)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/projects/{project_id}/sessions/{session_id}/documents/{document_id}/context/{result_id}", response_model=TranscriptContext)
def get_session_document_context(project_id: str, session_id: str, document_id: str, result_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    context = transcript_service.get_context(db, document, research_session, result_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript context not found")
    return context


@router.get("/projects/{project_id}/sessions/{session_id}/documents/{document_id}/download")
def download_session_document(project_id: str, session_id: str, document_id: str, db: Session = Depends(get_db)):
    _require_session(db, project_id, session_id)
    document = _require_document(db, project_id, session_id, document_id)
    path = Path(document.file_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript file not found")
    return FileResponse(path, media_type=document.mime_type, filename=document.filename)


def _require_session(db: Session, project_id: str, session_id: str):
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return research_session


def _require_document(db: Session, project_id: str, session_id: str, document_id: str):
    document = document_service.get_session_document(db, project_id, session_id, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
    return document


def _guard_coding_dependencies(db: Session, document_id: str) -> None:
    if transcript_coding_service.has_document_coding_dependencies(db, document_id):
        raise ApplicationError(
            status.HTTP_409_CONFLICT,
            "transcript_has_coding_dependencies",
            "This Transcript contains Highlights or Code Suggestions and cannot be replaced or deleted in the current workflow. Keep it as the Primary Transcript so its evidence remains traceable.",
        )
