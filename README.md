# Sky-AIR

30 Apps in 30 Days: Stephanie and Abigail Team

AI-Assisted UX Research Repository

An MVP AI-assisted qualitative research workspace for uploading research transcripts, generating evidence-backed themes, reviewing findings, asking cited questions, and exporting reports.

The project context from the starter package is stored under `project-context/`. Implementation proceeds in sprint-sized vertical slices.

## Current Status

Sprint 3 implements Project CRUD, document upload/text extraction, chunking, mock embeddings, and local search:

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
- React/Vite frontend scaffold
- TailwindCSS and shadcn-compatible UI foundation
- Project list, create, edit, and delete UI
- Per-project document upload, status, retry/delete actions, and extracted text preview
- Per-project search UI for extracted chunks

AI settings, real embedding providers, theme generation, RAG chat, and exports are intentionally out of scope for Sprint 3.

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

## Sprint 3 UI

From the home page you can:

- Create, edit, and delete projects.
- Upload `.txt`, `.md`, `.docx`, and `.pdf` files inside a project card.
- Watch document status move through `uploaded`, `processing`, `complete`, or `failed`.
- View extracted text for completed documents. PDF support extracts embedded text; it does not render the original PDF pages.
- Retry processing or delete uploaded documents.
- Search extracted chunks with the project search box.

Use `sample-data/synthetic-interview-01.txt` as a safe synthetic upload fixture.

Documents uploaded before Sprint 3 need to be reprocessed before they appear in search results. Click **Retry** on an existing document to extract text again and create chunks.

## Guardrails

- Use only public or synthetic data.
- Do not commit API keys, secrets, or `.env` files.
- Keep AI and vector storage providers behind swappable interfaces.
- Build one vertical slice at a time.
