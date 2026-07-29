from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    limit: int = Field(default=6, ge=1, le=12)


class ChatCitation(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    session_id: str
    session_title: str
    speaker: str
    location: str
    context_result_id: str
    chunk_index: int
    text: str
    score: float


class ChatResponse(BaseModel):
    question: str
    answer: str
    citations: list[ChatCitation]
    provider: str
    model: str | None
    used_mock: bool
    message: str
