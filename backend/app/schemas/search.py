from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    limit: int = 10


class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    chunk_index: int
    text: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]
