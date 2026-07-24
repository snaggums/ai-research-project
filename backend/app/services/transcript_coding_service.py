from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
from uuid import uuid4

from app.core.domain_errors import ApplicationError
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.record import ProductRecord, SessionRecord
from app.models.research_session import ResearchSession
from app.models.transcript_coding import (
    CodeSuggestion,
    CodeSuggestionEvidence,
    CodeSuggestionRun,
    HighlightCodeAssignment,
    RecordCode,
    TranscriptHighlight,
)
from app.models.transcript_block import TranscriptBlockRecord
from app.schemas.research_session import SessionReference
from app.schemas.transcript_coding import (
    HighlightCodesUpdate,
    RecordCodeCreate,
    RecordCodeRead,
    RecordCodeUpdate,
    SuggestionRunRead,
    TranscriptAnchor,
    TranscriptAnchorCreate,
    TranscriptCodeSuggestionEvidenceRead,
    TranscriptCodeSuggestionRead,
    TranscriptCodeSuggestionUpdate,
    TranscriptCodingBlock,
    TranscriptCodingTranscriptRead,
    TranscriptCodingWorkspaceRead,
    TranscriptHighlightCreate,
    TranscriptHighlightRead,
    TranscriptHighlightUpdate,
)
from app.services import ai_settings_service, research_session_service, theme_service
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload


PROMPT_VERSION = "transcript-coding-v1"


@dataclass(frozen=True)
class WorkspaceContext:
    research_session: ResearchSession
    document: Document
    record: ProductRecord | None
    checksum: str
    blocks: list[TranscriptCodingBlock]


@dataclass(frozen=True)
class GeneratedSuggestion:
    name: str
    description: str
    confidence: float | None
    chunks: tuple[Chunk, ...]


def get_workspace(db: Session, project_id: str, session_id: str) -> TranscriptCodingWorkspaceRead:
    context = _workspace_context(db, project_id, session_id)
    latest_run = db.scalar(
        _run_select()
        .where(CodeSuggestionRun.session_id == session_id)
        .order_by(CodeSuggestionRun.created_at.desc())
    )
    codes = _active_codes(db, context.record.id) if context.record else []
    highlights = _session_highlights(db, session_id)
    suggestions = list(latest_run.suggestions) if latest_run else []
    return TranscriptCodingWorkspaceRead(
        project_id=project_id,
        session_id=session_id,
        document_id=context.document.id,
        record=SessionReference(id=context.record.id, name=context.record.name) if context.record else None,
        transcript=TranscriptCodingTranscriptRead(content_checksum=context.checksum, blocks=context.blocks),
        suggestion_run=SuggestionRunRead(
            id=latest_run.id if latest_run else None,
            status=latest_run.status if latest_run else "idle",
            error_detail=latest_run.error_detail if latest_run else None,
        ),
        codes=[code_to_read(code) for code in codes],
        highlights=[highlight_to_read(highlight) for highlight in highlights],
        suggestions=[suggestion_to_read(suggestion) for suggestion in suggestions],
    )


def list_highlights(
    db: Session,
    project_id: str,
    session_id: str,
    status_filter: str,
    code_ids: list[str],
    cursor: str | None,
    limit: int,
) -> list[TranscriptHighlightRead]:
    _workspace_context(db, project_id, session_id)
    values = _session_highlights(db, session_id)
    values = _values_after_cursor(values, cursor)
    return _filter_highlights(values, status_filter, code_ids, limit)


def list_record_highlights(
    db: Session,
    record_id: str,
    status_filter: str,
    code_ids: list[str],
    cursor: str | None,
    limit: int,
) -> list[TranscriptHighlightRead]:
    _require_record(db, record_id)
    values = list(
        db.scalars(
            _highlight_select()
            .join(SessionRecord, SessionRecord.session_id == TranscriptHighlight.session_id)
            .where(
                SessionRecord.record_id == record_id,
                TranscriptHighlight.deleted_at.is_(None),
            )
            .order_by(TranscriptHighlight.created_at.desc(), TranscriptHighlight.id)
        ).unique().all()
    )
    values = _values_after_cursor(values, cursor)
    return _filter_highlights(values, status_filter, code_ids, limit)


def _filter_highlights(
    values: list[TranscriptHighlight],
    status_filter: str,
    code_ids: list[str],
    limit: int,
) -> list[TranscriptHighlightRead]:
    requested = set(code_ids)
    filtered: list[TranscriptHighlight] = []
    for value in values:
        active_ids = {assignment.code_id for assignment in value.assignments if assignment.removed_at is None}
        if status_filter == "accepted-coded" and not active_ids:
            continue
        if status_filter == "uncoded" and active_ids:
            continue
        if requested and not requested.intersection(active_ids):
            continue
        filtered.append(value)
    return [highlight_to_read(value) for value in filtered[:limit]]


def _values_after_cursor(
    values: list[TranscriptHighlight],
    cursor: str | None,
) -> list[TranscriptHighlight]:
    if not cursor:
        return values
    for index, value in enumerate(values):
        if value.id == cursor:
            return values[index + 1 :]
    raise _error(422, "invalid_cursor", "The Highlight cursor is not available in this scope.")


def create_highlight(
    db: Session,
    project_id: str,
    session_id: str,
    payload: TranscriptHighlightCreate,
    request_key: str,
) -> TranscriptHighlightRead:
    context = _workspace_context(db, project_id, session_id)
    replay = db.scalar(
        _highlight_select().where(
            TranscriptHighlight.session_id == session_id,
            TranscriptHighlight.client_request_key == request_key,
        )
    )
    if replay is not None:
        return highlight_to_read(replay)

    anchor = _validate_anchor(db, context, payload.anchor)
    code_ids = list(dict.fromkeys(payload.code_ids))
    if (code_ids or payload.new_code) and context.record is None:
        raise _error(409, "record_required_for_code", "Assign this Session to a Record before creating or applying a Code.")
    codes = _require_codes(db, context.record.id, code_ids) if context.record else []
    if payload.new_code and context.record:
        codes.append(_get_or_create_code(db, context.record.id, payload.new_code.name, payload.new_code.description))

    highlight = db.scalar(
        _highlight_select().where(
            TranscriptHighlight.document_id == context.document.id,
            TranscriptHighlight.start_char == anchor.start_char,
            TranscriptHighlight.end_char == anchor.end_char,
        )
    )
    if highlight is None:
        highlight = TranscriptHighlight(
            project_id=project_id,
            session_id=session_id,
            document_id=context.document.id,
            chunk_id=anchor.chunk_id,
            block_id=anchor.block_id,
            start_char=anchor.start_char,
            end_char=anchor.end_char,
            excerpt_snapshot=anchor.excerpt_snapshot,
            speaker=anchor.speaker,
            location=anchor.location,
            start_ms=anchor.start_ms,
            end_ms=anchor.end_ms,
            content_checksum=anchor.content_checksum,
            origin="researcher",
            client_request_key=request_key,
        )
        db.add(highlight)
        db.flush()
    else:
        highlight.deleted_at = None
        highlight.updated_at = _now()
        if highlight.client_request_key is None:
            highlight.client_request_key = request_key

    for code in codes:
        _assign_code(db, highlight, code, "researcher", None)
    db.commit()
    loaded = _get_highlight(db, project_id, session_id, highlight.id, include_deleted=True)
    if loaded is None:
        raise RuntimeError("Highlight could not be reloaded.")
    return highlight_to_read(loaded)


def update_highlight(
    db: Session,
    project_id: str,
    session_id: str,
    highlight_id: str,
    payload: TranscriptHighlightUpdate,
) -> TranscriptHighlightRead:
    context = _workspace_context(db, project_id, session_id)
    highlight = _require_highlight(db, project_id, session_id, highlight_id)
    if context.record is None and payload.code_ids:
        raise _error(409, "record_required_for_code", "Assign this Session to a Record before applying a Code.")
    codes = _require_codes(db, context.record.id, payload.code_ids) if context.record else []
    requested = {code.id for code in codes}
    for assignment in highlight.assignments:
        assignment.removed_at = None if assignment.code_id in requested else _now()
    existing = {assignment.code_id for assignment in highlight.assignments}
    for code in codes:
        if code.id not in existing:
            _assign_code(db, highlight, code, "researcher", None)
    highlight.updated_at = _now()
    db.add(highlight)
    db.commit()
    return highlight_to_read(_require_highlight(db, project_id, session_id, highlight_id))


def delete_highlight(db: Session, project_id: str, session_id: str, highlight_id: str) -> None:
    _workspace_context(db, project_id, session_id)
    highlight = _get_highlight(db, project_id, session_id, highlight_id, include_deleted=True)
    if highlight is None:
        raise _error(404, "highlight_not_found", "Highlight not found.")
    if highlight.deleted_at is None:
        highlight.deleted_at = _now()
        highlight.updated_at = _now()
        db.add(highlight)
        db.commit()


def add_highlight_codes(
    db: Session,
    project_id: str,
    session_id: str,
    highlight_id: str,
    payload: HighlightCodesUpdate,
) -> TranscriptHighlightRead:
    context = _workspace_context(db, project_id, session_id)
    highlight = _require_highlight(db, project_id, session_id, highlight_id)
    if context.record is None:
        raise _error(409, "record_required_for_code", "Assign this Session to a Record before applying a Code.")
    for code in _require_codes(db, context.record.id, payload.code_ids):
        _assign_code(db, highlight, code, "researcher", None)
    highlight.updated_at = _now()
    db.add(highlight)
    db.commit()
    return highlight_to_read(_require_highlight(db, project_id, session_id, highlight_id))


def remove_highlight_code(
    db: Session,
    project_id: str,
    session_id: str,
    highlight_id: str,
    code_id: str,
) -> TranscriptHighlightRead:
    _workspace_context(db, project_id, session_id)
    highlight = _require_highlight(db, project_id, session_id, highlight_id)
    assignment = next((value for value in highlight.assignments if value.code_id == code_id), None)
    if assignment is not None and assignment.removed_at is None:
        assignment.removed_at = _now()
        highlight.updated_at = _now()
        db.add_all([assignment, highlight])
        db.commit()
    return highlight_to_read(_require_highlight(db, project_id, session_id, highlight_id))


def list_codes(db: Session, record_id: str) -> list[RecordCodeRead]:
    _require_record(db, record_id)
    return [code_to_read(value) for value in _active_codes(db, record_id)]


def create_code(db: Session, record_id: str, payload: RecordCodeCreate) -> RecordCodeRead:
    _require_record(db, record_id)
    code = _get_or_create_code(db, record_id, payload.name, payload.description)
    db.commit()
    db.refresh(code)
    return code_to_read(code)


def update_code(db: Session, record_id: str, code_id: str, payload: RecordCodeUpdate) -> RecordCodeRead:
    _require_record(db, record_id)
    code = db.scalar(select(RecordCode).where(RecordCode.id == code_id, RecordCode.record_id == record_id))
    if code is None:
        raise _error(404, "code_not_found", "Code not found.")
    values = payload.model_dump(exclude_unset=True)
    if "name" in values:
        name = _clean_name(values["name"])
        normalized = _normalize_name(name)
        duplicate = db.scalar(
            select(RecordCode).where(
                RecordCode.record_id == record_id,
                RecordCode.normalized_name == normalized,
                RecordCode.id != code.id,
            )
        )
        if duplicate:
            raise _error(409, "code_name_conflict", "A Code with this name already exists in the Record.")
        code.name = name
        code.normalized_name = normalized
    if "description" in values:
        code.description = _optional(values["description"])
    code.updated_at = _now()
    db.add(code)
    db.commit()
    db.refresh(code)
    return code_to_read(code)


def list_suggestions(db: Session, project_id: str, session_id: str) -> list[TranscriptCodeSuggestionRead]:
    _workspace_context(db, project_id, session_id)
    latest_run = db.scalar(
        _run_select().where(CodeSuggestionRun.session_id == session_id).order_by(CodeSuggestionRun.created_at.desc())
    )
    return [suggestion_to_read(value) for value in latest_run.suggestions] if latest_run else []


def generate_suggestions(
    db: Session,
    project_id: str,
    session_id: str,
    request_key: str,
) -> TranscriptCodingWorkspaceRead:
    context = _workspace_context(db, project_id, session_id)
    if context.record is None:
        raise _error(409, "record_required_for_code", "Assign this Session to a Record before generating Code Suggestions.")
    replay = db.scalar(
        _run_select().where(
            CodeSuggestionRun.session_id == session_id,
            CodeSuggestionRun.client_request_key == request_key,
        )
    )
    if replay is not None:
        return get_workspace(db, project_id, session_id)

    settings = ai_settings_service.get_or_create_settings(db)
    used_mock = theme_service._should_use_mock(settings)
    run = CodeSuggestionRun(
        project_id=project_id,
        session_id=session_id,
        document_id=context.document.id,
        record_id=context.record.id,
        status="processing",
        provider="mock" if used_mock else settings.provider,
        model=settings.model,
        prompt_version=PROMPT_VERSION,
        content_checksum=context.checksum,
        client_request_key=request_key,
    )
    db.add(run)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return get_workspace(db, project_id, session_id)

    try:
        chunks = list(
            db.scalars(select(Chunk).where(Chunk.document_id == context.document.id).order_by(Chunk.chunk_index)).all()
        )
        generated = _mock_suggestions(chunks)
        if not used_mock:
            generated = _live_suggestions(settings, chunks)
        persisted = db.get(CodeSuggestionRun, run.id)
        if persisted is None:
            raise RuntimeError("Suggestion run could not be reloaded.")
        persisted.suggestions = [
            _build_suggestion(persisted, item, context.document, context.checksum, position)
            for position, item in enumerate(generated)
        ]
        persisted.status = "complete"
        persisted.completed_at = _now()
        persisted.error_detail = None
        db.add(persisted)
        db.commit()
    except Exception as exc:
        db.rollback()
        failed = db.get(CodeSuggestionRun, run.id)
        if failed is not None:
            failed.status = "failed"
            failed.completed_at = _now()
            failed.error_detail = str(exc)[:1200]
            db.add(failed)
            db.commit()
    return get_workspace(db, project_id, session_id)


def update_suggestion(
    db: Session,
    project_id: str,
    session_id: str,
    suggestion_id: str,
    payload: TranscriptCodeSuggestionUpdate,
) -> TranscriptCodeSuggestionRead:
    _workspace_context(db, project_id, session_id)
    suggestion = _require_suggestion(db, session_id, suggestion_id)
    if suggestion.status != "awaiting-review":
        raise _error(409, "suggestion_already_reviewed", "Accepted and rejected suggestions cannot be edited.")
    values = payload.model_dump(exclude_unset=True)
    if "proposed_name" in values:
        suggestion.proposed_name = _clean_name(values["proposed_name"])
    if "proposed_description" in values:
        suggestion.proposed_description = _optional(values["proposed_description"])
    suggestion.was_edited = True
    db.add(suggestion)
    db.commit()
    return suggestion_to_read(_require_suggestion(db, session_id, suggestion_id))


def accept_suggestion(
    db: Session,
    project_id: str,
    session_id: str,
    suggestion_id: str,
    request_key: str,
) -> TranscriptCodingWorkspaceRead:
    context = _workspace_context(db, project_id, session_id)
    suggestion = _require_suggestion(db, session_id, suggestion_id)
    if suggestion.status == "accepted" and suggestion.review_request_key == request_key:
        return get_workspace(db, project_id, session_id)
    if suggestion.status != "awaiting-review":
        raise _error(409, "suggestion_already_reviewed", "This Code Suggestion has already been reviewed.")
    if context.record is None or context.record.id != suggestion.record_id:
        raise _error(409, "record_required_for_code", "The Session Record no longer matches this Code Suggestion.")
    if suggestion.run.content_checksum != context.checksum:
        raise _error(409, "stale_transcript_anchor", "The Transcript changed after this suggestion was generated.")

    code = _get_or_create_code(db, context.record.id, suggestion.proposed_name, suggestion.proposed_description)
    assignment_origin = "edited-suggestion" if suggestion.was_edited else "accepted-suggestion"
    for evidence in suggestion.evidence:
        anchor_payload = TranscriptAnchorCreate(
            chunk_id=evidence.chunk_id,
            block_id=evidence.block_id,
            start_char=evidence.start_char,
            end_char=evidence.end_char,
            excerpt_snapshot=evidence.excerpt_snapshot,
            speaker=evidence.speaker,
            location=evidence.location,
            start_ms=evidence.start_ms,
            end_ms=evidence.end_ms,
            content_checksum=evidence.content_checksum,
        )
        anchor = _validate_anchor(db, context, anchor_payload)
        highlight = db.scalar(
            _highlight_select().where(
                TranscriptHighlight.document_id == context.document.id,
                TranscriptHighlight.start_char == anchor.start_char,
                TranscriptHighlight.end_char == anchor.end_char,
            )
        )
        if highlight is None:
            highlight = TranscriptHighlight(
                project_id=project_id,
                session_id=session_id,
                document_id=context.document.id,
                chunk_id=anchor.chunk_id,
                block_id=anchor.block_id,
                start_char=anchor.start_char,
                end_char=anchor.end_char,
                excerpt_snapshot=anchor.excerpt_snapshot,
                speaker=anchor.speaker,
                location=anchor.location,
                start_ms=anchor.start_ms,
                end_ms=anchor.end_ms,
                content_checksum=anchor.content_checksum,
                origin="ai-suggestion",
            )
            db.add(highlight)
            db.flush()
        else:
            highlight.deleted_at = None
        _assign_code(db, highlight, code, assignment_origin, suggestion.id)
    suggestion.status = "accepted"
    suggestion.accepted_code_id = code.id
    suggestion.reviewed_at = _now()
    suggestion.review_request_key = request_key
    db.add(suggestion)
    db.commit()
    return get_workspace(db, project_id, session_id)


def reject_suggestion(
    db: Session,
    project_id: str,
    session_id: str,
    suggestion_id: str,
    request_key: str,
) -> TranscriptCodeSuggestionRead:
    _workspace_context(db, project_id, session_id)
    suggestion = _require_suggestion(db, session_id, suggestion_id)
    if suggestion.status == "rejected" and suggestion.review_request_key == request_key:
        return suggestion_to_read(suggestion)
    if suggestion.status != "awaiting-review":
        raise _error(409, "suggestion_already_reviewed", "This Code Suggestion has already been reviewed.")
    suggestion.status = "rejected"
    suggestion.reviewed_at = _now()
    suggestion.review_request_key = request_key
    db.add(suggestion)
    db.commit()
    return suggestion_to_read(_require_suggestion(db, session_id, suggestion_id))


def has_active_coded_highlights(db: Session, session_id: str) -> bool:
    return db.scalar(
        select(HighlightCodeAssignment.highlight_id)
        .join(TranscriptHighlight, TranscriptHighlight.id == HighlightCodeAssignment.highlight_id)
        .where(
            TranscriptHighlight.session_id == session_id,
            TranscriptHighlight.deleted_at.is_(None),
            HighlightCodeAssignment.removed_at.is_(None),
        )
        .limit(1)
    ) is not None


def has_document_coding_dependencies(db: Session, document_id: str) -> bool:
    highlight = db.scalar(
        select(TranscriptHighlight.id).where(TranscriptHighlight.document_id == document_id).limit(1)
    )
    if highlight is not None:
        return True
    run = db.scalar(
        select(CodeSuggestionRun.id).where(CodeSuggestionRun.document_id == document_id).limit(1)
    )
    return run is not None


def _workspace_context(db: Session, project_id: str, session_id: str) -> WorkspaceContext:
    research_session = research_session_service.get_session(db, project_id, session_id)
    if research_session is None:
        raise _error(404, "session_not_found", "Session not found.")
    document = research_session.primary_transcript
    if (
        document is None
        or document.project_id != project_id
        or document.session_id != session_id
        or document.status != "complete"
        or not document.content
    ):
        raise _error(
            409,
            "primary_transcript_required",
            "Upload and process a Primary Transcript before using Transcript Coding.",
        )
    record = research_session.record_assignments[0].record if research_session.record_assignments else None
    checksum = content_checksum(document.content)
    return WorkspaceContext(
        research_session=research_session,
        document=document,
        record=record,
        checksum=checksum,
        blocks=_coding_blocks(db, document),
    )


def content_checksum(content: str) -> str:
    return f"sha256:{sha256(content.encode('utf-8')).hexdigest()}"


def _coding_blocks(db: Session, document: Document) -> list[TranscriptCodingBlock]:
    content = document.content or ""
    chunks = list(db.scalars(select(Chunk).where(Chunk.document_id == document.id).order_by(Chunk.chunk_index)).all())
    stored = list(
        db.scalars(
            select(TranscriptBlockRecord)
            .where(TranscriptBlockRecord.document_id == document.id)
            .order_by(TranscriptBlockRecord.block_index)
        ).all()
    )
    if stored:
        chunks_by_block: dict[str, Chunk] = {}
        for chunk in chunks:
            block_id = (chunk.extra_metadata or {}).get("block_id")
            if block_id and str(block_id) not in chunks_by_block:
                chunks_by_block[str(block_id)] = chunk
        return [
            TranscriptCodingBlock(
                id=value.id,
                chunk_id=chunks_by_block[value.id].id if value.id in chunks_by_block else None,
                speaker=value.speaker or "Transcript",
                location=value.location or f"Passage {value.block_index + 1}",
                text=value.text,
                start_char=value.start_char,
                end_char=value.end_char,
            )
            for value in stored
        ]

    blocks: list[TranscriptCodingBlock] = []
    for chunk in chunks:
        start = chunk.start_char if chunk.start_char is not None else content.find(chunk.text)
        end = chunk.end_char if chunk.end_char is not None else start + len(chunk.text)
        if start < 0:
            start = 0
        end = min(len(content), end)
        if end <= start:
            continue
        text = content[start:end]
        speaker, display, display_offset = _speaker_display_anchor(text)
        metadata = chunk.extra_metadata or {}
        blocks.append(
            TranscriptCodingBlock(
                id=chunk.id,
                chunk_id=chunk.id,
                speaker=speaker,
                location=str(metadata.get("timestamp") or f"Excerpt {chunk.chunk_index + 1}"),
                text=display,
                start_char=start + display_offset,
                end_char=end,
            )
        )
    if blocks:
        return blocks
    speaker, display, display_offset = _speaker_display_anchor(content)
    return [
        TranscriptCodingBlock(
            id=f"document-{document.id}",
            chunk_id=None,
            speaker=speaker,
            location="Transcript",
            text=display,
            start_char=display_offset,
            end_char=len(content),
        )
    ]


def _validate_anchor(db: Session, context: WorkspaceContext, payload: TranscriptAnchorCreate) -> TranscriptAnchor:
    content = context.document.content or ""
    if payload.end_char <= payload.start_char or payload.start_char < 0 or payload.end_char > len(content):
        raise _error(422, "invalid_transcript_selection", "Select non-empty text within the current Transcript.")
    if payload.content_checksum != context.checksum:
        raise _error(409, "stale_transcript_anchor", "The Transcript changed after this passage was selected.")
    exact = content[payload.start_char:payload.end_char]
    if exact != payload.excerpt_snapshot:
        raise _error(409, "stale_transcript_anchor", "The selected text no longer matches the current Transcript.")
    if payload.chunk_id:
        chunk = db.scalar(
            select(Chunk).where(Chunk.id == payload.chunk_id, Chunk.document_id == context.document.id)
        )
        if chunk is None:
            raise _error(422, "invalid_transcript_selection", "The selected Transcript block is not part of the Primary Transcript.")
    if payload.block_id:
        stored_blocks = list(
            db.scalars(
                select(TranscriptBlockRecord).where(
                    TranscriptBlockRecord.document_id == context.document.id
                )
            ).all()
        )
        if stored_blocks:
            block = next((value for value in stored_blocks if value.id == payload.block_id), None)
            if (
                block is None
                or payload.start_char < block.start_char
                or payload.end_char > block.end_char
            ):
                raise _error(
                    422,
                    "invalid_transcript_selection",
                    "The selected Transcript passage is outside its source block.",
                )
    return TranscriptAnchor(
        document_id=context.document.id,
        chunk_id=payload.chunk_id,
        block_id=payload.block_id,
        start_char=payload.start_char,
        end_char=payload.end_char,
        excerpt_snapshot=exact,
        speaker=payload.speaker,
        location=payload.location,
        start_ms=payload.start_ms,
        end_ms=payload.end_ms,
        content_checksum=context.checksum,
    )


def _get_or_create_code(db: Session, record_id: str, name: str, description: str | None) -> RecordCode:
    clean_name = _clean_name(name)
    normalized = _normalize_name(clean_name)
    existing = db.scalar(
        select(RecordCode).where(RecordCode.record_id == record_id, RecordCode.normalized_name == normalized)
    )
    if existing:
        if existing.status == "archived":
            existing.status = "active"
        if description and not existing.description:
            existing.description = _optional(description)
        return existing
    code = RecordCode(
        record_id=record_id,
        name=clean_name,
        normalized_name=normalized,
        description=_optional(description),
    )
    db.add(code)
    db.flush()
    return code


def _require_codes(db: Session, record_id: str, code_ids: list[str]) -> list[RecordCode]:
    unique_ids = list(dict.fromkeys(code_ids))
    if not unique_ids:
        return []
    values = list(db.scalars(select(RecordCode).where(RecordCode.id.in_(unique_ids), RecordCode.status == "active")).all())
    if len(values) != len(unique_ids) or any(value.record_id != record_id for value in values):
        raise _error(422, "cross_record_code", "Every selected Code must belong to the Session's Record.")
    by_id = {value.id: value for value in values}
    return [by_id[value] for value in unique_ids]


def _assign_code(
    db: Session,
    highlight: TranscriptHighlight,
    code: RecordCode,
    origin: str,
    suggestion_id: str | None,
) -> None:
    assignment = next((value for value in highlight.assignments if value.code_id == code.id), None)
    if assignment is None:
        assignment = HighlightCodeAssignment(
            highlight_id=highlight.id,
            code_id=code.id,
            assignment_origin=origin,
            suggestion_id=suggestion_id,
        )
        db.add(assignment)
        highlight.assignments.append(assignment)
    else:
        assignment.removed_at = None
        assignment.assignment_origin = origin
        assignment.suggestion_id = suggestion_id


def _active_codes(db: Session, record_id: str) -> list[RecordCode]:
    return list(
        db.scalars(
            select(RecordCode)
            .where(RecordCode.record_id == record_id, RecordCode.status == "active")
            .order_by(RecordCode.normalized_name)
        ).all()
    )


def _session_highlights(db: Session, session_id: str) -> list[TranscriptHighlight]:
    return list(
        db.scalars(
            _highlight_select()
            .where(TranscriptHighlight.session_id == session_id, TranscriptHighlight.deleted_at.is_(None))
            .order_by(TranscriptHighlight.start_char)
        ).unique().all()
    )


def _get_highlight(
    db: Session,
    project_id: str,
    session_id: str,
    highlight_id: str,
    include_deleted: bool,
) -> TranscriptHighlight | None:
    statement = _highlight_select().where(
        TranscriptHighlight.id == highlight_id,
        TranscriptHighlight.project_id == project_id,
        TranscriptHighlight.session_id == session_id,
    )
    if not include_deleted:
        statement = statement.where(TranscriptHighlight.deleted_at.is_(None))
    return db.scalar(statement)


def _require_highlight(db: Session, project_id: str, session_id: str, highlight_id: str) -> TranscriptHighlight:
    value = _get_highlight(db, project_id, session_id, highlight_id, include_deleted=False)
    if value is None:
        raise _error(404, "highlight_not_found", "Highlight not found.")
    return value


def _require_suggestion(db: Session, session_id: str, suggestion_id: str) -> CodeSuggestion:
    value = db.scalar(
        _suggestion_select()
        .join(CodeSuggestionRun, CodeSuggestionRun.id == CodeSuggestion.run_id)
        .where(CodeSuggestion.id == suggestion_id, CodeSuggestionRun.session_id == session_id)
    )
    if value is None:
        raise _error(404, "suggestion_not_found", "Code Suggestion not found.")
    return value


def _require_record(db: Session, record_id: str) -> ProductRecord:
    record = db.get(ProductRecord, record_id)
    if record is None:
        raise _error(404, "record_not_found", "Record not found.")
    return record


def _highlight_select():
    return select(TranscriptHighlight).options(
        selectinload(TranscriptHighlight.assignments).selectinload(HighlightCodeAssignment.code)
    )


def _run_select():
    return select(CodeSuggestionRun).options(
        selectinload(CodeSuggestionRun.suggestions).selectinload(CodeSuggestion.evidence)
    )


def _suggestion_select():
    return select(CodeSuggestion).options(
        selectinload(CodeSuggestion.evidence),
        selectinload(CodeSuggestion.run),
    )


def code_to_read(value: RecordCode) -> RecordCodeRead:
    return RecordCodeRead(
        id=value.id,
        record_id=value.record_id,
        name=value.name,
        description=value.description,
        status=value.status,
        created_at=value.created_at,
        updated_at=value.updated_at,
    )


def highlight_to_read(value: TranscriptHighlight) -> TranscriptHighlightRead:
    active_codes = sorted(
        [assignment.code for assignment in value.assignments if assignment.removed_at is None],
        key=lambda code: code.normalized_name,
    )
    return TranscriptHighlightRead(
        id=value.id,
        project_id=value.project_id,
        session_id=value.session_id,
        document_id=value.document_id,
        anchor=TranscriptAnchor(
            document_id=value.document_id,
            chunk_id=value.chunk_id,
            block_id=value.block_id,
            start_char=value.start_char,
            end_char=value.end_char,
            excerpt_snapshot=value.excerpt_snapshot,
            speaker=value.speaker,
            location=value.location,
            start_ms=value.start_ms,
            end_ms=value.end_ms,
            content_checksum=value.content_checksum,
        ),
        origin=value.origin,
        codes=[code_to_read(code) for code in active_codes],
        created_at=value.created_at,
        updated_at=value.updated_at,
        deleted_at=value.deleted_at,
    )


def suggestion_to_read(value: CodeSuggestion) -> TranscriptCodeSuggestionRead:
    return TranscriptCodeSuggestionRead(
        id=value.id,
        run_id=value.run_id,
        record_id=value.record_id,
        proposed_name=value.proposed_name,
        proposed_description=value.proposed_description,
        confidence=value.confidence,
        status=value.status,
        was_edited=value.was_edited,
        accepted_code_id=value.accepted_code_id,
        reviewed_at=value.reviewed_at,
        evidence=[
            TranscriptCodeSuggestionEvidenceRead(
                id=evidence.id,
                anchor=TranscriptAnchor(
                    document_id=evidence.document_id,
                    chunk_id=evidence.chunk_id,
                    block_id=evidence.block_id,
                    start_char=evidence.start_char,
                    end_char=evidence.end_char,
                    excerpt_snapshot=evidence.excerpt_snapshot,
                    speaker=evidence.speaker,
                    location=evidence.location,
                    start_ms=evidence.start_ms,
                    end_ms=evidence.end_ms,
                    content_checksum=evidence.content_checksum,
                ),
                display_order=evidence.display_order,
            )
            for evidence in value.evidence
        ],
    )


def _build_suggestion(
    run: CodeSuggestionRun,
    generated: GeneratedSuggestion,
    document: Document,
    checksum: str,
    position: int,
) -> CodeSuggestion:
    suggestion = CodeSuggestion(
        run_id=run.id,
        record_id=run.record_id,
        proposed_name=generated.name,
        proposed_description=generated.description,
        confidence=generated.confidence,
    )
    content = document.content or ""
    evidence: list[CodeSuggestionEvidence] = []
    for index, chunk in enumerate(generated.chunks):
        start = chunk.start_char if chunk.start_char is not None else content.find(chunk.text)
        end = chunk.end_char if chunk.end_char is not None else start + len(chunk.text)
        if start < 0:
            start = 0
        end = min(len(content), end)
        if end <= start:
            continue
        excerpt = content[start:end]
        metadata = chunk.extra_metadata or {}
        speaker, _ = _speaker_and_text(excerpt)
        speaker = str(metadata.get("speaker") or speaker)
        evidence.append(
            CodeSuggestionEvidence(
                document_id=document.id,
                chunk_id=chunk.id,
                block_id=str(metadata.get("block_id") or chunk.id),
                start_char=start,
                end_char=end,
                excerpt_snapshot=excerpt,
                speaker=speaker,
                location=str(metadata.get("timestamp") or f"Excerpt {chunk.chunk_index + 1}"),
                start_ms=metadata.get("start_ms"),
                end_ms=metadata.get("end_ms"),
                content_checksum=checksum,
                display_order=index,
            )
        )
    if not evidence:
        raise ValueError(f"Generated suggestion {position + 1} did not contain valid Transcript evidence.")
    suggestion.evidence = evidence
    return suggestion


def _mock_suggestions(chunks: list[Chunk]) -> list[GeneratedSuggestion]:
    if not chunks:
        raise ValueError("The Primary Transcript does not contain indexed passages.")
    buckets = (
        (
            "Navigation terminology",
            "Labels and navigation language did not match participant expectations.",
            ("navigation", "label", "menu", "find", "where", "document", "source"),
        ),
        (
            "Workflow confidence",
            "The workflow affected the participant's confidence while completing a task.",
            ("confidence", "workflow", "unsure", "confusing", "trust", "verify"),
        ),
        (
            "Information architecture",
            "Labels, grouping, or content placement affected information finding.",
            ("group", "category", "structure", "information", "content", "find"),
        ),
    )
    generated: list[GeneratedSuggestion] = []
    for name, description, keywords in buckets:
        matches = tuple(chunk for chunk in chunks if any(keyword in chunk.text.casefold() for keyword in keywords))[:3]
        if matches:
            generated.append(GeneratedSuggestion(name, description, 0.88, matches))
    if not generated:
        generated.append(
            GeneratedSuggestion(
                "Research observation",
                "A source passage that may warrant a reusable research Code.",
                0.72,
                tuple(chunks[:2]),
            )
        )
    return generated[:3]


def _live_suggestions(settings, chunks: list[Chunk]) -> list[GeneratedSuggestion]:
    try:
        from litellm import completion
    except ImportError as exc:
        raise ValueError("Install backend requirements before using live AI Code Suggestion generation.") from exc
    context = [{"chunk_id": value.id, "text": value.text[:1800]} for value in chunks[:40]]
    response = completion(
        model=settings.model,
        messages=[
            {
                "role": "system",
                "content": (
                    "Create 1-5 concise qualitative research Codes using only the supplied Transcript chunks. "
                    "Return JSON with a suggestions array. Each item needs name, description, confidence (0-1), "
                    "and one or more existing chunk_ids. Do not invent evidence."
                ),
            },
            {"role": "user", "content": json.dumps(context)},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        api_key=theme_service._api_key_for_provider(settings.provider),
        api_base=settings.base_url,
    )
    payload = json.loads(response.choices[0].message.content)
    chunk_map = {value.id: value for value in chunks}
    generated: list[GeneratedSuggestion] = []
    for raw in payload.get("suggestions", [])[:5]:
        selected = tuple(chunk_map[value] for value in raw.get("chunk_ids", []) if value in chunk_map)
        if selected and str(raw.get("name", "")).strip():
            generated.append(
                GeneratedSuggestion(
                    _clean_name(str(raw["name"])),
                    str(raw.get("description") or "").strip(),
                    float(raw["confidence"]) if raw.get("confidence") is not None else None,
                    selected,
                )
            )
    if not generated:
        raise ValueError("The AI provider did not return valid, grounded Code Suggestions.")
    return generated


def _speaker_and_text(text: str) -> tuple[str, str]:
    speaker, display, _ = _speaker_display_anchor(text)
    return speaker, display


def _speaker_display_anchor(text: str) -> tuple[str, str, int]:
    first_line, separator, remainder = text.partition("\n")
    if separator and ":" in first_line and len(first_line) <= 120:
        speaker, _, opening = first_line.partition(":")
        if opening.strip():
            offset = text.find(opening.strip())
            display = text[offset:].strip()
        else:
            offset = len(first_line) + 1
            display = remainder.strip()
        return speaker.strip(), display, offset
    if ":" in text[:80]:
        speaker, _, display = text.partition(":")
        if speaker and len(speaker) <= 60:
            clean_display = display.strip()
            return speaker.strip(), clean_display, text.find(clean_display)
    stripped = text.strip()
    return "Transcript", stripped, text.find(stripped)


def _clean_name(value: str) -> str:
    cleaned = " ".join(value.split())
    if not cleaned:
        raise _error(422, "invalid_code_name", "Code name is required.")
    return cleaned


def _normalize_name(value: str) -> str:
    return _clean_name(value).casefold()


def _optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _error(status_code: int, code: str, detail: str) -> ApplicationError:
    return ApplicationError(status_code, code, detail)
