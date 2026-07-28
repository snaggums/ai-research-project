from app.models.chunk import Chunk
from app.models.document import Document
from app.models.research_session import ResearchSession
from app.models.transcript_block import TranscriptBlockRecord
from app.schemas.document import TranscriptBlock, TranscriptContext, TranscriptDocumentRead, TranscriptSearchResponse, TranscriptSearchResult
from app.services.embedding_service import embed_text
from sqlalchemy import select
from sqlalchemy.orm import Session


def document_to_read(db: Session, document: Document, research_session: ResearchSession) -> TranscriptDocumentRead:
    blocks = _document_blocks(db, document)
    return TranscriptDocumentRead(
        id=document.id,
        project_id=document.project_id,
        session_id=document.session_id,
        filename=document.filename,
        mime_type=document.mime_type,
        size_bytes=document.size_bytes,
        status=document.status,
        lifecycle_status=document.lifecycle_status,
        is_primary=research_session.primary_transcript_document_id == document.id,
        uploaded_at=document.uploaded_at,
        processed_at=document.processed_at,
        error_message=document.error_message,
        blocks=blocks,
        source_url=None,
        download_url=f"/api/projects/{document.project_id}/sessions/{document.session_id}/documents/{document.id}/download",
    )


def search_document(db: Session, document: Document, query: str, limit: int = 10) -> TranscriptSearchResponse:
    clean_query = query.strip()
    if not clean_query:
        return TranscriptSearchResponse(query="", results=[])
    if document.status != "complete":
        raise ValueError("Transcript is not ready")
    distance = Chunk.embedding.cosine_distance(embed_text(clean_query))
    statement = select(Chunk, distance.label("distance")).where(Chunk.document_id == document.id).order_by(distance).limit(max(1, min(limit, 25)))
    results = [_search_result(chunk, float(raw_distance or 0)) for chunk, raw_distance in db.execute(statement).all()]
    return TranscriptSearchResponse(query=clean_query, results=results)


def get_context(db: Session, document: Document, research_session: ResearchSession, result_id: str) -> TranscriptContext | None:
    chunks = list(db.scalars(select(Chunk).where(Chunk.document_id == document.id).order_by(Chunk.chunk_index)).all())
    focused = next((chunk for chunk in chunks if chunk.id == result_id), None)
    if focused is None:
        return None
    result = _search_result(focused, 0.0)
    blocks = _document_blocks(db, document, chunks)
    focused_passage_id = str((focused.extra_metadata or {}).get("block_id") or focused.id)
    return TranscriptContext(
        document=document_to_read(db, document, research_session),
        result=result,
        passages=blocks,
        focused_passage_id=focused_passage_id,
    )


def _document_blocks(
    db: Session,
    document: Document,
    chunks: list[Chunk] | None = None,
) -> list[TranscriptBlock]:
    stored = list(
        db.scalars(
            select(TranscriptBlockRecord)
            .where(TranscriptBlockRecord.document_id == document.id)
            .order_by(TranscriptBlockRecord.block_index)
        ).all()
    )
    if stored:
        return [
            TranscriptBlock(
                id=value.id,
                speaker=value.speaker or "Transcript",
                location=value.location or f"Passage {value.block_index + 1}",
                text=value.text,
            )
            for value in stored
        ]
    values = chunks
    if values is None:
        values = list(
            db.scalars(
                select(Chunk).where(Chunk.document_id == document.id).order_by(Chunk.chunk_index)
            ).all()
        )
    return [_block(chunk) for chunk in values]


def _block(chunk: Chunk) -> TranscriptBlock:
    metadata = chunk.extra_metadata or {}
    speaker, text = _speaker_and_text(chunk.text)
    speaker = str(metadata.get("speaker") or speaker)
    location = str(metadata.get("timestamp") or f"Excerpt {chunk.chunk_index + 1}")
    return TranscriptBlock(
        id=str(metadata.get("block_id") or chunk.id),
        speaker=speaker,
        location=location,
        text=chunk.text if metadata.get("speaker") else text,
    )


def _search_result(chunk: Chunk, distance: float) -> TranscriptSearchResult:
    metadata = chunk.extra_metadata or {}
    speaker, text = _speaker_and_text(chunk.text)
    speaker = str(metadata.get("speaker") or speaker)
    if metadata.get("speaker"):
        text = chunk.text
    return TranscriptSearchResult(
        id=chunk.id,
        document_id=chunk.document_id,
        speaker=speaker,
        location=str(metadata.get("timestamp") or f"Excerpt {chunk.chunk_index + 1}"),
        excerpt=text,
        relevance=round(max(0.0, min(1.0, 1.0 - distance)), 2),
        block_index=chunk.chunk_index,
    )


def _speaker_and_text(text: str) -> tuple[str, str]:
    first_line, separator, remainder = text.partition("\n")
    if separator and ":" in first_line and len(first_line) <= 120:
        speaker, _, opening = first_line.partition(":")
        combined = " ".join(value for value in (opening.strip(), remainder.strip()) if value)
        return speaker.strip(), combined
    return "Transcript", text.strip()
