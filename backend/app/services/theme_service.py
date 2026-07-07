import json
from datetime import datetime, timezone

from app.core.config import settings as app_settings
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.settings import AISettings
from app.models.theme import Theme
from app.models.theme_evidence import ThemeEvidence
from app.schemas.theme import (
    GeneratedEvidence,
    GeneratedTheme,
    GeneratedThemesPayload,
    ThemeCreate,
    ThemeEvidenceCreate,
    ThemeEvidenceRead,
    ThemeEvidenceUpdate,
    ThemeRead,
    ThemeUpdate,
)
from app.services import ai_settings_service
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload


def list_project_themes(db: Session, project_id: str) -> list[ThemeRead]:
    statement = (
        select(Theme)
        .options(selectinload(Theme.evidence).selectinload(ThemeEvidence.document))
        .where(Theme.project_id == project_id)
        .order_by(Theme.created_at.desc())
    )
    return [theme_to_read(theme) for theme in db.scalars(statement).all()]


def get_theme(db: Session, theme_id: str) -> Theme | None:
    statement = (
        select(Theme)
        .options(selectinload(Theme.evidence).selectinload(ThemeEvidence.document))
        .where(Theme.id == theme_id)
    )
    return db.scalar(statement)


def create_theme(db: Session, project_id: str, payload: ThemeCreate, created_by: str = "user") -> ThemeRead:
    theme = Theme(
        project_id=project_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        confidence=payload.confidence,
        user_notes=payload.user_notes.strip() if payload.user_notes else None,
        created_by=created_by,
    )
    db.add(theme)
    db.flush()
    for evidence_payload in payload.evidence:
        _add_evidence_model(db, theme.id, evidence_payload, project_id=project_id)
    _refresh_evidence_count(db, theme)
    db.commit()
    return theme_to_read(get_theme(db, theme.id) or theme)


def update_theme(db: Session, theme: Theme, payload: ThemeUpdate) -> ThemeRead:
    if payload.title is not None:
        theme.title = payload.title.strip()
    if payload.description is not None:
        theme.description = payload.description.strip()
    if payload.confidence is not None:
        theme.confidence = payload.confidence
    if payload.user_notes is not None:
        theme.user_notes = payload.user_notes.strip() or None
    theme.updated_at = datetime.now(timezone.utc)
    db.add(theme)
    db.commit()
    return theme_to_read(get_theme(db, theme.id) or theme)


def delete_theme(db: Session, theme: Theme) -> None:
    db.delete(theme)
    db.commit()


def list_theme_evidence(db: Session, theme_id: str) -> list[ThemeEvidenceRead]:
    statement = (
        select(ThemeEvidence)
        .options(selectinload(ThemeEvidence.document))
        .where(ThemeEvidence.theme_id == theme_id)
        .order_by(ThemeEvidence.created_at)
    )
    return [_evidence_to_read(evidence) for evidence in db.scalars(statement).all()]


def add_theme_evidence(db: Session, theme: Theme, payload: ThemeEvidenceCreate) -> ThemeEvidenceRead:
    evidence = _add_evidence_model(db, theme.id, payload, project_id=theme.project_id)
    _refresh_evidence_count(db, theme)
    db.commit()
    db.refresh(evidence)
    return _evidence_to_read(evidence)


def get_evidence(db: Session, evidence_id: str) -> ThemeEvidence | None:
    statement = (
        select(ThemeEvidence)
        .options(selectinload(ThemeEvidence.theme), selectinload(ThemeEvidence.document))
        .where(ThemeEvidence.id == evidence_id)
    )
    return db.scalar(statement)


def update_evidence(db: Session, evidence: ThemeEvidence, payload: ThemeEvidenceUpdate) -> ThemeEvidenceRead:
    if payload.quote is not None:
        evidence.quote = payload.quote.strip()
    if payload.reasoning is not None:
        evidence.reasoning = payload.reasoning.strip()
    if payload.relevance_score is not None:
        evidence.relevance_score = payload.relevance_score
    if payload.evidence_type is not None:
        evidence.evidence_type = payload.evidence_type.strip()
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return _evidence_to_read(evidence)


def delete_evidence(db: Session, evidence: ThemeEvidence) -> None:
    theme = evidence.theme
    db.delete(evidence)
    if theme is not None:
        _refresh_evidence_count(db, theme)
    db.commit()


def generate_project_themes(
    db: Session,
    project_id: str,
    max_themes: int = 5,
    replace_existing: bool = True,
) -> tuple[list[ThemeRead], str, str | None, bool, str]:
    chunks = _get_project_chunks(db, project_id)
    if not chunks:
        raise ValueError("Upload and process at least one document before generating themes.")

    settings = ai_settings_service.get_or_create_settings(db)
    provider = settings.provider
    used_mock = _should_use_mock(settings)
    generated = _generate_mock_themes(chunks, max_themes) if used_mock else _generate_with_litellm(settings, chunks, max_themes)

    if replace_existing:
        db.execute(delete(Theme).where(Theme.project_id == project_id))
        db.flush()

    chunk_map = {chunk.id: (chunk, document_name) for chunk, document_name in chunks}
    saved: list[ThemeRead] = []
    for generated_theme in generated.themes[:max_themes]:
        evidence_payloads = _validated_evidence(generated_theme.evidence, chunk_map)
        if not evidence_payloads:
            continue
        theme = Theme(
            project_id=project_id,
            title=generated_theme.title.strip(),
            description=generated_theme.description.strip(),
            confidence=generated_theme.confidence,
            created_by="mock" if used_mock else provider,
            model=settings.model,
        )
        db.add(theme)
        db.flush()
        for evidence_payload in evidence_payloads:
            _add_evidence_model(db, theme.id, evidence_payload, project_id=project_id)
        _refresh_evidence_count(db, theme)
        saved.append(theme_to_read(theme))

    db.commit()
    themes = list_project_themes(db, project_id)
    message = "Generated themes with local mock analysis." if used_mock else f"Generated themes with {provider}."
    return themes, provider, settings.model, used_mock, message


def _get_project_chunks(db: Session, project_id: str) -> list[tuple[Chunk, str]]:
    statement = (
        select(Chunk, Document.filename)
        .join(Document, Document.id == Chunk.document_id)
        .where(Chunk.project_id == project_id)
        .order_by(Chunk.created_at, Chunk.chunk_index)
        .limit(40)
    )
    return [(chunk, filename) for chunk, filename in db.execute(statement).all()]


def _should_use_mock(settings: AISettings) -> bool:
    provider = settings.provider.strip().lower()
    return provider == "mock" or not settings.has_api_key


def _generate_mock_themes(chunks: list[tuple[Chunk, str]], max_themes: int) -> GeneratedThemesPayload:
    buckets = [
        ("Navigation and wayfinding friction", ["navigation", "find", "where", "confusing", "dashboard", "menu"]),
        ("Trust and confidence signals", ["trust", "confidence", "unsure", "verify", "proof", "evidence"]),
        ("Workflow speed and handoff needs", ["slow", "time", "handoff", "workflow", "export", "share"]),
        ("Learning curve and onboarding", ["learn", "onboard", "training", "first", "start", "help"]),
        ("Reporting and synthesis needs", ["theme", "summary", "report", "insight", "quote", "finding"]),
    ]
    lower_chunks = [(chunk, filename, chunk.text.lower()) for chunk, filename in chunks]
    themes: list[GeneratedTheme] = []

    for title, keywords in buckets:
        matches = [
            (chunk, filename)
            for chunk, filename, lowered in lower_chunks
            if any(keyword in lowered for keyword in keywords)
        ]
        if not matches:
            continue
        evidence = [
            GeneratedEvidence(
                chunk_id=chunk.id,
                quote=_excerpt(chunk.text),
                reasoning=f"This excerpt mentions {title.lower()} in {filename}.",
                relevance_score=0.76,
                evidence_type="supporting",
            )
            for chunk, filename in matches[:3]
        ]
        themes.append(
            GeneratedTheme(
                title=title,
                description=f"Participants appear to share a pattern around {title.lower()}.",
                confidence=min(0.92, 0.58 + (len(evidence) * 0.1)),
                evidence=evidence,
            )
        )
        if len(themes) >= max_themes:
            break

    if not themes:
        chunk, filename = chunks[0]
        themes.append(
            GeneratedTheme(
                title="Emerging participant pattern",
                description="The uploaded material contains an early pattern that needs researcher review.",
                confidence=0.55,
                evidence=[
                    GeneratedEvidence(
                        chunk_id=chunk.id,
                        quote=_excerpt(chunk.text),
                        reasoning=f"This excerpt from {filename} is the strongest available starting evidence.",
                        relevance_score=0.62,
                        evidence_type="supporting",
                    )
                ],
            )
        )

    return GeneratedThemesPayload(themes=themes)


def _generate_with_litellm(settings: AISettings, chunks: list[tuple[Chunk, str]], max_themes: int) -> GeneratedThemesPayload:
    try:
        from litellm import completion
    except ImportError as exc:
        raise ValueError("Install backend requirements before using live AI theme generation.") from exc

    context = [
        {
            "chunk_id": chunk.id,
            "document_name": filename,
            "chunk_index": chunk.chunk_index,
            "text": chunk.text[:1800],
        }
        for chunk, filename in chunks
    ]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a UX research synthesis assistant. Generate concise research themes only from the provided "
                "chunks. Every theme must include supporting evidence that references existing chunk_id values."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Generate up to {max_themes} themes as JSON with this shape: "
                '{"themes":[{"title":"...","description":"...","confidence":0.0,'
                '"evidence":[{"chunk_id":"...","quote":"...","reasoning":"...",'
                '"relevance_score":0.0,"evidence_type":"supporting"}]}]}. '
                "Use short verbatim quotes from the chunks. Chunks: "
                f"{json.dumps(context)}"
            ),
        },
    ]
    response = completion(
        model=settings.model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.2,
        api_key=_api_key_for_provider(settings.provider),
        api_base=settings.base_url,
    )
    raw = response.choices[0].message.content
    try:
        return GeneratedThemesPayload.model_validate_json(raw)
    except (ValidationError, ValueError) as exc:
        raise ValueError("The AI provider did not return valid theme JSON. Try again or switch to mock provider.") from exc


def _api_key_for_provider(provider: str) -> str | None:
    normalized = provider.strip().lower().replace(" ", "_")
    return {
        "openai": app_settings.openai_api_key,
        "anthropic": app_settings.anthropic_api_key,
        "gemini": app_settings.gemini_api_key,
        "openrouter": app_settings.openrouter_api_key,
        "azure": app_settings.azure_openai_api_key,
        "azure_openai": app_settings.azure_openai_api_key,
    }.get(normalized)


def _validated_evidence(
    generated_evidence: list[GeneratedEvidence],
    chunk_map: dict[str, tuple[Chunk, str]],
) -> list[ThemeEvidenceCreate]:
    payloads: list[ThemeEvidenceCreate] = []
    seen_chunk_ids: set[str] = set()
    for evidence in generated_evidence:
        match = chunk_map.get(evidence.chunk_id)
        if match is None or evidence.chunk_id in seen_chunk_ids:
            continue
        chunk, _filename = match
        quote = evidence.quote.strip()
        if quote.lower() not in chunk.text.lower():
            quote = _excerpt(chunk.text)
        payloads.append(
            ThemeEvidenceCreate(
                document_id=chunk.document_id,
                chunk_id=chunk.id,
                quote=quote,
                reasoning=evidence.reasoning.strip(),
                relevance_score=evidence.relevance_score,
                evidence_type=evidence.evidence_type.strip(),
            )
        )
        seen_chunk_ids.add(evidence.chunk_id)
    return payloads


def _add_evidence_model(
    db: Session,
    theme_id: str,
    payload: ThemeEvidenceCreate,
    project_id: str | None = None,
) -> ThemeEvidence:
    if project_id is not None:
        chunk = db.scalar(
            select(Chunk).where(
                Chunk.id == payload.chunk_id,
                Chunk.document_id == payload.document_id,
                Chunk.project_id == project_id,
            )
        )
        if chunk is None:
            raise ValueError("Evidence must reference a chunk from this project.")
    evidence = ThemeEvidence(
        theme_id=theme_id,
        document_id=payload.document_id,
        chunk_id=payload.chunk_id,
        quote=payload.quote.strip(),
        reasoning=payload.reasoning.strip(),
        relevance_score=payload.relevance_score,
        evidence_type=payload.evidence_type.strip(),
    )
    db.add(evidence)
    return evidence


def _refresh_evidence_count(db: Session, theme: Theme) -> None:
    db.flush()
    count = len(list_theme_evidence(db, theme.id))
    theme.evidence_count = count
    theme.updated_at = datetime.now(timezone.utc)
    db.add(theme)


def theme_to_read(theme: Theme) -> ThemeRead:
    return ThemeRead(
        id=theme.id,
        project_id=theme.project_id,
        title=theme.title,
        description=theme.description,
        confidence=theme.confidence,
        user_notes=theme.user_notes,
        evidence_count=theme.evidence_count,
        created_by=theme.created_by,
        model=theme.model,
        created_at=theme.created_at,
        updated_at=theme.updated_at,
        evidence=[_evidence_to_read(evidence) for evidence in theme.evidence],
    )


def _evidence_to_read(evidence: ThemeEvidence) -> ThemeEvidenceRead:
    return ThemeEvidenceRead(
        id=evidence.id,
        theme_id=evidence.theme_id,
        document_id=evidence.document_id,
        chunk_id=evidence.chunk_id,
        quote=evidence.quote,
        reasoning=evidence.reasoning,
        relevance_score=evidence.relevance_score,
        evidence_type=evidence.evidence_type,
        document_name=evidence.document.filename if evidence.document else None,
        created_at=evidence.created_at,
    )


def _excerpt(text: str, max_length: int = 320) -> str:
    clean = " ".join(text.split())
    if len(clean) <= max_length:
        return clean
    return f"{clean[: max_length - 3].rstrip()}..."
