from datetime import date

from app.models.document import Document
from app.models.participant import Participant
from app.models.research_session import ResearchSession, SessionParticipant, SessionRelationship
from app.models.session_report import SessionReport
from app.models.theme import Theme
from app.schemas.research_session import SessionCreate, SessionFilters, SessionRead, SessionReference, SessionUpdate
from app.services.participant_service import participant_to_read
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload


def list_sessions(db: Session, project_id: str, filters: SessionFilters) -> list[SessionRead]:
    statement = _loaded_select().where(ResearchSession.project_id == project_id).order_by(ResearchSession.updated_at.desc())
    sessions = [session_to_read(db, item) for item in db.scalars(statement).unique().all()]
    return [item for item in sessions if _matches(item, filters)]


def get_session(db: Session, project_id: str, session_id: str) -> ResearchSession | None:
    return db.scalar(_loaded_select().where(ResearchSession.id == session_id, ResearchSession.project_id == project_id))


def create_session(db: Session, project_id: str, payload: SessionCreate) -> SessionRead:
    research_session = ResearchSession(
        project_id=project_id,
        title=payload.title.strip(),
        session_type=payload.type,
        starts_at=payload.starts_at,
        duration_minutes=payload.duration_minutes,
        description=_optional(payload.description),
    )
    db.add(research_session)
    db.flush()
    _replace_participants(db, research_session, payload.participant_ids)
    _replace_relationships(research_session, "record", payload.related_record_ids, payload.related_records)
    _replace_relationships(research_session, "common-component", payload.related_common_component_ids, payload.related_common_components)
    db.commit()
    return session_to_read(db, get_session(db, project_id, research_session.id) or research_session)


def update_session(db: Session, research_session: ResearchSession, payload: SessionUpdate) -> SessionRead:
    values = payload.model_dump(exclude_unset=True)
    if "title" in values and values["title"] is not None:
        research_session.title = values["title"].strip()
    if "type" in values and values["type"] is not None:
        research_session.session_type = values["type"]
    for key in ("starts_at", "duration_minutes"):
        if key in values:
            setattr(research_session, key, values[key])
    if "description" in values:
        research_session.description = _optional(values["description"])
    if values.get("participant_ids") is not None:
        _replace_participants(db, research_session, values["participant_ids"])
    if values.get("related_record_ids") is not None or values.get("related_records") is not None:
        _replace_relationships(research_session, "record", values.get("related_record_ids") or [], values.get("related_records") or [])
    if values.get("related_common_component_ids") is not None or values.get("related_common_components") is not None:
        _replace_relationships(research_session, "common-component", values.get("related_common_component_ids") or [], values.get("related_common_components") or [])
    db.add(research_session)
    db.commit()
    return session_to_read(db, get_session(db, research_session.project_id, research_session.id) or research_session)


def delete_session(db: Session, research_session: ResearchSession) -> None:
    if research_session.documents:
        raise ValueError("Delete the Session transcripts before deleting this Session.")
    db.delete(research_session)
    db.commit()


def _loaded_select():
    return select(ResearchSession).options(
        selectinload(ResearchSession.documents),
        selectinload(ResearchSession.participant_memberships).selectinload(SessionParticipant.participant).selectinload(Participant.record_memberships),
        selectinload(ResearchSession.relationships),
        selectinload(ResearchSession.themes),
        selectinload(ResearchSession.reports),
    )


def _replace_participants(db: Session, research_session: ResearchSession, participant_ids: list[str]) -> None:
    unique_ids = list(dict.fromkeys(participant_ids))
    if unique_ids:
        participants = list(db.scalars(select(Participant).where(Participant.id.in_(unique_ids))).all())
        if len(participants) != len(unique_ids) or any(participant.project_id != research_session.project_id for participant in participants):
            raise ValueError("Every Session participant must belong to this Project.")
    research_session.participant_memberships = [
        SessionParticipant(session_id=research_session.id, participant_id=participant_id)
        for participant_id in unique_ids
    ]


def _replace_relationships(research_session: ResearchSession, target_type: str, target_ids: list[str], references: list[SessionReference]) -> None:
    names = {reference.id: reference.name for reference in references}
    replacement: list[SessionRelationship] = []
    for target_id in dict.fromkeys(value.strip() for value in target_ids if value.strip()):
        replacement.append(SessionRelationship(session_id=research_session.id, target_type=target_type, target_id=target_id, target_name=names.get(target_id, target_id)))
    for reference in references:
        if reference.id not in target_ids:
            replacement.append(SessionRelationship(session_id=research_session.id, target_type=target_type, target_id=reference.id, target_name=reference.name))
    research_session.relationships = [
        value for value in research_session.relationships if value.target_type != target_type
    ] + replacement


def session_to_read(db: Session, research_session: ResearchSession) -> SessionRead:
    documents = list(research_session.documents)
    primary = next((document for document in documents if document.id == research_session.primary_transcript_document_id), None)
    representative = primary or (documents[0] if documents else None)
    themes = sorted(research_session.themes, key=lambda value: value.updated_at, reverse=True)
    reports = sorted(research_session.reports, key=lambda value: value.updated_at, reverse=True)
    participants = [membership.participant for membership in research_session.participant_memberships]
    return SessionRead(
        id=research_session.id,
        project_id=research_session.project_id,
        title=research_session.title,
        type=research_session.session_type,
        starts_at=research_session.starts_at,
        duration_minutes=research_session.duration_minutes,
        description=research_session.description,
        participants=[participant_to_read(db, participant) for participant in participants],
        participant_ids=[participant.id for participant in participants],
        document_count=len(documents),
        transcript_names=[document.filename for document in documents],
        transcript_status=representative.status if representative else "none",
        has_primary_transcript=primary is not None,
        theme_status=themes[0].status if themes else "not-generated",
        report_status=reports[0].status if reports else "not-generated",
        related_records=[SessionReference(id=value.target_id, name=value.target_name) for value in research_session.relationships if value.target_type == "record"],
        related_common_components=[SessionReference(id=value.target_id, name=value.target_name) for value in research_session.relationships if value.target_type == "common-component"],
        created_at=research_session.created_at,
        updated_at=research_session.updated_at,
    )


def _matches(item: SessionRead, filters: SessionFilters) -> bool:
    if filters.q:
        query = filters.q.casefold()
        text = " ".join([item.title, *item.transcript_names, *(f"{p.first_name} {p.last_name}" for p in item.participants)]).casefold()
        if query not in text:
            return False
    if filters.type and item.type != filters.type:
        return False
    if filters.transcript_status and item.transcript_status != filters.transcript_status:
        return False
    if filters.analysis_status and filters.analysis_status not in {item.theme_status, item.report_status}:
        return False
    if filters.date:
        try:
            expected = date.fromisoformat(filters.date)
        except ValueError:
            return False
        if not item.starts_at or item.starts_at.date() != expected:
            return False
    if filters.record_id and filters.record_id not in {value.id for value in item.related_records}:
        return False
    if filters.common_component_id and filters.common_component_id not in {value.id for value in item.related_common_components}:
        return False
    return True


def _optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
