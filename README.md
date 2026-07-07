# Sky-AIR

30 Apps in 30 Days: Stephanie and Abigail Team

AI-Assisted UX Research Repository

An MVP AI-assisted qualitative research workspace for uploading research transcripts, generating evidence-backed themes, reviewing findings, asking cited questions, and exporting reports.

The project context from the starter package is stored under `project-context/`. Implementation proceeds in sprint-sized vertical slices.

## Current Status

Sprint 7 completes the initial MVP with Project CRUD, document upload/text extraction, chunking, mock embeddings, local search, AI provider settings, evidence-backed theme generation, session-only RAG chat, and findings exports:

- Docker Compose configuration for PostgreSQL with pgvector image
- FastAPI backend scaffold
- SQLAlchemy 2 database setup
- Alembic migrations for `projects` and `documents`
- Project CRUD REST API
- Document upload, list, detail, retry, and delete API
- Local file storage under `storage/uploads/`
- Text extraction for `.txt`, `.md`, `.docx`, and `.pdf`
- Document chunking after successful text extraction
- Deterministic local mock embeddings stored in pgvector
- Project chunk search endpoint
- AI provider settings API and UI
- Provider metadata storage without raw API key persistence
- Evidence-backed theme and evidence models
- Theme generation API using LiteLLM for live providers and mock generation for local testing
- Theme review, edit, delete, and evidence edit/delete API
- Session-only project chat API with retrieved chunk citations
- Markdown, CSV, and JSON findings export API
- React/Vite frontend scaffold
- TailwindCSS and shadcn-compatible UI foundation
- Project list, create, edit, and delete UI
- Per-project document upload, status, retry/delete actions, and extracted text preview
- Per-project search UI for extracted chunks
- AI settings panel with provider/model/base URL and key environment status
- Per-project theme generation and evidence review UI
- Theme editing and evidence edit/delete controls
- Per-project chat panel with suggested questions and citations
- Per-project export buttons for Markdown, CSV, and JSON

Real embedding providers, persisted chat history, and richer document/presentation exports are intentionally out of scope for Sprint 7.

## Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+

On Windows, Python may be available as `py` rather than `python`.

## Environment

Copy the example files before running locally:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Do not commit real `.env` files or API keys.

Sprint 4 does not store raw API keys. The backend reads optional provider keys from `backend/.env` and only stores provider metadata such as provider, model, base URL, and embedding model.

## Run the Database

```powershell
docker compose up -d postgres
```

## Run Backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Backend health check:

```text
http://localhost:8000/health
```

Project API base:

```text
http://localhost:8000/api/projects
```

Documents API examples:

```text
GET  http://localhost:8000/api/projects/{project_id}/documents
GET  http://localhost:8000/api/documents/{document_id}
POST http://localhost:8000/api/documents/{document_id}/process
```

Search API example:

```text
POST http://localhost:8000/api/projects/{project_id}/search
```

AI settings API examples:

```text
GET  http://localhost:8000/api/settings/ai
PUT  http://localhost:8000/api/settings/ai
POST http://localhost:8000/api/settings/ai/test
```

Themes API examples:

```text
GET    http://localhost:8000/api/projects/{project_id}/themes
POST   http://localhost:8000/api/projects/{project_id}/themes/generate
POST   http://localhost:8000/api/projects/{project_id}/themes
GET    http://localhost:8000/api/themes/{theme_id}
PATCH  http://localhost:8000/api/themes/{theme_id}
DELETE http://localhost:8000/api/themes/{theme_id}
GET    http://localhost:8000/api/themes/{theme_id}/evidence
POST   http://localhost:8000/api/themes/{theme_id}/evidence
PATCH  http://localhost:8000/api/evidence/{evidence_id}
DELETE http://localhost:8000/api/evidence/{evidence_id}
```

Chat API example:

```text
POST http://localhost:8000/api/projects/{project_id}/chat
```

Export API examples:

```text
GET http://localhost:8000/api/projects/{project_id}/exports/markdown
GET http://localhost:8000/api/projects/{project_id}/exports/csv
GET http://localhost:8000/api/projects/{project_id}/exports/json
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend dev server:

```text
http://localhost:5173
```

## Sprint 7 UI

From the home page you can:

- Create, edit, and delete projects.
- Upload `.txt`, `.md`, `.docx`, and `.pdf` files inside a project card.
- Watch document status move through `uploaded`, `processing`, `complete`, or `failed`.
- View extracted text for completed documents. PDF support extracts embedded text; it does not render the original PDF pages.
- Retry processing or delete uploaded documents.
- Search extracted chunks with the project search box.
- Configure AI provider metadata in the AI settings panel.
- Test whether the selected provider has the expected environment key available.
- Generate evidence-backed themes from processed chunks.
- Review theme cards with source quotes and reasoning.
- Edit theme title, description, confidence, and researcher notes.
- Edit or remove weak evidence.
- Ask session-only questions about the project and review cited chunks.
- Use suggested questions to smoke test the chat workflow.
- Download Markdown, CSV, and JSON findings exports.

Use `sample-data/synthetic-interview-01.txt` as a safe synthetic upload fixture.

Documents uploaded before Sprint 3 need to be reprocessed before they appear in search results. Click **Retry** on an existing document to extract text again and create chunks.

Theme generation and chat use the selected AI provider when a key is detected. If provider is `mock` or no key is available, the backend uses deterministic local mock behavior so the Sprint 7 workflow can still be tested without spending API credits.

## Guardrails

- Use only public or synthetic data.
- Do not commit API keys, secrets, or `.env` files.
- Keep AI and vector storage providers behind swappable interfaces.
- Build one vertical slice at a time.
