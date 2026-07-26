from app.db.session import get_db
from app.schemas.synthesis import (
    AskSessionRequest,
    AskSessionResponse,
    SessionConversationRead,
    SessionReportGenerateResponse,
    SessionReportRead,
    SessionReportItemUpdate,
    SessionReportUpdate,
    SessionThemeGenerateResponse,
    SessionThemeRead,
    SessionThemeUpdate,
)
from app.services import research_session_service, synthesis_service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["session synthesis"])


@router.get("/projects/{project_id}/sessions/{session_id}/themes", response_model=list[SessionThemeRead])
def list_session_themes(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    return synthesis_service.list_session_themes(db, research_session)


@router.post("/projects/{project_id}/sessions/{session_id}/themes/generate", response_model=SessionThemeGenerateResponse)
def generate_session_themes(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    try:
        return synthesis_service.generate_session_themes(db, research_session)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/projects/{project_id}/sessions/{session_id}/themes/{theme_id}", response_model=SessionThemeRead)
def update_session_theme(project_id: str, session_id: str, theme_id: str, payload: SessionThemeUpdate, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    theme = synthesis_service.update_session_theme(db, research_session, theme_id, payload)
    if theme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    return theme


@router.get("/projects/{project_id}/sessions/{session_id}/report", response_model=SessionReportRead | None)
def get_session_report(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    return synthesis_service.get_session_report(db, research_session)


@router.post("/projects/{project_id}/sessions/{session_id}/report/generate", response_model=SessionReportGenerateResponse)
def generate_session_report(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    try:
        report = synthesis_service.generate_session_report(db, research_session)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return SessionReportGenerateResponse(report=report, message="Session Report generated.")


@router.patch("/projects/{project_id}/sessions/{session_id}/report", response_model=SessionReportRead)
def update_session_report(project_id: str, session_id: str, payload: SessionReportUpdate, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    report = synthesis_service.update_session_report(db, research_session, payload)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session Report not found")
    return report


@router.patch("/projects/{project_id}/sessions/{session_id}/report/items/{item_id}", response_model=SessionReportRead)
def update_session_report_item(project_id: str, session_id: str, item_id: str, payload: SessionReportItemUpdate, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    try:
        report = synthesis_service.update_session_report_item(db, research_session, item_id, payload)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session Report item not found")
    return report


@router.post("/projects/{project_id}/sessions/{session_id}/report/revisions", response_model=SessionReportRead, status_code=status.HTTP_201_CREATED)
def create_session_report_revision(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    report = synthesis_service.create_session_report_revision(db, research_session)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session Report not found")
    return report


@router.get("/projects/{project_id}/sessions/{session_id}/conversations", response_model=SessionConversationRead)
def get_session_conversation(project_id: str, session_id: str, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    return synthesis_service.get_session_conversation(db, research_session)


@router.post("/projects/{project_id}/sessions/{session_id}/conversations/ask", response_model=AskSessionResponse)
def ask_session(project_id: str, session_id: str, payload: AskSessionRequest, db: Session = Depends(get_db)):
    research_session = _require_session(db, project_id, session_id)
    try:
        return synthesis_service.ask_session(db, research_session, payload.question)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


def _require_session(db: Session, project_id: str, session_id: str):
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return research_session
