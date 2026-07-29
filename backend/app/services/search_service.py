from app.models.chunk import Chunk
from app.models.document import Document
from app.models.research_session import ResearchSession
from app.schemas.search import SearchResult
from app.services.embedding_service import embed_text
from sqlalchemy import select
from sqlalchemy.orm import Session


def search_project_chunks(db: Session, project_id: str, query: str, limit: int = 10) -> list[SearchResult]:
    clean_query = query.strip()
    if not clean_query:
        return []

    query_embedding = embed_text(clean_query)
    distance = Chunk.embedding.cosine_distance(query_embedding)
    statement = (
        select(Chunk, Document, ResearchSession, distance.label("distance"))
        .join(Document, Document.id == Chunk.document_id)
        .join(ResearchSession, ResearchSession.id == Document.session_id)
        .where(Chunk.project_id == project_id)
        .order_by(distance)
        .limit(max(1, min(limit, 25)))
    )

    results: list[SearchResult] = []
    for chunk, document, research_session, raw_distance in db.execute(statement).all():
        distance_value = float(raw_distance or 0)
        metadata = chunk.extra_metadata or {}
        speaker, excerpt = _speaker_and_text(chunk.text)
        results.append(
            SearchResult(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_name=document.filename,
                session_id=research_session.id,
                session_title=research_session.title,
                speaker=str(metadata.get("speaker") or speaker),
                location=str(
                    metadata.get("timestamp")
                    or f"Excerpt {chunk.chunk_index + 1}"
                ),
                context_result_id=chunk.id,
                chunk_index=chunk.chunk_index,
                text=chunk.text if metadata.get("speaker") else excerpt,
                score=max(0.0, 1.0 - distance_value),
            )
        )

    return results


def _speaker_and_text(text: str) -> tuple[str, str]:
    first_line, separator, remainder = text.partition("\n")
    if separator and ":" in first_line and len(first_line) <= 120:
        speaker, _, opening = first_line.partition(":")
        combined = " ".join(
            value for value in (opening.strip(), remainder.strip()) if value
        )
        return speaker.strip(), combined
    return "Transcript", text.strip()
