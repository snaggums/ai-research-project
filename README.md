# AI-Assisted UX Research Repository

An MVP AI-assisted qualitative research workspace for uploading research transcripts, generating evidence-backed themes, reviewing findings, asking cited questions, and exporting reports.

The project context from the starter package is stored under `project-context/`. Implementation proceeds in sprint-sized vertical slices.

## Current Status

Sprint 1 implements Project CRUD end to end:

- Docker Compose configuration for PostgreSQL with pgvector image
- FastAPI backend scaffold
- SQLAlchemy 2 database setup
- Alembic migration for `projects`
- Project CRUD REST API
- React/Vite frontend scaffold
- TailwindCSS and shadcn-compatible UI foundation
- Project list, create, edit, and delete UI

AI settings, document upload, embeddings, theme generation, RAG chat, and exports are intentionally out of scope for Sprint 1.

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

## Guardrails

- Use only public or synthetic data.
- Do not commit API keys, secrets, or `.env` files.
- Keep AI and vector storage providers behind swappable interfaces.
- Build one vertical slice at a time.
