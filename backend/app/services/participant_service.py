from app.models.participant import Participant, ParticipantRecord
from app.models.research_session import SessionParticipant
from app.schemas.participant import ParticipantCreate, ParticipantRead, ParticipantUpdate
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload


def list_participants(db: Session, project_id: str, search: str | None = None) -> list[ParticipantRead]:
    statement = select(Participant).options(selectinload(Participant.record_memberships)).where(Participant.project_id == project_id)
    if search and search.strip():
        value = f"%{search.strip()}%"
        statement = statement.where(or_(Participant.first_name.ilike(value), Participant.last_name.ilike(value), Participant.email.ilike(value)))
    statement = statement.order_by(Participant.last_name, Participant.first_name)
    return [participant_to_read(db, participant) for participant in db.scalars(statement).all()]


def get_participant(db: Session, project_id: str, participant_id: str) -> Participant | None:
    return db.scalar(select(Participant).options(selectinload(Participant.record_memberships)).where(Participant.id == participant_id, Participant.project_id == project_id))


def create_participant(db: Session, project_id: str, payload: ParticipantCreate) -> ParticipantRead:
    participant = Participant(
        project_id=project_id,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=_optional(payload.email),
        organization=_optional(payload.organization),
        role=_optional(payload.role),
        researcher_notes=_optional(payload.researcher_notes),
    )
    db.add(participant)
    db.flush()
    _replace_records(participant, payload.record_ids)
    db.commit()
    return participant_to_read(db, get_participant(db, project_id, participant.id) or participant)


def update_participant(db: Session, participant: Participant, payload: ParticipantUpdate) -> ParticipantRead:
    values = payload.model_dump(exclude_unset=True)
    for key in ("first_name", "last_name"):
        if key in values and values[key] is not None:
            setattr(participant, key, values[key].strip())
    for key in ("email", "organization", "role", "researcher_notes"):
        if key in values:
            setattr(participant, key, _optional(values[key]))
    if "record_ids" in values and values["record_ids"] is not None:
        _replace_records(participant, values["record_ids"])
    db.add(participant)
    db.commit()
    return participant_to_read(db, get_participant(db, participant.project_id, participant.id) or participant)


def delete_participant(db: Session, participant: Participant) -> None:
    db.delete(participant)
    db.commit()


def _replace_records(participant: Participant, record_ids: list[str]) -> None:
    participant.record_memberships = [
        ParticipantRecord(participant_id=participant.id, record_id=record_id)
        for record_id in dict.fromkeys(value.strip() for value in record_ids if value.strip())
    ]


def participant_to_read(db: Session, participant: Participant) -> ParticipantRead:
    session_count = db.scalar(select(func.count()).select_from(SessionParticipant).where(SessionParticipant.participant_id == participant.id)) or 0
    return ParticipantRead(
        id=participant.id,
        project_id=participant.project_id,
        first_name=participant.first_name,
        last_name=participant.last_name,
        email=participant.email,
        organization=participant.organization,
        role=participant.role,
        record_ids=[membership.record_id for membership in participant.record_memberships],
        researcher_notes=participant.researcher_notes,
        session_count=session_count,
        created_at=participant.created_at,
        updated_at=participant.updated_at,
    )


def _optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
