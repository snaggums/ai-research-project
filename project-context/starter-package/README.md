# Qual AI Workspace Starter Package

A Codex-ready starter specification for an MVP AI-assisted qualitative research workspace.

## Product Summary

Qual AI Workspace is an AI-powered qualitative analysis workspace focused on one core job:

> Upload research transcripts → AI extracts evidence-backed themes → User reviews and edits themes → User asks questions about the research.

This MVP intentionally excludes authentication, participant management, video/audio processing, highlight reels, complex repositories, real-time collaboration, and enterprise permissions.

## Starter Package Contents

- `docs/PROJECT_SPEC.md` — Product vision, MVP scope, core flows, and feature boundaries.
- `docs/ARCHITECTURE.md` — Technical architecture and vertical slices.
- `docs/DATABASE_SCHEMA.md` — PostgreSQL, SQLAlchemy, pgvector-oriented data model.
- `docs/API_SPEC.md` — REST API endpoint design.
- `docs/RAG_PIPELINE.md` — Document chunking, embeddings, retrieval, citations, and chat flow.
- `docs/AI_PROMPTS.md` — Prompt templates for theme extraction, evidence selection, chat, and exports.
- `docs/FRONTEND_SPEC.md` — React/Vite UI structure, routes, components, and state management.
- `docs/BACKEND_SPEC.md` — FastAPI backend structure, services, workers, and parsing.
- `docs/EXPORT_SPEC.md` — Markdown, CSV, JSON, and later PDF/DOCX export expectations.
- `docs/ROADMAP.md` — MVP phases and post-MVP roadmap.
- `backlog/GITHUB_ISSUES.md` — Implementation backlog written as GitHub-style issues.
- `prompts/codex/` — Incremental Codex implementation prompts.
- `prompts/ai/` — Application prompt templates.

## Recommended Implementation Approach

Build vertically rather than horizontally:

1. Project CRUD
2. Document upload and parsing
3. Chunking and embeddings
4. Evidence-aware theme generation
5. Theme review/edit workflow
6. RAG chat with citations
7. Export findings

## Tech Stack

### Frontend
- React
- Vite
- TailwindCSS
- TanStack Query
- React Router
- Zustand
- shadcn/ui
- TipTap

### Backend
- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL
- pgvector
- LiteLLM
- Pydantic v2
- FastAPI Background Tasks initially; Celery later if needed

### Storage
- PostgreSQL for structured data and embeddings
- Local filesystem for uploaded files
- No S3 in MVP

## MVP Principle

Every AI-generated finding must be reviewable and traceable to transcript evidence.
