from app.db.session import get_db
from app.schemas.record import (
    RecordAssignment,
    RecordCatalogRead,
    RecordSynthesisEligibilityRead,
    RecordSynthesisEvidenceRead,
    RecordSynthesisGenerateRequest,
    RecordSynthesisItemRead,
    RecordSynthesisItemUpdate,
    RecordSynthesisRead,
)
from app.schemas.research_session import SessionRead
from app.services import record_service, research_session_service
from app.core.domain_errors import ApplicationError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session


router = APIRouter(tags=["records"])


@router.get("/records", response_model=list[RecordCatalogRead])
def list_records(db: Session = Depends(get_db)):
    return record_service.list_records(db)


@router.get("/records/{record_id}", response_model=RecordCatalogRead)
def get_record(record_id: str, db: Session = Depends(get_db)):
    record = record_service.get_record_read(db, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.get("/records/{record_id}/sessions", response_model=list[SessionRead])
def list_record_sessions(record_id: str, db: Session = Depends(get_db)):
    _require_record(db, record_id)
    return record_service.list_record_sessions(db, record_id)


@router.put("/projects/{project_id}/sessions/{session_id}/record", response_model=SessionRead)
def assign_session_record(project_id: str, session_id: str, payload: RecordAssignment, db: Session = Depends(get_db)):
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    try:
        return record_service.assign_session_record(db, research_session, payload.record_id)
    except ValueError as exc:
        db.rollback()
        if str(exc).startswith("record_change_blocked_by_codes:"):
            raise ApplicationError(
                status.HTTP_409_CONFLICT,
                "record_change_blocked_by_codes",
                str(exc).partition(":")[2].strip(),
            ) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/records/{record_id}/synthesis/eligibility", response_model=RecordSynthesisEligibilityRead)
def get_record_synthesis_eligibility(record_id: str, db: Session = Depends(get_db)):
    _require_record(db, record_id)
    return record_service.get_eligibility(db, record_id)


@router.get("/records/{record_id}/synthesis/latest", response_model=RecordSynthesisRead | None)
def get_latest_record_synthesis(record_id: str, db: Session = Depends(get_db)):
    _require_record(db, record_id)
    return record_service.get_latest_synthesis(db, record_id)


@router.post(
    "/records/{record_id}/synthesis",
    response_model=RecordSynthesisRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_record_synthesis(
    record_id: str,
    payload: RecordSynthesisGenerateRequest,
    db: Session = Depends(get_db),
):
    _require_record(db, record_id)
    try:
        return record_service.generate_synthesis(db, record_id, payload.client_request_key)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch("/records/{record_id}/synthesis/items/{item_id}", response_model=RecordSynthesisItemRead)
def update_record_synthesis_item(record_id: str, item_id: str, payload: RecordSynthesisItemUpdate, db: Session = Depends(get_db)):
    _require_record(db, record_id)
    item = record_service.update_synthesis_item(db, record_id, item_id, payload.status)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Synthesis item not found")
    return item


@router.get("/records/{record_id}/synthesis/items/{item_id}/evidence/{evidence_id}", response_model=RecordSynthesisEvidenceRead)
def get_record_synthesis_evidence(record_id: str, item_id: str, evidence_id: str, db: Session = Depends(get_db)):
    _require_record(db, record_id)
    evidence = record_service.get_synthesis_evidence(db, record_id, item_id, evidence_id)
    if evidence is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
    return evidence


def _require_record(db: Session, record_id: str) -> None:
    if record_service.get_record(db, record_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
