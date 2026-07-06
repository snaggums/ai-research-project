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
