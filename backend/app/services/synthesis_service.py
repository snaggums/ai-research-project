from __future__ import annotations

from datetime import datetime, timezone

from app.models.chunk import Chunk
from app.models.conversation import Conversation, ConversationMessage, MessageCitation
from app.models.document import Document
from app.models.research_session import ResearchSession, SessionParticipant
from app.models.session_report import SessionReport, SessionReportEvidence, SessionReportItem
from app.models.theme import Theme
from app.models.theme_evidence import ThemeEvidence
from app.schemas.chat import ChatCitation
from app.schemas.synthesis import (
    AskSessionResponse,
    SessionCitationRead,
    SessionConversationRead,
    SessionConversationTurnRead,
    SessionEvidenceRead,
    SessionReportItemRead,
    SessionReportOwnershipRead,
    SessionReportParticipantRead,
    SessionReportRead,
    SessionReportItemUpdate,
    SessionReportUpdate,
    SessionThemeGenerateResponse,
    SessionThemeRead,
    SessionThemeUpdate,
)
from app.services import ai_settings_service, chat_service, record_knowledge_service, theme_service
from app.services.embedding_service import embed_text
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload


REPORT_ITEM_TYPES = ("requirement", "decision", "action-item", "open-question", "key-insight")
LEGACY_DETAILED_NOTES = "Review each generated item and its supporting transcript evidence before approval."


def list_session_themes(db: Session, research_session: ResearchSession) -> list[SessionThemeRead]:
    statement = (
        select(Theme)
        .options(selectinload(Theme.evidence).selectinload(ThemeEvidence.document))
        .where(Theme.project_id == research_session.project_id, Theme.session_id == research_session.id)
        .order_by(Theme.created_at.desc())
    )
    return [_theme_to_read(theme, research_session) for theme in db.scalars(statement).all()]


def generate_session_themes(db: Session, research_session: ResearchSession, max_themes: int = 5) -> SessionThemeGenerateResponse:
    chunks = _session_chunks(db, research_session.id)
    if not chunks:
        raise ValueError("Upload and process a transcript before generating themes.")

    settings = ai_settings_service.get_or_create_settings(db)
    used_mock = theme_service._should_use_mock(settings)
    generated = (
        theme_service._generate_mock_themes(chunks, max_themes)
        if used_mock
        else theme_service._generate_with_litellm(settings, chunks, max_themes)
    )
    db.execute(delete(Theme).where(Theme.session_id == research_session.id))
    db.flush()

    chunk_map = {chunk.id: (chunk, filename) for chunk, filename in chunks}
    for generated_theme in generated.themes[:max_themes]:
        evidence_payloads = theme_service._validated_evidence(generated_theme.evidence, chunk_map)
        if not evidence_payloads:
            continue
        theme = Theme(
            project_id=research_session.project_id,
            session_id=research_session.id,
            status="ai-generated",
            title=generated_theme.title.strip(),
            description=generated_theme.description.strip(),
            confidence=theme_service._round_score(generated_theme.confidence),
            created_by="mock" if used_mock else settings.provider,
            model=settings.model,
        )
        db.add(theme)
        db.flush()
        for evidence_payload in evidence_payloads:
            theme_service._add_evidence_model(db, theme.id, evidence_payload, project_id=research_session.project_id)
        theme_service._refresh_evidence_count(db, theme)

    db.commit()
    themes = list_session_themes(db, research_session)
    if not themes:
        raise ValueError("Theme generation did not return evidence from this Session.")
    return SessionThemeGenerateResponse(
        themes=themes,
        message="Themes generated from this Session with local mock analysis."
        if used_mock
        else f"Themes generated from this Session with {settings.provider}.",
    )


def update_session_theme(db: Session, research_session: ResearchSession, theme_id: str, payload: SessionThemeUpdate) -> SessionThemeRead | None:
    theme = db.scalar(
        select(Theme)
        .options(selectinload(Theme.evidence).selectinload(ThemeEvidence.document))
        .where(Theme.id == theme_id, Theme.project_id == research_session.project_id, Theme.session_id == research_session.id)
    )
    if theme is None:
        return None
    values = payload.model_dump(exclude_unset=True)
    if values.get("name") is not None:
        theme.title = values["name"].strip()
    if values.get("summary") is not None:
        theme.description = values["summary"].strip()
    if values.get("status") is not None:
        theme.status = values["status"]
    theme.updated_at = datetime.now(timezone.utc)
    db.add(theme)
    db.commit()
    db.refresh(theme)
    return _theme_to_read(theme, research_session)


def get_session_report(db: Session, research_session: ResearchSession) -> SessionReportRead | None:
    report = db.scalar(_report_select().where(SessionReport.session_id == research_session.id).order_by(SessionReport.created_at.desc()))
    return _report_to_read(report, research_session) if report else None


def generate_session_report(db: Session, research_session: ResearchSession) -> SessionReportRead:
    themes = list_session_themes(db, research_session)
    if not themes:
        themes = generate_session_themes(db, research_session).themes

    current = db.scalar(select(SessionReport).where(SessionReport.session_id == research_session.id, SessionReport.status != "superseded"))
    if current is not None:
        current.status = "superseded"

    report = SessionReport(
        project_id=research_session.project_id,
        session_id=research_session.id,
        status="ai-generated",
        executive_summary=_executive_summary(research_session, themes),
        detailed_notes=_generated_detailed_notes(themes),
    )
    db.add(report)
    db.flush()
    for position, item_type in enumerate(REPORT_ITEM_TYPES):
        theme = themes[position % len(themes)]
        item = SessionReportItem(
            report_id=report.id,
            item_type=item_type,
            title=_report_item_title(item_type, theme.name),
            summary=theme.summary,
            ownership_role="decision-maker" if item_type == "decision" else "assignee" if item_type == "action-item" else None,
            ownership_status="needs-review" if item_type in ("decision", "action-item") else None,
            provenance=f"AI Generated · {len(theme.evidence)} supporting excerpt{'s' if len(theme.evidence) != 1 else ''}",
            position=position,
        )
        db.add(item)
        db.flush()
        for evidence in theme.evidence[:3]:
            item.evidence.append(
                SessionReportEvidence(
                    item_id=item.id,
                    document_id=evidence.document_id,
                    chunk_id=evidence.context_result_id,
                    excerpt=evidence.excerpt,
                    speaker=evidence.speaker,
                    location=evidence.location,
                    relevance=evidence.relevance,
                )
            )
    db.commit()
    loaded = db.scalar(_report_select().where(SessionReport.id == report.id))
    if loaded is None:
        raise RuntimeError("Generated Session Report could not be loaded.")
    return _report_to_read(loaded, research_session)


def update_session_report(db: Session, research_session: ResearchSession, payload: SessionReportUpdate) -> SessionReportRead | None:
    report = db.scalar(_report_select().where(SessionReport.session_id == research_session.id).order_by(SessionReport.created_at.desc()))
    if report is None:
        return None
    values = payload.model_dump(exclude_unset=True, exclude_none=True)
    if report.status == "approved" and (
        any(key in values for key in ("executive_summary", "detailed_notes"))
        or values.get("status") not in {None, "approved"}
    ):
        raise ValueError(
            "Approved Session Reports are preserved. Create a new revision before making changes."
        )
    requested_status = values.get("status")
    if (
        report.status == "approved"
        and requested_status == "approved"
        and set(values) == {"status"}
    ):
        if report.approved_at is None:
            report.approved_at = datetime.now(timezone.utc)
            db.add(report)
            db.flush()
        record_knowledge_service.promote_approved_report(
            db, research_session, report
        )
        db.commit()
        loaded = db.scalar(_report_select().where(SessionReport.id == report.id))
        return _report_to_read(loaded, research_session) if loaded else None
    if requested_status is not None:
        report.status = requested_status
    if values.get("executive_summary") is not None:
        report.executive_summary = values["executive_summary"].strip()
    if values.get("detailed_notes") is not None:
        report.detailed_notes = values["detailed_notes"].strip()
    updated_at = datetime.now(timezone.utc)
    if requested_status == "approved" and report.approved_at is None:
        report.approved_at = updated_at
    report.updated_at = updated_at
    db.add(report)
    db.flush()
    if requested_status == "approved":
        record_knowledge_service.promote_approved_report(
            db, research_session, report
        )
    db.commit()
    loaded = db.scalar(_report_select().where(SessionReport.id == report.id))
    return _report_to_read(loaded, research_session) if loaded else None


def update_session_report_item(
    db: Session,
    research_session: ResearchSession,
    item_id: str,
    payload: SessionReportItemUpdate,
) -> SessionReportRead | None:
    report = db.scalar(_report_select().where(SessionReport.session_id == research_session.id).order_by(SessionReport.created_at.desc()))
    if report is None:
        return None
    if report.status == "approved":
        raise ValueError(
            "Approved Session Reports are preserved. Create a new revision before editing an item."
        )
    item = next((candidate for candidate in report.items if candidate.id == item_id), None)
    if item is None:
        return None
    values = payload.model_dump(exclude_unset=True, exclude_none=True)
    if values.get("title") is not None:
        item.title = values["title"].strip()
    if values.get("summary") is not None:
        item.summary = values["summary"].strip()
    ownership = values.get("ownership")
    if ownership is not None:
        if item.item_type not in ("decision", "action-item"):
            raise ValueError("Ownership only applies to Decisions and Action Items.")
        item.ownership_role = "decision-maker" if item.item_type == "decision" else "assignee"
        item.ownership_status = ownership["status"]
        item.ownership_value = (
            ownership.get("value", "").strip()
            if ownership["status"] == "confirmed"
            else None
        )
    item.provenance = f"Researcher Edited · {len(item.evidence)} supporting excerpt{'s' if len(item.evidence) != 1 else ''}"
    item.updated_at = datetime.now(timezone.utc)
    report.updated_at = datetime.now(timezone.utc)
    db.add_all([item, report])
    db.commit()
    loaded = db.scalar(_report_select().where(SessionReport.id == report.id))
    return _report_to_read(loaded, research_session) if loaded else None


def create_session_report_revision(db: Session, research_session: ResearchSession) -> SessionReportRead | None:
    current = db.scalar(_report_select().where(SessionReport.session_id == research_session.id).order_by(SessionReport.created_at.desc()))
    if current is None:
        return None
    current.status = "superseded"
    revision = SessionReport(
        project_id=current.project_id,
        session_id=current.session_id,
        revision_of_id=current.id,
        status="ai-generated",
        executive_summary=current.executive_summary,
        detailed_notes=current.detailed_notes,
    )
    db.add(revision)
    db.flush()
    for source_item in current.items:
        item = SessionReportItem(
            report_id=revision.id,
            item_type=source_item.item_type,
            title=source_item.title,
            summary=source_item.summary,
            provenance=source_item.provenance,
            ownership_role=source_item.ownership_role,
            ownership_value=source_item.ownership_value,
            ownership_status=source_item.ownership_status,
            ownership_rationale=source_item.ownership_rationale,
            position=source_item.position,
        )
        db.add(item)
        db.flush()
        item.evidence = [
            SessionReportEvidence(
                item_id=item.id,
                document_id=evidence.document_id,
                chunk_id=evidence.chunk_id,
                excerpt=evidence.excerpt,
                speaker=evidence.speaker,
                location=evidence.location,
                relevance=evidence.relevance,
            )
            for evidence in source_item.evidence
        ]
    db.commit()
    loaded = db.scalar(_report_select().where(SessionReport.id == revision.id))
    return _report_to_read(loaded, research_session) if loaded else None


def get_session_conversation(db: Session, research_session: ResearchSession) -> SessionConversationRead:
    conversation = db.scalar(_conversation_select().where(Conversation.session_id == research_session.id, Conversation.status == "saved").order_by(Conversation.created_at))
    if conversation is None:
        conversation = Conversation(project_id=research_session.project_id, session_id=research_session.id, status="saved")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    return _conversation_to_read(conversation)


def ask_session(db: Session, research_session: ResearchSession, question: str) -> AskSessionResponse:
    clean_question = question.strip()
    if not clean_question:
        raise ValueError("Question is required.")
    chunks = _search_session_chunks(db, research_session.id, clean_question, 6)
    if not chunks:
        raise ValueError("No processed transcript excerpts were found for this Session.")
    conversation = db.scalar(_conversation_select().where(Conversation.session_id == research_session.id, Conversation.status == "saved").order_by(Conversation.created_at))
    if conversation is None:
        conversation = Conversation(project_id=research_session.project_id, session_id=research_session.id, status="saved")
        db.add(conversation)
        db.flush()

    question_message = ConversationMessage(conversation_id=conversation.id, role="researcher", content=clean_question)
    db.add(question_message)
    citations = [
        ChatCitation(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            document_name=filename,
            chunk_index=chunk.chunk_index,
            text=chunk.text,
            score=score,
        )
        for chunk, filename, score in chunks
    ]
    settings = ai_settings_service.get_or_create_settings(db)
    used_mock = settings.provider.strip().lower() == "mock" or not settings.has_api_key
    answer_text = (
        chat_service._mock_answer(clean_question, citations)
        if used_mock
        else chat_service._answer_with_litellm(
            provider=settings.provider,
            model=settings.model,
            base_url=settings.base_url,
            question=clean_question,
            citations=citations,
        )
    )
    answer = ConversationMessage(conversation_id=conversation.id, role="assistant", content=answer_text)
    db.add(answer)
    db.flush()
    for chunk, filename, score in chunks:
        speaker, excerpt = _speaker_and_text(chunk.text)
        answer.citations.append(
            MessageCitation(
                message_id=answer.id,
                document_id=chunk.document_id,
                chunk_id=chunk.id,
                document_name=filename,
                speaker=speaker,
                location=_chunk_location(chunk),
                excerpt=excerpt,
                relevance=score,
            )
        )
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    loaded = db.scalar(_conversation_select().where(Conversation.id == conversation.id))
    if loaded is None:
        raise RuntimeError("Saved Session conversation could not be loaded.")
    conversation_read = _conversation_to_read(loaded)
    return AskSessionResponse(conversation=conversation_read, answer=conversation_read.turns[-1])


def _session_chunks(db: Session, session_id: str) -> list[tuple[Chunk, str]]:
    statement = (
        select(Chunk, Document.filename)
        .join(Document, Document.id == Chunk.document_id)
        .where(Document.session_id == session_id, Document.status == "complete")
        .order_by(Chunk.created_at, Chunk.chunk_index)
        .limit(40)
    )
    return [(chunk, filename) for chunk, filename in db.execute(statement).all()]


def _search_session_chunks(db: Session, session_id: str, query: str, limit: int) -> list[tuple[Chunk, str, float]]:
    distance = Chunk.embedding.cosine_distance(embed_text(query))
    statement = (
        select(Chunk, Document.filename, distance.label("distance"))
        .join(Document, Document.id == Chunk.document_id)
        .where(Document.session_id == session_id, Document.status == "complete")
        .order_by(distance)
        .limit(limit)
    )
    return [(chunk, filename, round(max(0.0, min(1.0, 1.0 - float(raw_distance or 0))), 2)) for chunk, filename, raw_distance in db.execute(statement).all()]


def _theme_to_read(theme: Theme, research_session: ResearchSession) -> SessionThemeRead:
    return SessionThemeRead(
        id=theme.id,
        project_id=theme.project_id,
        session_id=theme.session_id or research_session.id,
        name=theme.title,
        summary=theme.description,
        status=theme.status,
        confidence=round(theme.confidence, 2),
        source_label=f"Generated from {research_session.title} transcript",
        evidence=[_theme_evidence_to_read(evidence) for evidence in theme.evidence],
    )


def _theme_evidence_to_read(evidence: ThemeEvidence) -> SessionEvidenceRead:
    speaker, excerpt = _speaker_and_text(evidence.quote)
    chunk = evidence.chunk
    return SessionEvidenceRead(
        id=evidence.id,
        document_id=evidence.document_id,
        document_name=evidence.document.filename if evidence.document else "Transcript",
        speaker=speaker,
        location=_chunk_location(chunk) if chunk else "Transcript excerpt",
        excerpt=excerpt,
        relevance=round(evidence.relevance_score, 2),
        context_result_id=evidence.chunk_id,
    )


def _report_select():
    return select(SessionReport).options(
        selectinload(SessionReport.items).selectinload(SessionReportItem.evidence).selectinload(SessionReportEvidence.document),
        selectinload(SessionReport.items).selectinload(SessionReportItem.evidence).selectinload(SessionReportEvidence.chunk),
    )


def _report_to_read(report: SessionReport, research_session: ResearchSession) -> SessionReportRead:
    participants = [membership.participant for membership in research_session.participant_memberships]
    return SessionReportRead(
        id=report.id,
        project_id=report.project_id,
        session_id=report.session_id,
        status=report.status,
        session_title=research_session.title,
        session_type=research_session.session_type,
        session_date=research_session.starts_at or research_session.created_at,
        duration_minutes=research_session.duration_minutes,
        participants=[
            SessionReportParticipantRead(
                id=participant.id,
                name=f"{participant.first_name} {participant.last_name}",
                role=participant.role,
                organization=participant.organization,
                notes=participant.researcher_notes,
            )
            for participant in participants
        ],
        executive_summary=report.executive_summary,
        items=[
            SessionReportItemRead(
                id=item.id,
                type=item.item_type,
                title=item.title,
                summary=item.summary,
                provenance=item.provenance,
                evidence=[_report_evidence_to_read(evidence) for evidence in item.evidence],
                ownership=SessionReportOwnershipRead(
                    role=item.ownership_role,
                    value=item.ownership_value,
                    status=item.ownership_status,
                    rationale=item.ownership_rationale,
                )
                if item.ownership_role and item.ownership_status
                else None,
            )
            for item in report.items
        ],
        detailed_notes=_report_detailed_notes(report, research_session),
        generated_at=report.generated_at,
    )


def _report_evidence_to_read(evidence: SessionReportEvidence) -> SessionEvidenceRead:
    return SessionEvidenceRead(
        id=evidence.id,
        document_id=evidence.document_id,
        document_name=evidence.document.filename if evidence.document else "Transcript",
        speaker=evidence.speaker or "Transcript",
        location=evidence.location or "Transcript excerpt",
        excerpt=evidence.excerpt,
        relevance=round(evidence.relevance, 2),
        context_result_id=evidence.chunk_id or evidence.id,
    )


def _conversation_select():
    return (
        select(Conversation)
        .options(selectinload(Conversation.messages).selectinload(ConversationMessage.citations))
        .execution_options(populate_existing=True)
    )


def _conversation_to_read(conversation: Conversation) -> SessionConversationRead:
    return SessionConversationRead(
        id=conversation.id,
        project_id=conversation.project_id,
        session_id=conversation.session_id,
        status=conversation.status,
        turns=[
            SessionConversationTurnRead(
                id=message.id,
                role=message.role,
                content=message.content,
                citations=[
                    SessionCitationRead(
                        id=citation.id,
                        document_id=citation.document_id,
                        document_name=citation.document_name,
                        speaker=citation.speaker or "Transcript",
                        location=citation.location or "Transcript excerpt",
                        excerpt=citation.excerpt,
                        context_result_id=citation.chunk_id or citation.id,
                    )
                    for citation in message.citations
                ],
                created_at=message.created_at,
            )
            for message in conversation.messages
        ],
    )


def _executive_summary(research_session: ResearchSession, themes: list[SessionThemeRead]) -> str:
    names = ", ".join(theme.name for theme in themes[:3])
    return f"{research_session.title} identified recurring patterns in {names}. Review the supporting excerpts before approving this report."


def _generated_detailed_notes(themes: list[SessionThemeRead]) -> str:
    evidence_count = sum(len(theme.evidence) for theme in themes)
    summaries = " ".join(theme.summary.rstrip(". ") + "." for theme in themes[:3])
    return f"Across {evidence_count} supporting transcript excerpts, the Session showed these detailed patterns: {summaries}"


def _report_detailed_notes(report: SessionReport, research_session: ResearchSession) -> str:
    if report.detailed_notes.strip() and report.detailed_notes != LEGACY_DETAILED_NOTES:
        return report.detailed_notes
    themes = sorted(research_session.themes, key=lambda theme: theme.updated_at, reverse=True)
    summaries = " ".join(theme.description.rstrip(". ") + "." for theme in themes[:3])
    evidence_count = sum(theme.evidence_count for theme in themes)
    if summaries:
        return f"Across {evidence_count} supporting transcript excerpts, the Session showed these detailed patterns: {summaries}"
    return "No additional detailed synthesis notes were generated for this Session."


def _report_item_title(item_type: str, theme_name: str) -> str:
    if item_type == "decision":
        decision_title = theme_name.strip()
        return f"{decision_title[:1].upper()}{decision_title[1:]}"

    prefixes = {
        "requirement": "Address",
        "action-item": "Validate",
        "open-question": "Clarify",
        "key-insight": "Key insight:",
    }
    return f"{prefixes[item_type]} {theme_name.lower()}"


def _speaker_and_text(text: str) -> tuple[str, str]:
    first_line, separator, remainder = text.partition("\n")
    if separator and ":" in first_line and len(first_line) <= 120:
        speaker, _, opening = first_line.partition(":")
        combined = " ".join(value for value in (opening.strip(), remainder.strip()) if value)
        return speaker.strip(), combined
    return "Transcript", text.strip()


def _chunk_location(chunk: Chunk) -> str:
    metadata = chunk.extra_metadata or {}
    return str(metadata.get("timestamp") or f"Excerpt {chunk.chunk_index + 1}")
