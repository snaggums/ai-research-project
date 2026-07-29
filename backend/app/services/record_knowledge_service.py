from __future__ import annotations

from datetime import datetime, timezone

from app.models.document import Document
from app.models.record import (
    RecordKnowledgeEvidence,
    RecordKnowledgeItem,
    RecordKnowledgePromotion,
    SessionRecord,
)
from app.models.research_session import ResearchSession
from app.models.session_report import SessionReport, SessionReportItem
from app.schemas.record import (
    RecordKnowledgeEvidenceRead,
    RecordKnowledgeItemRead,
    RecordKnowledgeOwnershipRead,
    RecordKnowledgeRead,
    RecordKnowledgeSourceRead,
    RecordKnowledgeSourcesRead,
)
from app.services import transcript_service
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload


PROMOTED_ITEM_TYPES = {"requirement", "decision", "action-item"}


def promote_approved_report(
    db: Session,
    research_session: ResearchSession,
    report: SessionReport,
) -> RecordKnowledgePromotion | None:
    """Copy an approved report into Record Knowledge without committing."""

    if report.approved_at is None:
        raise ValueError("Only an approved Session Report can be promoted to Record Knowledge.")

    assignment = db.scalar(
        select(SessionRecord).where(SessionRecord.session_id == research_session.id)
    )
    if assignment is None:
        return None

    existing = db.scalar(
        _promotion_select().where(
            RecordKnowledgePromotion.record_id == assignment.record_id,
            RecordKnowledgePromotion.report_id == report.id,
        )
    )
    if existing is not None:
        return existing

    promoted_at = report.approved_at
    current_items = db.scalars(
        select(RecordKnowledgeItem).where(
            RecordKnowledgeItem.record_id == assignment.record_id,
            RecordKnowledgeItem.source_session_id == research_session.id,
            RecordKnowledgeItem.status == "current",
        )
    ).all()
    for current in current_items:
        current.status = "superseded"
        current.superseded_at = promoted_at
        current.updated_at = promoted_at
        db.add(current)

    promotion = RecordKnowledgePromotion(
        record_id=assignment.record_id,
        project_id=research_session.project_id,
        session_id=research_session.id,
        report_id=report.id,
        promoted_at=promoted_at,
    )
    db.add(promotion)
    db.flush()

    documents = {
        document.id: document
        for document in db.scalars(
            select(Document).where(Document.session_id == research_session.id)
        ).all()
    }
    eligible_items = [
        item for item in report.items if item.item_type in PROMOTED_ITEM_TYPES
    ]
    for report_item in eligible_items:
        knowledge_item = RecordKnowledgeItem(
            promotion_id=promotion.id,
            record_id=assignment.record_id,
            source_project_id=research_session.project_id,
            source_session_id=research_session.id,
            source_report_id=report.id,
            source_report_item_id=report_item.id,
            item_type=report_item.item_type,
            status="current",
            title=report_item.title,
            summary=report_item.summary,
            provenance=report_item.provenance,
            ownership_role=report_item.ownership_role,
            ownership_value=report_item.ownership_value,
            ownership_status=report_item.ownership_status,
            ownership_rationale=report_item.ownership_rationale,
            source_session_title=research_session.title,
            source_report_updated_at=report.updated_at,
            position=report_item.position,
            promoted_at=promoted_at,
        )
        for evidence in report_item.evidence:
            document = documents.get(evidence.document_id)
            if document is None:
                raise ValueError(
                    "Session Report evidence no longer belongs to an available Session document."
                )
            knowledge_item.evidence.append(
                RecordKnowledgeEvidence(
                    source_report_evidence_id=evidence.id,
                    document_id=evidence.document_id,
                    chunk_id=evidence.chunk_id,
                    document_name=document.filename,
                    excerpt=evidence.excerpt,
                    speaker=evidence.speaker,
                    location=evidence.location,
                    relevance=evidence.relevance,
                )
            )
        promotion.items.append(knowledge_item)

    promotion.item_count = len(eligible_items)
    db.add(promotion)
    db.flush()
    return promotion


def list_knowledge(
    db: Session,
    record_id: str,
    *,
    item_type: str | None = None,
    query: str | None = None,
    include_superseded: bool = False,
) -> RecordKnowledgeRead:
    statement = (
        select(RecordKnowledgeItem)
        .options(selectinload(RecordKnowledgeItem.evidence))
        .where(RecordKnowledgeItem.record_id == record_id)
    )
    if not include_superseded:
        statement = statement.where(RecordKnowledgeItem.status == "current")
    if item_type:
        statement = statement.where(RecordKnowledgeItem.item_type == item_type)
    clean_query = (query or "").strip()
    if clean_query:
        pattern = f"%{clean_query}%"
        statement = statement.where(
            or_(
                RecordKnowledgeItem.title.ilike(pattern),
                RecordKnowledgeItem.summary.ilike(pattern),
            )
        )
    items = db.scalars(
        statement.order_by(
            RecordKnowledgeItem.item_type,
            RecordKnowledgeItem.source_session_title,
            RecordKnowledgeItem.position,
            RecordKnowledgeItem.promoted_at,
        )
    ).unique().all()
    knowledge_updated_at = db.scalar(
        select(func.max(RecordKnowledgePromotion.promoted_at)).where(
            RecordKnowledgePromotion.record_id == record_id
        )
    )
    return RecordKnowledgeRead(
        record_id=record_id,
        items=[item_to_read(item) for item in items],
        total_count=len(items),
        knowledge_updated_at=knowledge_updated_at,
    )


def list_sources(db: Session, record_id: str) -> RecordKnowledgeSourcesRead:
    sessions = db.scalars(
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
    promotions = db.scalars(
        _promotion_select()
        .where(RecordKnowledgePromotion.record_id == record_id)
        .order_by(RecordKnowledgePromotion.promoted_at.desc())
    ).unique().all()
    latest_by_session: dict[str, RecordKnowledgePromotion] = {}
    for promotion in promotions:
        latest_by_session.setdefault(promotion.session_id, promotion)

    sources: list[RecordKnowledgeSourceRead] = []
    for research_session in sessions:
        promotion = latest_by_session.get(research_session.id)
        if promotion is not None:
            sources.append(
                RecordKnowledgeSourceRead(
                    session_id=research_session.id,
                    session_title=research_session.title,
                    report_id=promotion.report_id,
                    report_status="approved",
                    promoted_item_count=promotion.item_count,
                    included=True,
                    reason=None,
                )
            )
            continue
        latest_report = max(
            research_session.reports,
            key=lambda candidate: (candidate.updated_at, candidate.created_at),
            default=None,
        )
        sources.append(
            RecordKnowledgeSourceRead(
                session_id=research_session.id,
                session_title=research_session.title,
                report_id=latest_report.id if latest_report else None,
                report_status=latest_report.status if latest_report else None,
                promoted_item_count=0,
                included=False,
                reason=_source_exclusion_reason(latest_report),
            )
        )
    return RecordKnowledgeSourcesRead(
        record_id=record_id,
        description=(
            "Approved Session Report Requirements, Decisions, and Action Items "
            "are collected exactly as written."
        ),
        sources=sources,
    )


def get_evidence(
    db: Session,
    record_id: str,
    item_id: str,
    evidence_id: str,
) -> RecordKnowledgeEvidenceRead | None:
    evidence = db.scalar(
        select(RecordKnowledgeEvidence)
        .options(
            selectinload(RecordKnowledgeEvidence.item),
            selectinload(RecordKnowledgeEvidence.document),
        )
        .join(
            RecordKnowledgeItem,
            RecordKnowledgeItem.id == RecordKnowledgeEvidence.item_id,
        )
        .where(
            RecordKnowledgeItem.record_id == record_id,
            RecordKnowledgeItem.id == item_id,
            RecordKnowledgeEvidence.id == evidence_id,
        )
    )
    if evidence is None or evidence.chunk_id is None:
        return None
    item = evidence.item
    document = evidence.document
    research_session = db.scalar(
        select(ResearchSession).where(
            ResearchSession.id == item.source_session_id,
            ResearchSession.project_id == item.source_project_id,
        )
    )
    if research_session is None:
        return None
    context = transcript_service.get_context(
        db, document, research_session, evidence.chunk_id
    )
    if context is None:
        return None
    return RecordKnowledgeEvidenceRead(
        id=evidence.id,
        record_id=record_id,
        item_id=item.id,
        item_title=item.title,
        project_id=item.source_project_id,
        session_id=item.source_session_id,
        session_title=item.source_session_title,
        context=context,
    )


def has_promoted_knowledge_for_session(db: Session, session_id: str) -> bool:
    return (
        db.scalar(
            select(RecordKnowledgePromotion.id)
            .where(RecordKnowledgePromotion.session_id == session_id)
            .limit(1)
        )
        is not None
    )


def item_to_read(item: RecordKnowledgeItem) -> RecordKnowledgeItemRead:
    ownership = None
    if item.ownership_role and item.ownership_status:
        ownership = RecordKnowledgeOwnershipRead(
            role=item.ownership_role,
            value=item.ownership_value,
            status=item.ownership_status,
            rationale=item.ownership_rationale,
        )
    evidence = list(item.evidence)
    return RecordKnowledgeItemRead(
        id=item.id,
        type=item.item_type,
        status=item.status,
        title=item.title,
        summary=item.summary,
        provenance=item.provenance,
        ownership=ownership,
        source_project_id=item.source_project_id,
        source_session_id=item.source_session_id,
        source_session_title=item.source_session_title,
        source_report_id=item.source_report_id,
        source_report_item_id=item.source_report_item_id,
        source_report_updated_at=item.source_report_updated_at,
        position=item.position,
        promoted_at=item.promoted_at,
        superseded_at=item.superseded_at,
        evidence_preview=evidence[0].excerpt if evidence else "",
        evidence_ids=[value.id for value in evidence],
    )


def _promotion_select():
    return select(RecordKnowledgePromotion).options(
        selectinload(RecordKnowledgePromotion.items).selectinload(
            RecordKnowledgeItem.evidence
        )
    )


def _source_exclusion_reason(report: SessionReport | None) -> str:
    if report is None:
        return "Session Report has not been generated"
    if report.status == "researcher-reviewed":
        return "Session Report is waiting for approval"
    if report.status == "ai-generated":
        return "Session Report is waiting for review and approval"
    if report.status == "superseded":
        return "Session Report has been superseded"
    return "Session Report has not been promoted"
