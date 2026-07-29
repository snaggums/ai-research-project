from app.db.session import get_db
from app.schemas.research_session import SessionCreate, SessionFilters, SessionRead, SessionType, SessionUpdate
from app.services import project_service, research_session_service
from app.core.domain_errors import ApplicationError
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["sessions"])


@router.get("/projects/{project_id}/sessions", response_model=list[SessionRead])
def list_sessions(
    project_id: str,
    q: str | None = Query(default=None),
    type: SessionType | None = Query(default=None),
    transcript_status: str | None = Query(default=None),
    analysis_status: str | None = Query(default=None),
    date: str | None = Query(default=None),
    record_id: str | None = Query(default=None),
    common_component_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    _require_project(db, project_id)
    return research_session_service.list_sessions(db, project_id, SessionFilters(q=q, type=type, transcript_status=transcript_status, analysis_status=analysis_status, date=date, record_id=record_id, common_component_id=common_component_id))


@router.post("/projects/{project_id}/sessions", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(project_id: str, payload: SessionCreate, db: Session = Depends(get_db)):
    _require_project(db, project_id)
    try:
        return research_session_service.create_session(db, project_id, payload)
    except ValueError as exc:
        db.rollback()
        if str(exc).startswith("record_change_blocked_by_codes:"):
            raise ApplicationError(
                status.HTTP_409_CONFLICT,
                "record_change_blocked_by_codes",
                str(exc).partition(":")[2].strip(),
            ) from exc
        if str(exc).startswith("record_change_blocked_by_knowledge:"):
            raise ApplicationError(
                status.HTTP_409_CONFLICT,
                "record_change_blocked_by_knowledge",
                str(exc).partition(":")[2].strip(),
            ) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/projects/{project_id}/sessions/{session_id}", response_model=SessionRead)
def get_session(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return research_session_service.session_to_read(db, research_session)


@router.patch("/projects/{project_id}/sessions/{session_id}", response_model=SessionRead)
def update_session(project_id: str, session_id: str, payload: SessionUpdate, db: Session = Depends(get_db)):
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    try:
        return research_session_service.update_session(db, research_session, payload)
    except ValueError as exc:
        db.rollback()
        if str(exc).startswith("record_change_blocked_by_codes:"):
            raise ApplicationError(
                status.HTTP_409_CONFLICT,
                "record_change_blocked_by_codes",
                str(exc).partition(":")[2].strip(),
            ) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/projects/{project_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    try:
        research_session_service.delete_session(db, research_session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return None


def _require_project(db: Session, project_id: str) -> None:
    if project_service.get_project(db, project_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
