# Codex Prompt: Evidence-Aware Themes

Implement evidence-aware AI theme generation.

Backend requirements:

- Theme model
- Evidence model
- Alembic migration
- Theme generation service using LiteLLM
- Structured JSON output validation with Pydantic
- Routes:
  - GET /api/projects/{project_id}/themes
  - POST /api/projects/{project_id}/themes/generate
  - POST /api/projects/{project_id}/themes
  - GET /api/themes/{theme_id}
  - PATCH /api/themes/{theme_id}
  - DELETE /api/themes/{theme_id}
  - GET /api/themes/{theme_id}/evidence
  - POST /api/themes/{theme_id}/evidence
  - PATCH /api/evidence/{evidence_id}
  - DELETE /api/evidence/{evidence_id}

Frontend requirements:

- Themes page
- Generate themes button
- Theme cards
- Theme detail page
- Evidence cards
- Theme editing
- Evidence delete/edit

Theme fields:

- title
- description
- confidence
- evidence_count
- created_by
- user_notes

Evidence fields:

- quote
- reasoning
- relevance_score
- evidence_type
- document_id
- chunk_id

Acceptance criteria:

- AI generates themes with supporting evidence.
- User can inspect and edit themes.
- User can remove bad evidence.
