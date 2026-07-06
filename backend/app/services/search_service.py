from app.models.chunk import Chunk
from app.models.document import Document
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
        select(Chunk, Document.filename, distance.label("distance"))
        .join(Document, Document.id == Chunk.document_id)
        .where(Chunk.project_id == project_id)
        .order_by(distance)
        .limit(max(1, min(limit, 25)))
    )

    results: list[SearchResult] = []
    for chunk, filename, raw_distance in db.execute(statement).all():
        distance_value = float(raw_distance or 0)
        results.append(
            SearchResult(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_name=filename,
                chunk_index=chunk.chunk_index,
                text=chunk.text,
                score=max(0.0, 1.0 - distance_value),
            )
        )

    return results
