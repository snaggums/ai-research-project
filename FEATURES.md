# Feature Log

This file tracks planned and completed features for the hackathon build.

## Completed

- [x] Project context and temporary GitHub repo - done
- [x] Sprint 1 Project CRUD vertical slice - done
- [x] Sprint 2 Document upload and text extraction - done
- [x] Sprint 3 Chunking, mock embeddings, and search - done
- [x] Sprint 4 AI provider settings - done
- [x] Sprint 5 Evidence-aware theme generation - done
- [x] Sprint 6 Session-only RAG chat with citations - done

## Sprint 1 Details

- [x] Docker Compose Postgres service - done
- [x] FastAPI backend scaffold - done
- [x] SQLAlchemy 2 database setup - done
- [x] Alembic migration for `projects` - done
- [x] Project CRUD API - done
- [x] React/Vite frontend scaffold - done
- [x] TailwindCSS and shadcn-compatible UI foundation - done
- [x] Project list/create/edit/delete UI - done

## Sprint 2 Details

- [x] Document model and migration - done
- [x] Project document upload endpoint - done
- [x] Document list/detail/retry/delete endpoints - done
- [x] Local file storage under `storage/uploads/` - done
- [x] Text extraction for `.txt`, `.md`, `.docx`, and `.pdf` - done
- [x] Per-project upload UI - done
- [x] Document status display - done
- [x] Extracted text preview - done
- [x] Synthetic transcript fixture - done

## Sprint 3 Details

- [x] Chunk model and migration - done
- [x] pgvector extension setup - done
- [x] Text chunking during document processing - done
- [x] Deterministic local mock embeddings - done
- [x] Project search API - done
- [x] Project search UI - done
- [x] Search smoke test with synthetic transcript - done

## Sprint 4 Details

- [x] AI settings model and migration - done
- [x] AI settings API - done
- [x] Provider/model/base URL metadata storage - done
- [x] Environment-variable key status check - done
- [x] No raw API key persistence - done
- [x] AI settings UI panel - done
- [x] AI settings API smoke test - done

## Sprint 5 Details

- [x] Theme model and migration - done
- [x] Evidence model and migration - done
- [x] Theme generation service with LiteLLM live-provider path - done
- [x] Deterministic mock theme generation fallback - done
- [x] Structured JSON validation for generated themes - done
- [x] Theme and evidence CRUD API - done
- [x] Per-project theme generation UI - done
- [x] Theme cards and evidence cards - done
- [x] Theme editing - done
- [x] Evidence edit/delete controls - done
- [x] Sprint 5 backend/frontend smoke tests - done

## Sprint 6 Details

- [x] Project chat API endpoint - done
- [x] Retrieval from existing project chunk search - done
- [x] Mock RAG answer path - done
- [x] LiteLLM live-provider chat path - done
- [x] Citation payloads for retrieved chunks - done
- [x] Per-project chat UI panel - done
- [x] Suggested questions - done
- [x] Session-only message history - done
- [x] Sprint 6 backend/frontend smoke tests - done

## Planned MVP

- [x] Evidence-aware theme generation - done
- [x] Theme review and editing - done
- [x] RAG chat with citations - done
- [ ] Markdown, CSV, and JSON exports - planned

## Notes

Sprint 6 intentionally keeps chat history session-only and excludes real embedding providers and exports.
