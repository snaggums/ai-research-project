from app.db.session import get_db
from app.schemas.transcript_coding import (
    HighlightCodesUpdate,
    RecordCodeCreate,
    RecordCodeRead,
    RecordCodeUpdate,
    RecordTranscriptCodesRead,
    TranscriptCodeSuggestionRead,
    TranscriptCodeSuggestionUpdate,
    TranscriptCodingWorkspaceRead,
    TranscriptHighlightCreate,
    TranscriptHighlightRead,
    TranscriptHighlightUpdate,
)
from app.services import transcript_coding_service
from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy.orm import Session


router = APIRouter(tags=["transcript-coding"])


@router.get(
    "/projects/{project_id}/sessions/{session_id}/coding",
    response_model=TranscriptCodingWorkspaceRead,
)
def get_coding_workspace(project_id: str, session_id: str, db: Session = Depends(get_db)):
    return transcript_coding_service.get_workspace(db, project_id, session_id)


@router.get(
    "/projects/{project_id}/sessions/{session_id}/highlights",
    response_model=list[TranscriptHighlightRead],
)
def list_highlights(
    project_id: str,
    session_id: str,
    status_filter: str = Query(default="all", alias="status", pattern="^(all|accepted-coded|uncoded)$"),
    code_id: list[str] = Query(default=[]),
    cursor: str | None = Query(default=None),
    view: str = Query(default="list", pattern="^(transcript|list)$"),
    include_media: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=250),
    db: Session = Depends(get_db),
):
    del view, include_media
    return transcript_coding_service.list_highlights(
        db,
        project_id,
        session_id,
        status_filter,
        code_id,
        cursor,
        limit,
    )


@router.post(
    "/projects/{project_id}/sessions/{session_id}/highlights",
    response_model=TranscriptHighlightRead,
    status_code=status.HTTP_201_CREATED,
)
def create_highlight(
    project_id: str,
    session_id: str,
    payload: TranscriptHighlightCreate,
    request_key: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.create_highlight(db, project_id, session_id, payload, request_key)


@router.patch(
    "/projects/{project_id}/sessions/{session_id}/highlights/{highlight_id}",
    response_model=TranscriptHighlightRead,
)
def update_highlight(
    project_id: str,
    session_id: str,
    highlight_id: str,
    payload: TranscriptHighlightUpdate,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.update_highlight(db, project_id, session_id, highlight_id, payload)


@router.delete(
    "/projects/{project_id}/sessions/{session_id}/highlights/{highlight_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_highlight(
    project_id: str,
    session_id: str,
    highlight_id: str,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    transcript_coding_service.delete_highlight(db, project_id, session_id, highlight_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/projects/{project_id}/sessions/{session_id}/highlights/{highlight_id}/codes",
    response_model=TranscriptHighlightRead,
)
def add_highlight_codes(
    project_id: str,
    session_id: str,
    highlight_id: str,
    payload: HighlightCodesUpdate,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.add_highlight_codes(db, project_id, session_id, highlight_id, payload)


@router.delete(
    "/projects/{project_id}/sessions/{session_id}/highlights/{highlight_id}/codes/{code_id}",
    response_model=TranscriptHighlightRead,
)
def remove_highlight_code(
    project_id: str,
    session_id: str,
    highlight_id: str,
    code_id: str,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.remove_highlight_code(db, project_id, session_id, highlight_id, code_id)


@router.get("/records/{record_id}/codes", response_model=list[RecordCodeRead])
def list_codes(record_id: str, db: Session = Depends(get_db)):
    return transcript_coding_service.list_codes(db, record_id)


@router.get(
    "/records/{record_id}/transcript-codes",
    response_model=RecordTranscriptCodesRead,
)
def list_accepted_record_codes(record_id: str, db: Session = Depends(get_db)):
    return transcript_coding_service.list_accepted_record_codes(db, record_id)


@router.post("/records/{record_id}/codes", response_model=RecordCodeRead, status_code=status.HTTP_201_CREATED)
def create_code(
    record_id: str,
    payload: RecordCodeCreate,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.create_code(db, record_id, payload)


@router.patch("/records/{record_id}/codes/{code_id}", response_model=RecordCodeRead)
def update_code(
    record_id: str,
    code_id: str,
    payload: RecordCodeUpdate,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.update_code(db, record_id, code_id, payload)


@router.get("/records/{record_id}/highlights", response_model=list[TranscriptHighlightRead])
def list_record_highlights(
    record_id: str,
    status_filter: str = Query(default="all", alias="status", pattern="^(all|accepted-coded|uncoded)$"),
    code_id: list[str] = Query(default=[]),
    cursor: str | None = Query(default=None),
    include_media: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=250),
    db: Session = Depends(get_db),
):
    del include_media
    return transcript_coding_service.list_record_highlights(
        db,
        record_id,
        status_filter,
        code_id,
        cursor,
        limit,
    )


@router.get(
    "/projects/{project_id}/sessions/{session_id}/code-suggestions",
    response_model=list[TranscriptCodeSuggestionRead],
)
def list_suggestions(project_id: str, session_id: str, db: Session = Depends(get_db)):
    return transcript_coding_service.list_suggestions(db, project_id, session_id)


@router.post(
    "/projects/{project_id}/sessions/{session_id}/code-suggestions/generate",
    response_model=TranscriptCodingWorkspaceRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_suggestions(
    project_id: str,
    session_id: str,
    request_key: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.generate_suggestions(db, project_id, session_id, request_key)


@router.patch(
    "/projects/{project_id}/sessions/{session_id}/code-suggestions/{suggestion_id}",
    response_model=TranscriptCodeSuggestionRead,
)
def update_suggestion(
    project_id: str,
    session_id: str,
    suggestion_id: str,
    payload: TranscriptCodeSuggestionUpdate,
    _: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.update_suggestion(db, project_id, session_id, suggestion_id, payload)


@router.post(
    "/projects/{project_id}/sessions/{session_id}/code-suggestions/{suggestion_id}/accept",
    response_model=TranscriptCodingWorkspaceRead,
)
def accept_suggestion(
    project_id: str,
    session_id: str,
    suggestion_id: str,
    request_key: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.accept_suggestion(db, project_id, session_id, suggestion_id, request_key)


@router.post(
    "/projects/{project_id}/sessions/{session_id}/code-suggestions/{suggestion_id}/reject",
    response_model=TranscriptCodeSuggestionRead,
)
def reject_suggestion(
    project_id: str,
    session_id: str,
    suggestion_id: str,
    request_key: str = Header(alias="Idempotency-Key", min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    return transcript_coding_service.reject_suggestion(db, project_id, session_id, suggestion_id, request_key)
