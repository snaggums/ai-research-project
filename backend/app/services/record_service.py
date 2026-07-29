from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from uuid import uuid4

from app.models.chunk import Chunk
from app.models.document import Document
from app.models.project import Project
from app.models.record import (
    ProductRecord,
    RecordKnowledgeItem,
    RecordKnowledgePromotion,
    RecordSynthesisEvidence,
    RecordSynthesisItem,
    RecordSynthesisItemSource,
    RecordSynthesisRun,
    RecordSynthesisSource,
    SessionRecord,
)
from app.models.research_session import ResearchSession
from app.models.session_report import SessionReport, SessionReportEvidence, SessionReportItem
from app.schemas.record import (
    GeneratedRecordSynthesisPayload,
    RecordCatalogRead,
    RecordChatCitationRead,
    RecordChatResponse,
    RecordChatSourceAvailabilityRead,
    RecordSynthesisEligibilityRead,
    RecordSynthesisEvidenceRead,
    RecordSynthesisExcludedSessionRead,
    RecordSynthesisItemRead,
    RecordSynthesisRead,
    RecordSynthesisSourceSessionRead,
    RecordKnowledgeRead,
)
from app.schemas.chat import ChatCitation
from app.schemas.research_session import SessionRead
from app.services import ai_settings_service, chat_service, record_knowledge_service, research_session_service, theme_service, transcript_service
from app.services.ai_completion_options import completion_model_options
from app.services.embedding_service import embed_text
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload


MINIMUM_ELIGIBLE_SESSIONS = 2
ELIGIBLE_REPORT_STATUSES = {"researcher-reviewed", "approved"}
ELIGIBLE_ITEM_TYPES = {"requirement", "decision", "action-item"}
RECORD_SYNTHESIS_PROMPT_VERSION = "record-synthesis-v1"
RECORD_CHAT_SUPPORTING_SCORE = 0.25


@dataclass(frozen=True)
class GeneratedRecordItem:
    item_type: str
    title: str
    summary: str
    source_report_item_ids: tuple[str, ...]


@dataclass(frozen=True)
class RecordRetrievedChunk:
    chunk: Chunk
    document: Document
    project: Project
    research_session: ResearchSession
    score: float


def list_records(db: Session) -> list[RecordCatalogRead]:
    return [_record_to_read(db, record) for record in db.scalars(select(ProductRecord).order_by(ProductRecord.position)).all()]


def get_record(db: Session, record_id: str) -> ProductRecord | None:
    return db.get(ProductRecord, record_id)


def get_record_read(db: Session, record_id: str) -> RecordCatalogRead | None:
    record = get_record(db, record_id)
    return _record_to_read(db, record) if record else None


def list_record_sessions(db: Session, record_id: str) -> list[SessionRead]:
    sessions = db.scalars(
        research_session_service.loaded_select()
        .join(SessionRecord, SessionRecord.session_id == ResearchSession.id)
        .where(SessionRecord.record_id == record_id)
        .order_by(ResearchSession.updated_at.desc())
    ).unique().all()
    return [research_session_service.session_to_read(db, session) for session in sessions]


def get_chat_source_availability(db: Session, record_id: str) -> RecordChatSourceAvailabilityRead:
    primary_transcript_count = db.scalar(
        select(func.count(func.distinct(Document.id)))
        .select_from(Document)
        .join(ResearchSession, ResearchSession.id == Document.session_id)
        .join(SessionRecord, SessionRecord.session_id == ResearchSession.id)
        .join(Chunk, Chunk.document_id == Document.id)
        .where(
            SessionRecord.record_id == record_id,
            Document.status == "complete",
            Document.document_type == "transcript",
        )
    ) or 0
    reviewed_report_count = db.scalar(
        select(func.count(func.distinct(RecordKnowledgePromotion.report_id))).where(
            RecordKnowledgePromotion.record_id == record_id
        )
    ) or 0
    record_knowledge_available = db.scalar(
        select(RecordKnowledgeItem.id)
        .where(
            RecordKnowledgeItem.record_id == record_id,
            RecordKnowledgeItem.status == "current",
        )
        .limit(1)
    ) is not None
    return RecordChatSourceAvailabilityRead(
        record_id=record_id,
        primary_transcript_count=primary_transcript_count,
        reviewed_report_count=reviewed_report_count,
        record_knowledge_available=record_knowledge_available,
        searchable=primary_transcript_count > 0,
    )


def answer_record_question(
    db: Session,
    record_id: str,
    question: str,
    limit: int = 6,
) -> RecordChatResponse:
    clean_question = question.strip()
    if not clean_question:
        raise ValueError("Question is required.")
    record = get_record(db, record_id)
    if record is None:
        raise ValueError("Record not found.")

    retrieved = _search_record_chunks(db, record_id, clean_question, limit)
    if not retrieved:
        raise ValueError(
            "This Record has no processed primary transcript evidence available to search."
        )

    knowledge = record_knowledge_service.list_knowledge(db, record_id)
    knowledge_available = bool(knowledge.items)
    traceability_note = (
        "Trace: Record Knowledge → approved Session Report items → cited primary transcript passages."
        if knowledge_available
        else (
            "Trace: approved Session Reports → cited primary transcript passages. "
            "This answer is not supported by promoted Record Knowledge."
        )
    )
    supporting = [
        item for item in retrieved if item.score >= RECORD_CHAT_SUPPORTING_SCORE
    ]
    settings = ai_settings_service.get_or_create_settings(db)
    used_mock = settings.provider.strip().lower() == "mock" or not settings.has_api_key

    if not supporting:
        return RecordChatResponse(
            question=clean_question,
            status="insufficient-evidence",
            answer=None,
            citations=_record_chat_citations(retrieved[:3], relevance="partial"),
            traceability_note=traceability_note,
            record_knowledge_used=knowledge_available,
            provider=settings.provider,
            model=settings.model,
            used_mock=used_mock,
        )

    evidence = supporting[: min(3, limit)]
    chat_citations = [
        ChatCitation(
            chunk_id=item.chunk.id,
            document_id=item.document.id,
            document_name=item.document.filename,
            session_id=item.research_session.id,
            session_title=item.research_session.title,
            speaker=str(
                (item.chunk.extra_metadata or {}).get("speaker")
                or _speaker_and_excerpt(item.chunk.text)[0]
            ),
            location=_chunk_location(item.chunk),
            context_result_id=item.chunk.id,
            chunk_index=item.chunk.chunk_index,
            text=item.chunk.text,
            score=item.score,
        )
        for item in evidence
    ]
    answer = (
        _mock_record_answer(clean_question, chat_citations)
        if used_mock
        else chat_service._answer_with_litellm(
            provider=settings.provider,
            model=settings.model,
            base_url=settings.base_url,
            question=clean_question,
            citations=chat_citations,
            supplemental_context=_record_interpretation_context(
                db,
                record_id,
                knowledge,
            ),
        )
    )
    return RecordChatResponse(
        question=clean_question,
        status="answered",
        answer=answer,
        citations=_record_chat_citations(evidence, relevance="supporting"),
        traceability_note=traceability_note,
        record_knowledge_used=knowledge_available,
        provider=settings.provider,
        model=settings.model,
        used_mock=used_mock,
    )


def assign_session_record(db: Session, research_session: ResearchSession, record_id: str | None) -> SessionRead:
    research_session_service.replace_record_assignment(db, research_session, [record_id] if record_id else [], [])
    db.add(research_session)
    db.commit()
    loaded = research_session_service.get_session(db, research_session.project_id, research_session.id) or research_session
    return research_session_service.session_to_read(db, loaded)


def generate_synthesis(db: Session, record_id: str, client_request_key: str | None) -> RecordSynthesisRead:
    record = get_record(db, record_id)
    if record is None:
        raise LookupError("Record not found")

    request_key = client_request_key or str(uuid4())
    existing = db.scalar(
        _run_select().where(
            RecordSynthesisRun.record_id == record_id,
            RecordSynthesisRun.client_request_key == request_key,
        )
    )
    if existing is not None:
        return run_to_read(existing)

    source_pairs = _eligible_source_reports(db, record_id)
    if len(source_pairs) < MINIMUM_ELIGIBLE_SESSIONS:
        raise ValueError(
            f"At least {MINIMUM_ELIGIBLE_SESSIONS} eligible Session Reports are required. "
            f"This Record currently has {len(source_pairs)}."
        )

    settings = ai_settings_service.get_or_create_settings(db)
    used_mock = theme_service._should_use_mock(settings)
    run = RecordSynthesisRun(
        record_id=record_id,
        status="processing",
        client_request_key=request_key,
        source_session_count=len(source_pairs),
        source_report_revision_count=len(source_pairs),
        provider="mock" if used_mock else settings.provider,
        model=settings.model,
        prompt_version=RECORD_SYNTHESIS_PROMPT_VERSION,
    )
    run.sources = [
        RecordSynthesisSource(
            session_id=research_session.id,
            report_id=report.id,
            report_updated_at=report.updated_at,
        )
        for research_session, report in source_pairs
    ]
    db.add(run)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        replay = db.scalar(
            _run_select().where(
                RecordSynthesisRun.record_id == record_id,
                RecordSynthesisRun.client_request_key == request_key,
            )
        )
        if replay is None:
            raise
        return run_to_read(replay)

    try:
        generated = (
            _generate_mock_items(source_pairs)
            if used_mock
            else _generate_with_litellm(settings, record.name, source_pairs)
        )
        persisted_run = db.get(RecordSynthesisRun, run.id)
        if persisted_run is None:
            raise RuntimeError("Record synthesis run could not be reloaded.")
        _persist_generated_items(db, persisted_run, source_pairs, generated)
        persisted_run.status = "complete"
        persisted_run.completed_at = datetime.now(timezone.utc)
        persisted_run.error_message = None
        db.add(persisted_run)
        db.commit()
    except Exception as exc:
        db.rollback()
        failed_run = db.get(RecordSynthesisRun, run.id)
        if failed_run is None:
            raise
        failed_run.status = "failed"
        failed_run.error_message = _generation_error(exc)
        failed_run.completed_at = datetime.now(timezone.utc)
        db.add(failed_run)
        db.commit()

    loaded = db.scalar(_run_select().where(RecordSynthesisRun.id == run.id))
    if loaded is None:
        raise RuntimeError("Record synthesis result could not be loaded.")
    return run_to_read(loaded)


def get_eligibility(db: Session, record_id: str) -> RecordSynthesisEligibilityRead:
    record = get_record(db, record_id)
    if record is None:
        raise LookupError("Record not found")
    sessions = _record_sessions_with_reports(db, record_id)
    included: list[RecordSynthesisSourceSessionRead] = []
    excluded: list[RecordSynthesisExcludedSessionRead] = []
    for research_session in sessions:
        latest = max(research_session.reports, key=lambda report: (report.updated_at, report.created_at), default=None)
        reason = _ineligibility_reason(latest)
        if reason:
            excluded.append(RecordSynthesisExcludedSessionRead(id=research_session.id, title=research_session.title, reason=reason))
        else:
            included.append(RecordSynthesisSourceSessionRead(
                id=research_session.id,
                title=research_session.title,
                report_id=latest.id,
                report_status=latest.status,
            ))
    return RecordSynthesisEligibilityRead(
        record_id=record_id,
        description=f"All eligible Sessions related to {record.name} are included automatically.",
        minimum_eligible_sessions=MINIMUM_ELIGIBLE_SESSIONS,
        included_sessions=included,
        excluded_sessions=excluded,
    )


def get_latest_synthesis(db: Session, record_id: str) -> RecordSynthesisRead | None:
    run = db.scalar(_run_select().where(RecordSynthesisRun.record_id == record_id).order_by(RecordSynthesisRun.created_at.desc()))
    return run_to_read(run) if run else None


def update_synthesis_item(db: Session, record_id: str, item_id: str, item_status: str) -> RecordSynthesisItemRead | None:
    item = db.scalar(
        select(RecordSynthesisItem)
        .options(selectinload(RecordSynthesisItem.evidence))
        .join(RecordSynthesisRun, RecordSynthesisRun.id == RecordSynthesisItem.run_id)
        .where(RecordSynthesisRun.record_id == record_id, RecordSynthesisItem.id == item_id)
    )
    if item is None:
        return None
    item.status = item_status
    item.researcher_updated_at = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_read(item)


def get_synthesis_evidence(db: Session, record_id: str, item_id: str, evidence_id: str) -> RecordSynthesisEvidenceRead | None:
    evidence = db.scalar(
        select(RecordSynthesisEvidence)
        .options(
            selectinload(RecordSynthesisEvidence.item),
            selectinload(RecordSynthesisEvidence.document),
        )
        .join(RecordSynthesisItem, RecordSynthesisItem.id == RecordSynthesisEvidence.item_id)
        .join(RecordSynthesisRun, RecordSynthesisRun.id == RecordSynthesisItem.run_id)
        .where(
            RecordSynthesisRun.record_id == record_id,
            RecordSynthesisItem.id == item_id,
            RecordSynthesisEvidence.id == evidence_id,
        )
    )
    if evidence is None or evidence.chunk_id is None:
        return None
    document = evidence.document
    if document.project_id != evidence.project_id or document.session_id != evidence.session_id:
        return None
    research_session = db.scalar(
        select(ResearchSession).where(
            ResearchSession.id == evidence.session_id,
            ResearchSession.project_id == evidence.project_id,
        )
    )
    if research_session is None:
        return None
    owns_record = db.scalar(
        select(SessionRecord).where(
            SessionRecord.session_id == evidence.session_id,
            SessionRecord.record_id == record_id,
        )
    )
    if owns_record is None:
        return None
    context = transcript_service.get_context(db, document, research_session, evidence.chunk_id)
    if context is None:
        return None
    return RecordSynthesisEvidenceRead(
        id=evidence.id,
        record_id=record_id,
        item_id=evidence.item_id,
        item_title=evidence.item.title,
        project_id=evidence.project_id,
        session_id=evidence.session_id,
        session_title=research_session.title,
        context=context,
    )


def run_to_read(run: RecordSynthesisRun) -> RecordSynthesisRead:
    status = "processing" if run.status in {"queued", "processing"} else run.status
    return RecordSynthesisRead(
        id=run.id,
        record_id=run.record_id,
        status=status,
        generated_at=run.completed_at,
        source_session_count=run.source_session_count,
        source_report_revision_count=run.source_report_revision_count,
        provider=run.provider,
        model=run.model,
        prompt_version=run.prompt_version,
        items=[item_to_read(item) for item in run.items],
        error_message=run.error_message,
    )


def item_to_read(item: RecordSynthesisItem) -> RecordSynthesisItemRead:
    return RecordSynthesisItemRead(
        id=item.id,
        type=item.item_type,
        status=item.status,
        title=item.title,
        summary=item.summary,
        evidence_preview=item.evidence_preview,
        source_session_count=item.source_session_count,
        source_report_item_count=item.source_report_item_count,
        provenance=item.provenance,
        evidence_ids=[evidence.id for evidence in item.evidence],
    )


def _record_to_read(db: Session, record: ProductRecord) -> RecordCatalogRead:
    related_count = db.query(SessionRecord).filter(SessionRecord.record_id == record.id).count()
    latest = db.scalar(select(RecordSynthesisRun).where(RecordSynthesisRun.record_id == record.id).order_by(RecordSynthesisRun.created_at.desc()))
    latest_at = latest.completed_at if latest and latest.status == "complete" else None
    approved_report_count = db.scalar(
        select(func.count(func.distinct(RecordKnowledgePromotion.report_id))).where(
            RecordKnowledgePromotion.record_id == record.id
        )
    ) or 0
    knowledge_item_count = db.scalar(
        select(func.count(RecordKnowledgeItem.id)).where(
            RecordKnowledgeItem.record_id == record.id,
            RecordKnowledgeItem.status == "current",
        )
    ) or 0
    knowledge_updated_at = db.scalar(
        select(func.max(RecordKnowledgePromotion.promoted_at)).where(
            RecordKnowledgePromotion.record_id == record.id
        )
    )
    readiness = "up-to-date" if approved_report_count else "needs-data"
    return RecordCatalogRead(
        id=record.id,
        name=record.name,
        description=record.description,
        related_session_count=related_count,
        eligible_session_count=approved_report_count,
        readiness=readiness,
        latest_synthesis_at=latest_at,
        approved_report_count=approved_report_count,
        knowledge_item_count=knowledge_item_count,
        knowledge_updated_at=knowledge_updated_at,
    )


def _ineligibility_reason(report: SessionReport | None) -> str | None:
    if report is None:
        return "Session Report has not been generated"
    if report.status not in ELIGIBLE_REPORT_STATUSES:
        return f"Session Report is {report.status.replace('-', ' ').title()}"
    eligible_items = [
        item
        for item in report.items
        if item.item_type in ELIGIBLE_ITEM_TYPES and any(evidence.chunk_id for evidence in item.evidence)
    ]
    if not eligible_items:
        return "Session Report has no evidence-linked Requirements, Decisions, or Action Items"
    return None


def _search_record_chunks(
    db: Session,
    record_id: str,
    query: str,
    limit: int,
) -> list[RecordRetrievedChunk]:
    distance = Chunk.embedding.cosine_distance(embed_text(query))
    rows = db.execute(
        select(
            Chunk,
            Document,
            Project,
            ResearchSession,
            distance.label("distance"),
        )
        .join(Document, Document.id == Chunk.document_id)
        .join(ResearchSession, ResearchSession.id == Document.session_id)
        .join(SessionRecord, SessionRecord.session_id == ResearchSession.id)
        .join(Project, Project.id == Document.project_id)
        .where(
            SessionRecord.record_id == record_id,
            Document.status == "complete",
            Document.document_type == "transcript",
        )
        .order_by(distance)
        .limit(limit)
    ).all()
    return [
        RecordRetrievedChunk(
            chunk=chunk,
            document=document,
            project=project,
            research_session=research_session,
            score=round(
                max(0.0, min(1.0, 1.0 - float(raw_distance or 0))),
                2,
            ),
        )
        for chunk, document, project, research_session, raw_distance in rows
    ]


def _record_chat_citations(
    retrieved: list[RecordRetrievedChunk],
    relevance: str,
) -> list[RecordChatCitationRead]:
    citations: list[RecordChatCitationRead] = []
    for reference, item in enumerate(retrieved, start=1):
        speaker, excerpt = _speaker_and_excerpt(item.chunk.text)
        citations.append(
            RecordChatCitationRead(
                id=item.chunk.id,
                reference=reference,
                project_id=item.project.id,
                project_name=item.project.name,
                session_id=item.research_session.id,
                session_title=item.research_session.title,
                document_id=item.document.id,
                document_name=item.document.filename,
                speaker=speaker,
                location=_chunk_location(item.chunk),
                excerpt=excerpt,
                context_result_id=item.chunk.id,
                relevance=relevance,
                score=item.score,
            )
        )
    return citations


def _record_interpretation_context(
    db: Session,
    record_id: str,
    knowledge: RecordKnowledgeRead,
) -> str:
    sections: list[str] = []
    if knowledge.items:
        items = "\n".join(
            f"- {item.type}: {item.title}. {item.summary}"
            for item in knowledge.items[:12]
        )
        if items:
            sections.append(f"Latest Record Knowledge:\n{items}")

    reports: list[str] = []
    for research_session, report in _approved_source_reports(db, record_id):
        report_items = " ".join(
            f"{item.title}: {item.summary}"
            for item in report.items
            if item.item_type in ELIGIBLE_ITEM_TYPES
        )
        reports.append(
            f"- {research_session.title} ({report.status}): "
            f"{report.executive_summary} {report_items}".strip()
        )
    if reports:
        sections.append(
            "Approved Session Reports:\n" + "\n".join(reports[:12])
        )
    return "\n\n".join(sections)


def _mock_record_answer(question: str, citations: list[ChatCitation]) -> str:
    summary = " ".join(
        chat_service._short_sentence(citation.text)
        for citation in citations
    )
    references = " ".join(
        f"[{index}]" for index in range(1, len(citations) + 1)
    )
    return (
        f"Across this Record, the available transcript evidence for '{question}' "
        f"shows: {summary} {references}"
    )


def _speaker_and_excerpt(text: str) -> tuple[str, str]:
    first_line, separator, remainder = text.partition("\n")
    if separator and ":" in first_line and len(first_line) <= 120:
        speaker, _, opening = first_line.partition(":")
        excerpt = " ".join(
            value for value in (opening.strip(), remainder.strip()) if value
        )
        return speaker.strip(), excerpt
    return "Transcript", text.strip()


def _chunk_location(chunk: Chunk) -> str:
    metadata = chunk.extra_metadata or {}
    return str(metadata.get("timestamp") or f"Excerpt {chunk.chunk_index + 1}")


def _run_select():
    return select(RecordSynthesisRun).options(
        selectinload(RecordSynthesisRun.items).selectinload(RecordSynthesisItem.evidence)
    )


def _record_sessions_with_reports(db: Session, record_id: str) -> list[ResearchSession]:
    return db.scalars(
        select(ResearchSession)
        .options(
            selectinload(ResearchSession.reports)
            .selectinload(SessionReport.items)
            .selectinload(SessionReportItem.evidence)
        )
        .join(SessionRecord, SessionRecord.session_id == ResearchSession.id)
        .where(SessionRecord.record_id == record_id)
        .order_by(ResearchSession.updated_at.desc())
    ).unique().all()


def _eligible_source_reports(db: Session, record_id: str) -> list[tuple[ResearchSession, SessionReport]]:
    sources: list[tuple[ResearchSession, SessionReport]] = []
    for research_session in _record_sessions_with_reports(db, record_id):
        latest = max(research_session.reports, key=lambda report: (report.updated_at, report.created_at), default=None)
        if latest is not None and _ineligibility_reason(latest) is None:
            sources.append((research_session, latest))
    return sources


def _approved_source_reports(db: Session, record_id: str) -> list[tuple[ResearchSession, SessionReport]]:
    sources: list[tuple[ResearchSession, SessionReport]] = []
    for research_session in _record_sessions_with_reports(db, record_id):
        approved = [
            report for report in research_session.reports if report.status == "approved"
        ]
        latest = max(
            approved,
            key=lambda report: (report.updated_at, report.created_at),
            default=None,
        )
        if latest is not None:
            sources.append((research_session, latest))
    return sources


def _generate_mock_items(source_pairs: list[tuple[ResearchSession, SessionReport]]) -> list[GeneratedRecordItem]:
    buckets: dict[tuple[str, str], list[SessionReportItem]] = {}
    for _research_session, report in source_pairs:
        for item in report.items:
            if item.item_type not in ELIGIBLE_ITEM_TYPES or not any(evidence.chunk_id for evidence in item.evidence):
                continue
            key = (item.item_type, " ".join(item.title.lower().split()))
            buckets.setdefault(key, []).append(item)

    generated: list[GeneratedRecordItem] = []
    for (_item_type, _normalized_title), source_items in buckets.items():
        summaries = list(dict.fromkeys(item.summary.strip() for item in source_items if item.summary.strip()))
        summary = summaries[0]
        if len(summaries) > 1:
            summary = f"{summary.rstrip('.')} Across related Sessions, researchers also found: {summaries[1]}"
        generated.append(
            GeneratedRecordItem(
                item_type=source_items[0].item_type,
                title=source_items[0].title,
                summary=summary,
                source_report_item_ids=tuple(item.id for item in source_items),
            )
        )
    if not generated:
        raise ValueError("Eligible Session Reports did not contain transcript-linked synthesis items.")
    return generated


def _generate_with_litellm(settings, record_name: str, source_pairs: list[tuple[ResearchSession, SessionReport]]) -> list[GeneratedRecordItem]:
    try:
        from litellm import completion
    except ImportError as exc:
        raise ValueError("Install backend requirements before using live Record synthesis.") from exc

    source_items = [
        {
            "report_item_id": item.id,
            "session_id": research_session.id,
            "session_title": research_session.title,
            "type": item.item_type,
            "title": item.title,
            "summary": item.summary,
            "evidence": [
                {
                    "chunk_id": evidence.chunk_id,
                    "speaker": evidence.speaker,
                    "location": evidence.location,
                    "excerpt": evidence.excerpt[:1000],
                }
                for evidence in item.evidence
                if evidence.chunk_id
            ],
        }
        for research_session, report in source_pairs
        for item in report.items
        if item.item_type in ELIGIBLE_ITEM_TYPES and any(evidence.chunk_id for evidence in item.evidence)
    ]
    messages = [
        {
            "role": "system",
            "content": (
                "You synthesize reviewed UX research reports. Consolidate only supported Requirements, Decisions, "
                "and Action Items. Do not invent facts or source IDs. Each output must cite one or more supplied "
                "report_item_id values, and cited source item types must match the output type."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Synthesize {record_name} as JSON with this shape: "
                '{"items":[{"type":"requirement|decision|action-item","title":"...","summary":"...",'
                '"source_report_item_ids":["..."]}]}. Merge duplicates across Sessions while retaining distinct '
                f"findings. Source Session Report items: {json.dumps(source_items)}"
            ),
        },
    ]
    try:
        response = completion(
            model=settings.model,
            messages=messages,
            response_format={"type": "json_object"},
            api_key=theme_service._api_key_for_provider(settings.provider),
            api_base=settings.base_url,
            **completion_model_options(settings.provider, settings.model),
        )
    except Exception as exc:
        raise ValueError(
            f"Live Record synthesis failed for provider '{settings.provider}' and model '{settings.model}'. "
            f"Provider error: {theme_service._clean_provider_error(exc)}"
        ) from exc

    raw = response.choices[0].message.content
    try:
        payload = GeneratedRecordSynthesisPayload.model_validate_json(raw)
    except (ValidationError, ValueError) as exc:
        raise ValueError("The AI provider did not return valid Record synthesis JSON.") from exc
    return [
        GeneratedRecordItem(
            item_type=item.type,
            title=item.title.strip(),
            summary=item.summary.strip(),
            source_report_item_ids=tuple(dict.fromkeys(item.source_report_item_ids)),
        )
        for item in payload.items
    ]


def _persist_generated_items(
    db: Session,
    run: RecordSynthesisRun,
    source_pairs: list[tuple[ResearchSession, SessionReport]],
    generated: list[GeneratedRecordItem],
) -> None:
    item_map = {
        item.id: (item, research_session, report)
        for research_session, report in source_pairs
        for item in report.items
        if item.item_type in ELIGIBLE_ITEM_TYPES
    }
    persisted_count = 0
    for position, generated_item in enumerate(generated):
        selected = [
            item_map[item_id]
            for item_id in generated_item.source_report_item_ids
            if item_id in item_map and item_map[item_id][0].item_type == generated_item.item_type
        ]
        if not selected:
            continue
        selected = list({item.id: (item, research_session, report) for item, research_session, report in selected}.values())
        usable_evidence = [
            (evidence, research_session, report, source_item)
            for source_item, research_session, report in selected
            for evidence in source_item.evidence
            if evidence.chunk_id
        ]
        if not usable_evidence:
            continue
        synthesis_item = RecordSynthesisItem(
            item_type=generated_item.item_type,
            title=generated_item.title,
            summary=generated_item.summary,
            evidence_preview=usable_evidence[0][0].excerpt,
            source_session_count=len({research_session.id for _item, research_session, _report in selected}),
            source_report_item_count=len(selected),
            provenance=(
                f"{run.provider or 'unknown'} / {run.model or 'unknown'} / "
                f"{run.prompt_version or RECORD_SYNTHESIS_PROMPT_VERSION}"
            ),
            position=position,
        )
        synthesis_item.source_items = [
            RecordSynthesisItemSource(report_item_id=source_item.id)
            for source_item, _research_session, _report in selected
        ]
        seen_evidence: set[tuple[str, str]] = set()
        for evidence, research_session, report, source_item in usable_evidence:
            key = (evidence.document_id, evidence.chunk_id or evidence.id)
            if key in seen_evidence:
                continue
            seen_evidence.add(key)
            synthesis_item.evidence.append(
                _copy_evidence(evidence, source_item, research_session, report)
            )
        run.items.append(synthesis_item)
        persisted_count += 1
    if not persisted_count:
        raise ValueError("Record synthesis did not retain any valid evidence-linked items.")
    db.add(run)
    db.flush()


def _copy_evidence(
    evidence: SessionReportEvidence,
    source_item: SessionReportItem,
    research_session: ResearchSession,
    report: SessionReport,
) -> RecordSynthesisEvidence:
    return RecordSynthesisEvidence(
        source_report_item_id=source_item.id,
        project_id=report.project_id,
        session_id=research_session.id,
        document_id=evidence.document_id,
        chunk_id=evidence.chunk_id,
        excerpt=evidence.excerpt,
        speaker=evidence.speaker,
        location=evidence.location,
        relevance=evidence.relevance,
    )


def _generation_error(exc: Exception) -> str:
    message = " ".join(str(exc).split())
    return message[:1000] if message else "AIR could not complete this Record synthesis."
