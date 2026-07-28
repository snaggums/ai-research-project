from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.chunk import Chunk
from app.models.conversation import MessageCitation
from app.models.document import Document
from app.models.project import Project
from app.models.record import RecordSynthesisEvidence, RecordSynthesisItem, RecordSynthesisRun
from app.models.research_session import ResearchSession
from app.models.session_report import SessionReport, SessionReportEvidence, SessionReportItem
from app.models.theme_evidence import ThemeEvidence
from app.models.transcript_coding import CodeSuggestion, CodeSuggestionRun, HighlightCodeAssignment, TranscriptHighlight
from app.models.transcript_block import TranscriptBlockRecord
from app.schemas.document import TranscriptDependencySummary
from app.services.chunking_service import chunk_text
from app.services.embedding_service import embed_text
from app.services.parsing_service import ParsedTranscript, SUPPORTED_EXTENSIONS, extract_transcript
from app.services.v1_migration_service import get_or_create_import_session
from fastapi import UploadFile
from sqlalchemy import delete, distinct, func, select, update
from sqlalchemy.orm import Session


def list_project_documents(db: Session, project_id: str) -> list[Document]:
    statement = select(Document).where(Document.project_id == project_id).order_by(Document.uploaded_at.desc())
    return list(db.scalars(statement).all())


def get_document(db: Session, document_id: str) -> Document | None:
    return db.get(Document, document_id)


def create_uploaded_document(
    db: Session,
    project: Project,
    upload: UploadFile,
    research_session: ResearchSession | None = None,
    *,
    lifecycle_status: str = "active",
    replacement_for_document_id: str | None = None,
    replacement_request_key: str | None = None,
) -> Document:
    original_filename = upload.filename or "upload"
    extension = Path(original_filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(f"Unsupported file type. Upload one of: {supported}")

    document_id = str(uuid4())
    project_dir = Path(settings.upload_dir) / f"project_{project.id}"
    project_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"document_{document_id}_{_safe_filename(original_filename)}"
    file_path = project_dir / stored_filename

    with file_path.open("wb") as destination:
        copyfileobj(upload.file, destination)

    owning_session = research_session or get_or_create_import_session(db, project.id)

    document = Document(
        id=document_id,
        project_id=project.id,
        session_id=owning_session.id,
        document_type="transcript",
        filename=original_filename,
        file_path=str(file_path),
        mime_type=upload.content_type,
        size_bytes=file_path.stat().st_size,
        status="uploaded",
        lifecycle_status=lifecycle_status,
        replacement_for_document_id=replacement_for_document_id,
        replacement_request_key=replacement_request_key,
    )
    db.add(document)
    db.flush()
    if owning_session.primary_transcript_document_id is None:
        owning_session.primary_transcript_document_id = document.id
        document.lifecycle_status = "active"
        db.add(owning_session)
    elif lifecycle_status == "active":
        document.lifecycle_status = "legacy"
    db.commit()
    db.refresh(document)
    return document


def create_replacement_document(
    db: Session,
    project: Project,
    research_session: ResearchSession,
    upload: UploadFile,
    request_key: str,
) -> Document:
    existing = db.scalar(
        select(Document).where(
            Document.session_id == research_session.id,
            Document.replacement_request_key == request_key,
        )
    )
    if existing is not None:
        return existing
    active_id = research_session.primary_transcript_document_id
    if active_id is None:
        raise ValueError("This Session does not have an active Transcript to replace.")
    pending = db.scalar(
        select(Document).where(
            Document.session_id == research_session.id,
            Document.lifecycle_status == "replacement-pending",
        )
    )
    if pending is not None:
        raise ValueError("A replacement Transcript is already processing.")
    return create_uploaded_document(
        db,
        project,
        upload,
        research_session,
        lifecycle_status="replacement-pending",
        replacement_for_document_id=active_id,
        replacement_request_key=request_key,
    )


def list_session_documents(db: Session, project_id: str, session_id: str) -> list[Document]:
    statement = select(Document).where(Document.project_id == project_id, Document.session_id == session_id).order_by(Document.uploaded_at.desc())
    return list(db.scalars(statement).all())


def get_session_document(db: Session, project_id: str, session_id: str, document_id: str) -> Document | None:
    return db.scalar(select(Document).where(Document.id == document_id, Document.project_id == project_id, Document.session_id == session_id))


def get_transcript_dependencies(
    db: Session,
    research_session: ResearchSession,
    document: Document,
) -> TranscriptDependencySummary:
    active_assignment = (
        select(HighlightCodeAssignment.highlight_id)
        .where(
            HighlightCodeAssignment.highlight_id == TranscriptHighlight.id,
            HighlightCodeAssignment.removed_at.is_(None),
        )
        .exists()
    )
    accepted_highlights = _count(
        db,
        select(func.count())
        .select_from(TranscriptHighlight)
        .where(
            TranscriptHighlight.document_id == document.id,
            TranscriptHighlight.deleted_at.is_(None),
            active_assignment,
        ),
    )
    uncoded_highlights = _count(
        db,
        select(func.count())
        .select_from(TranscriptHighlight)
        .where(
            TranscriptHighlight.document_id == document.id,
            TranscriptHighlight.deleted_at.is_(None),
            ~active_assignment,
        ),
    )
    suggestion_runs = _count(
        db,
        select(func.count()).select_from(CodeSuggestionRun).where(CodeSuggestionRun.document_id == document.id),
    )
    session_reports = _count(
        db,
        select(func.count(distinct(SessionReport.id)))
        .select_from(SessionReport)
        .join(SessionReportItem, SessionReportItem.report_id == SessionReport.id)
        .join(SessionReportEvidence, SessionReportEvidence.item_id == SessionReportItem.id)
        .where(SessionReportEvidence.document_id == document.id),
    )
    record_syntheses = _count(
        db,
        select(func.count(distinct(RecordSynthesisRun.id)))
        .select_from(RecordSynthesisRun)
        .join(RecordSynthesisItem, RecordSynthesisItem.run_id == RecordSynthesisRun.id)
        .join(RecordSynthesisEvidence, RecordSynthesisEvidence.item_id == RecordSynthesisItem.id)
        .where(RecordSynthesisEvidence.document_id == document.id),
    )
    fingerprint_values = {
        "accepted_highlight_count": accepted_highlights,
        "awaiting_review_suggestion_count": _count(
            db,
            select(func.count())
            .select_from(CodeSuggestion)
            .join(CodeSuggestionRun, CodeSuggestionRun.id == CodeSuggestion.run_id)
            .where(
                CodeSuggestionRun.document_id == document.id,
                CodeSuggestion.status == "awaiting-review",
            ),
        ),
        "code_suggestion_run_count": suggestion_runs,
        "conversation_citation_count": _count(
            db,
            select(func.count()).select_from(MessageCitation).where(MessageCitation.document_id == document.id),
        ),
        "is_primary": research_session.primary_transcript_document_id == document.id,
        "record_synthesis_count": record_syntheses,
        "session_report_count": session_reports,
        "theme_evidence_count": _count(
            db,
            select(func.count()).select_from(ThemeEvidence).where(ThemeEvidence.document_id == document.id),
        ),
        "uncoded_highlight_count": uncoded_highlights,
    }
    version = sha256(json.dumps(fingerprint_values, sort_keys=True).encode("utf-8")).hexdigest()
    return TranscriptDependencySummary(
        is_primary=fingerprint_values["is_primary"],
        accepted_highlight_count=accepted_highlights,
        uncoded_highlight_count=uncoded_highlights,
        code_suggestion_run_count=suggestion_runs,
        session_report_count=session_reports,
        record_synthesis_count=record_syntheses,
        retention_consequence="preserve-lineage",
        version=version,
    )


def tombstone_active_transcript(
    db: Session,
    research_session: ResearchSession,
    document: Document,
) -> None:
    if research_session.primary_transcript_document_id != document.id or document.lifecycle_status != "active":
        raise ValueError("Only the active Transcript can be deleted from the Session workflow.")
    pending = db.scalar(
        select(Document.id).where(
            Document.session_id == research_session.id,
            Document.lifecycle_status == "replacement-pending",
        )
    )
    if pending is not None:
        raise ValueError("Wait for the replacement Transcript to finish before deleting the active Transcript.")

    now = datetime.now(timezone.utc)
    document.lifecycle_status = "tombstoned"
    document.archived_at = now
    research_session.primary_transcript_document_id = None
    research_session.updated_at = now
    db.execute(
        update(SessionReport)
        .where(
            SessionReport.session_id == research_session.id,
            SessionReport.status != "superseded",
        )
        .values(status="superseded", updated_at=now)
    )
    db.add_all([document, research_session])
    db.commit()


def process_document(document_id: str) -> None:
    db = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if document is None:
            return

        document.status = "processing"
        document.error_message = None
        document.processed_at = None
        db.add(document)
        db.commit()

        try:
            parsed = extract_transcript(document.file_path)
            if not parsed.content:
                raise ValueError("No text could be extracted from this file.")
            blocks = _replace_document_blocks(db, document, parsed)
            _replace_document_chunks(db, document, parsed, blocks)
            document.content = parsed.content
            document.parser_name = parsed.parser_name
            document.parser_version = parsed.parser_version
            document.extraction_metadata = parsed.metadata
            document.status = "complete"
            document.error_message = None
            document.processed_at = datetime.now(timezone.utc)
            if document.lifecycle_status == "replacement-pending":
                _activate_replacement(db, document)
        except Exception as exc:
            db.rollback()
            document = db.get(Document, document_id)
            if document is None:
                return
            document.status = "failed"
            if document.lifecycle_status == "replacement-pending":
                document.lifecycle_status = "replacement-failed"
            document.error_message = str(exc)
            document.processed_at = datetime.now(timezone.utc)

        db.add(document)
        db.commit()
    finally:
        db.close()


def activate_existing_replacement(
    db: Session,
    research_session: ResearchSession,
    original: Document,
    replacement: Document,
) -> None:
    if original.session_id != research_session.id or replacement.session_id != research_session.id:
        raise ValueError("Both Transcripts must belong to the same Session.")
    if research_session.primary_transcript_document_id != original.id:
        raise ValueError("The expected original Transcript is no longer active.")
    if replacement.status != "complete":
        raise ValueError("The replacement Transcript must finish processing before activation.")
    replacement.replacement_for_document_id = original.id
    replacement.lifecycle_status = "replacement-pending"
    _activate_replacement(db, replacement)
    db.commit()


def _activate_replacement(db: Session, replacement: Document) -> None:
    original_id = replacement.replacement_for_document_id
    if original_id is None:
        raise ValueError("The replacement Transcript is missing its active source.")
    research_session = db.get(ResearchSession, replacement.session_id)
    original = db.get(Document, original_id)
    if research_session is None or original is None:
        raise ValueError("The active Transcript could not be found.")
    if research_session.primary_transcript_document_id != original.id:
        raise ValueError("The active Transcript changed while the replacement was processing.")

    now = datetime.now(timezone.utc)
    original.lifecycle_status = "legacy"
    original.archived_at = now
    replacement.lifecycle_status = "active"
    replacement.archived_at = None
    research_session.primary_transcript_document_id = replacement.id
    research_session.updated_at = now
    db.execute(
        update(SessionReport)
        .where(
            SessionReport.session_id == research_session.id,
            SessionReport.status != "superseded",
        )
        .values(status="superseded", updated_at=now)
    )
    db.add_all([original, replacement, research_session])


def delete_document(db: Session, document: Document) -> None:
    file_path = Path(document.file_path)
    db.delete(document)
    db.commit()
    if file_path.exists():
        file_path.unlink()


def _count(db: Session, statement) -> int:
    return int(db.scalar(statement) or 0)


def _safe_filename(filename: str) -> str:
    safe = "".join(character if character.isalnum() or character in {".", "-", "_"} else "_" for character in filename)
    return safe[:120] or "upload"


def _replace_document_blocks(
    db: Session,
    document: Document,
    parsed: ParsedTranscript,
) -> list[TranscriptBlockRecord]:
    existing = list(
        db.scalars(
            select(TranscriptBlockRecord)
            .where(TranscriptBlockRecord.document_id == document.id)
            .order_by(TranscriptBlockRecord.block_index)
        ).all()
    )
    by_index = {value.block_index: value for value in existing}
    retained_indexes: set[int] = set()
    values: list[TranscriptBlockRecord] = []

    for block in parsed.blocks:
        retained_indexes.add(block.block_index)
        value = by_index.get(block.block_index)
        if value is None:
            value = TranscriptBlockRecord(
                id=str(uuid4()),
                document_id=document.id,
                block_index=block.block_index,
                text=block.text,
                start_char=block.start_char,
                end_char=block.end_char,
                parser_name=parsed.parser_name,
                parser_version=parsed.parser_version,
            )
        value.kind = "speech"
        value.speaker = block.speaker
        value.location = block.location
        value.text = block.text
        value.start_char = block.start_char
        value.end_char = block.end_char
        value.start_ms = block.start_ms
        value.end_ms = block.end_ms
        value.parser_name = parsed.parser_name
        value.parser_version = parsed.parser_version
        value.source_metadata = block.source_metadata
        db.add(value)
        values.append(value)

    for value in existing:
        if value.block_index not in retained_indexes:
            db.delete(value)

    db.flush()
    return values


def _replace_document_chunks(
    db: Session,
    document: Document,
    parsed: ParsedTranscript,
    blocks: list[TranscriptBlockRecord],
) -> None:
    db.execute(delete(Chunk).where(Chunk.document_id == document.id))
    if blocks:
        for chunk_index, block in enumerate(blocks):
            db.add(
                Chunk(
                    document_id=document.id,
                    project_id=document.project_id,
                    text=block.text,
                    embedding=embed_text(block.text),
                    chunk_index=chunk_index,
                    start_char=block.start_char,
                    end_char=block.end_char,
                    extra_metadata={
                        "source": "structured_transcript",
                        "block_id": block.id,
                        "speaker": block.speaker,
                        "timestamp": block.location,
                        "start_ms": block.start_ms,
                        "end_ms": block.end_ms,
                    },
                )
            )
        return

    for text_chunk in chunk_text(parsed.content):
        db.add(
            Chunk(
                document_id=document.id,
                project_id=document.project_id,
                text=text_chunk.text,
                embedding=embed_text(text_chunk.text),
                chunk_index=text_chunk.chunk_index,
                start_char=text_chunk.start_char,
                end_char=text_chunk.end_char,
                extra_metadata={"source": "document_processing"},
            )
        )
