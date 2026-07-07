from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ThemeEvidenceBase(BaseModel):
    document_id: str
    chunk_id: str
    quote: str = Field(min_length=1)
    reasoning: str = Field(min_length=1)
    relevance_score: float = Field(default=0.7, ge=0, le=1)
    evidence_type: str = Field(default="supporting", min_length=1, max_length=80)


class ThemeEvidenceCreate(ThemeEvidenceBase):
    pass


class ThemeEvidenceUpdate(BaseModel):
    quote: str | None = Field(default=None, min_length=1)
    reasoning: str | None = Field(default=None, min_length=1)
    relevance_score: float | None = Field(default=None, ge=0, le=1)
    evidence_type: str | None = Field(default=None, min_length=1, max_length=80)


class ThemeEvidenceRead(ThemeEvidenceBase):
    id: str
    theme_id: str
    document_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ThemeBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1)
    confidence: float = Field(default=0.7, ge=0, le=1)
    user_notes: str | None = None


class ThemeCreate(ThemeBase):
    evidence: list[ThemeEvidenceCreate] = Field(default_factory=list)


class ThemeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, min_length=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    user_notes: str | None = None


class ThemeRead(ThemeBase):
    id: str
    project_id: str
    evidence_count: int
    created_by: str
    model: str | None
    created_at: datetime
    updated_at: datetime
    evidence: list[ThemeEvidenceRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ThemeGenerateRequest(BaseModel):
    max_themes: int = Field(default=5, ge=1, le=8)
    replace_existing: bool = True


class ThemeGenerateResponse(BaseModel):
    themes: list[ThemeRead]
    provider: str
    model: str | None
    used_mock: bool
    message: str


class GeneratedEvidence(BaseModel):
    chunk_id: str
    quote: str = Field(min_length=1)
    reasoning: str = Field(min_length=1)
    relevance_score: float = Field(default=0.7, ge=0, le=1)
    evidence_type: str = Field(default="supporting", min_length=1, max_length=80)


class GeneratedTheme(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1)
    confidence: float = Field(default=0.7, ge=0, le=1)
    evidence: list[GeneratedEvidence] = Field(min_length=1)


class GeneratedThemesPayload(BaseModel):
    themes: list[GeneratedTheme] = Field(min_length=1)
