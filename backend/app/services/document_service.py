from datetime import datetime, timezone
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.project import Project
from app.models.research_session import ResearchSession
from app.models.transcript_block import TranscriptBlockRecord
from app.services.chunking_service import chunk_text
from app.services.embedding_service import embed_text
from app.services.parsing_service import ParsedTranscript, SUPPORTED_EXTENSIONS, extract_transcript
from app.services.v1_migration_service import get_or_create_import_session
from fastapi import UploadFile
from sqlalchemy import delete, select
from sqlalchemy.orm import Session


def list_project_documents(db: Session, project_id: str) -> list[Document]:
    statement = select(Document).where(Document.project_id == project_id).order_by(Document.uploaded_at.desc())
    return list(db.scalars(statement).all())


def get_document(db: Session, document_id: str) -> Document | None:
    return db.get(Document, document_id)


def create_uploaded_document(db: Session, project: Project, upload: UploadFile, research_session: ResearchSession | None = None) -> Document:
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
    )
    db.add(document)
    db.flush()
    if owning_session.primary_transcript_document_id is None:
        owning_session.primary_transcript_document_id = document.id
        db.add(owning_session)
    db.commit()
    db.refresh(document)
    return document


def list_session_documents(db: Session, project_id: str, session_id: str) -> list[Document]:
    statement = select(Document).where(Document.project_id == project_id, Document.session_id == session_id).order_by(Document.uploaded_at.desc())
    return list(db.scalars(statement).all())


def get_session_document(db: Session, project_id: str, session_id: str, document_id: str) -> Document | None:
    return db.scalar(select(Document).where(Document.id == document_id, Document.project_id == project_id, Document.session_id == session_id))


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
        except Exception as exc:
            db.rollback()
            document = db.get(Document, document_id)
            if document is None:
                return
            document.status = "failed"
            document.error_message = str(exc)
            document.processed_at = datetime.now(timezone.utc)

        db.add(document)
        db.commit()
    finally:
        db.close()


def delete_document(db: Session, document: Document) -> None:
    file_path = Path(document.file_path)
    db.delete(document)
    db.commit()
    if file_path.exists():
        file_path.unlink()


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
