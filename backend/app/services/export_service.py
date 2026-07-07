import csv
import json
from io import StringIO

from app.models.document import Document
from app.models.project import Project
from app.models.theme import Theme
from app.models.theme_evidence import ThemeEvidence
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload


def get_project_for_export(db: Session, project_id: str) -> Project | None:
    statement = (
        select(Project)
        .options(
            selectinload(Project.documents),
            selectinload(Project.themes)
            .selectinload(Theme.evidence)
            .selectinload(ThemeEvidence.document),
        )
        .where(Project.id == project_id)
    )
    return db.scalar(statement)


def build_markdown_export(project: Project) -> str:
    lines = [
        "# Project Findings Report",
        "",
        "## Project Summary",
        "",
        f"**Project:** {project.name}",
        "",
        project.description or "No project description provided.",
        "",
        f"**Documents:** {len(project.documents)}",
        f"**Themes:** {len(project.themes)}",
        "",
        "## Key Themes",
        "",
    ]

    if not project.themes:
        lines.extend(["No themes have been generated yet.", ""])
    for index, theme in enumerate(project.themes, start=1):
        supporting = [evidence for evidence in theme.evidence if evidence.evidence_type.lower() != "contradictory"]
        contradictory = [evidence for evidence in theme.evidence if evidence.evidence_type.lower() == "contradictory"]
        lines.extend(
            [
                f"### Theme {index}: {theme.title}",
                "",
                theme.description,
                "",
                f"**Confidence:** {_format_score(theme.confidence)}",
                f"**Evidence count:** {theme.evidence_count}",
                "",
                "#### Supporting Evidence",
                "",
            ]
        )
        lines.extend(_evidence_markdown(supporting) or ["No supporting evidence recorded."])
        lines.extend(["", "#### Contradictory Evidence", ""])
        lines.extend(_evidence_markdown(contradictory) or ["No contradictory evidence recorded."])
        lines.append("")

    lines.extend(
        [
            "## Suggested Next Steps",
            "",
            "- Review low-confidence themes and weak evidence.",
            "- Remove or revise any evidence that does not directly support a theme.",
            "- Use the cited chunks to draft a stakeholder-ready findings summary.",
            "",
        ]
    )
    return "\n".join(lines)


def build_csv_export(project: Project) -> str:
    buffer = StringIO()
    fieldnames = [
        "project_name",
        "theme_title",
        "theme_description",
        "theme_confidence",
        "evidence_type",
        "quote",
        "reasoning",
        "relevance_score",
        "document_name",
        "chunk_id",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    for theme in project.themes:
        for evidence in theme.evidence:
            writer.writerow(
                {
                    "project_name": project.name,
                    "theme_title": theme.title,
                    "theme_description": theme.description,
                    "theme_confidence": _format_score(theme.confidence),
                    "evidence_type": evidence.evidence_type,
                    "quote": evidence.quote,
                    "reasoning": evidence.reasoning,
                    "relevance_score": _format_score(evidence.relevance_score),
                    "document_name": evidence.document.filename if evidence.document else "",
                    "chunk_id": evidence.chunk_id,
                }
            )
    return buffer.getvalue()


def build_json_export(project: Project) -> str:
    payload = {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat(),
        },
        "documents": [_document_payload(document) for document in project.documents],
        "themes": [_theme_payload(theme) for theme in project.themes],
    }
    return json.dumps(payload, indent=2)


def filename_for_project(project: Project, extension: str) -> str:
    slug = "".join(character.lower() if character.isalnum() else "-" for character in project.name).strip("-")
    clean_slug = "-".join(part for part in slug.split("-") if part) or "project"
    return f"{clean_slug}-findings.{extension}"


def _theme_payload(theme: Theme) -> dict:
    return {
        "id": theme.id,
        "title": theme.title,
        "description": theme.description,
        "confidence": round(theme.confidence, 2),
        "evidence_count": theme.evidence_count,
        "created_by": theme.created_by,
        "model": theme.model,
        "user_notes": theme.user_notes,
        "created_at": theme.created_at.isoformat(),
        "updated_at": theme.updated_at.isoformat(),
        "evidence": [_evidence_payload(evidence) for evidence in theme.evidence],
    }


def _evidence_payload(evidence: ThemeEvidence) -> dict:
    return {
        "id": evidence.id,
        "document_id": evidence.document_id,
        "document_name": evidence.document.filename if evidence.document else None,
        "chunk_id": evidence.chunk_id,
        "quote": evidence.quote,
        "reasoning": evidence.reasoning,
        "relevance_score": round(evidence.relevance_score, 2),
        "evidence_type": evidence.evidence_type,
        "created_at": evidence.created_at.isoformat(),
    }


def _document_payload(document: Document) -> dict:
    return {
        "id": document.id,
        "filename": document.filename,
        "mime_type": document.mime_type,
        "status": document.status,
        "uploaded_at": document.uploaded_at.isoformat(),
        "processed_at": document.processed_at.isoformat() if document.processed_at else None,
    }


def _evidence_markdown(evidence_items: list[ThemeEvidence]) -> list[str]:
    return [
        f"- \"{evidence.quote}\" - {evidence.document.filename if evidence.document else 'Unknown document'}\n"
        f"  - {evidence.reasoning}"
        for evidence in evidence_items
    ]


def _format_score(value: float) -> str:
    return f"{value:.2f}"
