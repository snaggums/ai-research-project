from app.db.session import get_db
from app.schemas.participant import ParticipantCreate, ParticipantRead, ParticipantUpdate
from app.services import participant_service, project_service
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["participants"])


@router.get("/projects/{project_id}/participants", response_model=list[ParticipantRead])
def list_participants(project_id: str, q: str | None = Query(default=None), db: Session = Depends(get_db)):
    _require_project(db, project_id)
    return participant_service.list_participants(db, project_id, q)


@router.post("/projects/{project_id}/participants", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
def create_participant(project_id: str, payload: ParticipantCreate, db: Session = Depends(get_db)):
    _require_project(db, project_id)
    return participant_service.create_participant(db, project_id, payload)


@router.get("/projects/{project_id}/participants/{participant_id}", response_model=ParticipantRead)
def get_participant(project_id: str, participant_id: str, db: Session = Depends(get_db)):
    participant = participant_service.get_participant(db, project_id, participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    return participant_service.participant_to_read(db, participant)


@router.patch("/projects/{project_id}/participants/{participant_id}", response_model=ParticipantRead)
def update_participant(project_id: str, participant_id: str, payload: ParticipantUpdate, db: Session = Depends(get_db)):
    participant = participant_service.get_participant(db, project_id, participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    return participant_service.update_participant(db, participant, payload)


@router.delete("/projects/{project_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(project_id: str, participant_id: str, db: Session = Depends(get_db)):
    participant = participant_service.get_participant(db, project_id, participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    participant_service.delete_participant(db, participant)
    return None


def _require_project(db: Session, project_id: str) -> None:
    if project_service.get_project(db, project_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
