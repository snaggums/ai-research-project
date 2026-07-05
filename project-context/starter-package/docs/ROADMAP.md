# Roadmap

## Phase 0 — Project Setup

- Backend scaffold
- Frontend scaffold
- Database connection
- Alembic migrations
- Basic app shell

## Phase 1 — Projects

- Project CRUD API
- Project list UI
- Create/edit/delete project UI

## Phase 2 — Document Upload and Processing

- Upload `.txt`, `.md`, `.docx`, `.pdf`
- Store files locally
- Extract text
- Create chunks
- Track processing status

## Phase 3 — Embeddings and Search

- Configure embedding provider
- Store embeddings in pgvector
- Implement project semantic search
- Add search test endpoint/UI

## Phase 4 — Evidence-Aware Theme Generation

- Configure LiteLLM
- Generate themes from project chunks
- Persist themes
- Persist supporting evidence
- Show theme cards and detail pages

## Phase 5 — Theme Review and Editing

- Edit theme title/description/confidence/notes
- Delete themes
- Create manual themes
- Edit/delete evidence

## Phase 6 — RAG Chat

- Create chats
- Ask questions
- Retrieve relevant chunks
- Generate cited answers
- Store chat history

## Phase 7 — Exports

- Markdown export
- CSV export
- JSON export

## Post-MVP

- Authentication
- Team workspaces
- Audio/video upload
- Transcription
- Speaker diarization
- Highlight clips
- Cross-project repository
- Rich report builder
- PDF/DOCX/PPTX export
- Integrations
- Enterprise deployment
- Internal server deployment
