# Feature Log

This file tracks planned and completed features for the hackathon build.

## Completed

- [x] Project context and temporary GitHub repo - done
- [x] Sprint 1 Project CRUD vertical slice - done
- [x] Sprint 2 Document upload and text extraction - done
- [x] Sprint 3 Chunking, mock embeddings, and search - done
- [x] Sprint 4 AI provider settings - done

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

## Planned MVP

- [ ] Evidence-aware theme generation - planned
- [ ] Theme review and editing - planned
- [ ] RAG chat with citations - planned
- [ ] Markdown, CSV, and JSON exports - planned

## Notes

Sprint 4 intentionally excludes real model calls, real embedding providers, theme generation, RAG chat, and exports.
