from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    id: str
    project_id: str
    filename: str
    mime_type: str | None
    status: str
    error_message: str | None
    uploaded_at: datetime
    processed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class DocumentDetail(DocumentRead):
    content: str | None


class TranscriptBlock(BaseModel):
    id: str
    speaker: str
    location: str
    text: str


class TranscriptDocumentRead(BaseModel):
    id: str
    project_id: str
    session_id: str
    filename: str
    mime_type: str | None
    size_bytes: int | None
    status: str
    is_primary: bool
    uploaded_at: datetime
    processed_at: datetime | None
    error_message: str | None
    blocks: list[TranscriptBlock]
    source_url: str | None
    download_url: str | None


class TranscriptSearchResult(BaseModel):
    id: str
    document_id: str
    speaker: str
    location: str
    excerpt: str
    relevance: float
    block_index: int


class TranscriptSearchResponse(BaseModel):
    query: str
    results: list[TranscriptSearchResult]


class TranscriptContext(BaseModel):
    document: TranscriptDocumentRead
    result: TranscriptSearchResult
    passages: list[TranscriptBlock]
    focused_passage_id: str
