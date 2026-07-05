# GitHub-Style Implementation Backlog

## Epic 1: Project Setup

### Issue 1: Create repository structure
Create `backend/` and `frontend/` directories matching the project specification.

Acceptance criteria:
- Backend directory has app modules.
- Frontend directory has Vite app structure.
- README explains how to run both apps.

### Issue 2: Configure FastAPI backend
Acceptance criteria:
- FastAPI app starts locally.
- Health endpoint returns OK.
- CORS configured for frontend dev server.

### Issue 3: Configure React/Vite frontend
Acceptance criteria:
- React app starts locally.
- TailwindCSS configured.
- shadcn/ui installed.
- Basic app shell renders.

### Issue 4: Configure PostgreSQL and Alembic
Acceptance criteria:
- SQLAlchemy connects to Postgres.
- Alembic migrations run.
- pgvector extension enabled.

## Epic 2: Projects

### Issue 5: Implement Project model and migration
Acceptance criteria:
- projects table exists.
- model uses SQLAlchemy 2 style.

### Issue 6: Implement Project CRUD API
Acceptance criteria:
- GET, POST, PATCH, DELETE project endpoints work.
- Pydantic schemas validate input/output.

### Issue 7: Build Projects UI
Acceptance criteria:
- User can list projects.
- User can create a project.
- User can edit and delete a project.

## Epic 3: Documents

### Issue 8: Implement Document model and migration
Acceptance criteria:
- documents table exists.
- status field supports uploaded, processing, complete, failed.

### Issue 9: Implement file upload endpoint
Acceptance criteria:
- User can upload supported file types.
- File is stored on local filesystem.
- Document row is created.

### Issue 10: Implement text extraction service
Acceptance criteria:
- TXT, MD, DOCX, and PDF text extraction work.
- Processing failures update document status to failed.

### Issue 11: Build document upload UI
Acceptance criteria:
- User can upload files from project page.
- Processing status is visible.
- Failed documents show error message.

## Epic 4: Chunking and Embeddings

### Issue 12: Implement Chunk model and migration
Acceptance criteria:
- chunks table exists.
- embedding column uses pgvector.

### Issue 13: Implement chunking service
Acceptance criteria:
- Extracted document text is split into ordered chunks.
- Chunks preserve document_id, project_id, chunk_index.

### Issue 14: Implement embedding provider abstraction
Acceptance criteria:
- Embedding provider can be configured.
- OpenAI and Ollama can be added behind common interface.
- Embedding generation can be mocked in tests.

### Issue 15: Store chunk embeddings
Acceptance criteria:
- Each processed chunk has an embedding.
- Chunks can be queried by project.

### Issue 16: Implement semantic search endpoint
Acceptance criteria:
- User query returns relevant chunks.
- Search filters by project_id.

## Epic 5: AI Provider Settings

### Issue 17: Implement AI settings API
Acceptance criteria:
- User can save provider, model, base_url, embedding settings.
- Raw API key is not returned from GET endpoint.

### Issue 18: Build settings UI
Acceptance criteria:
- User can configure LLM provider.
- User can test connection.

### Issue 19: Implement LiteLLM client service
Acceptance criteria:
- Backend can call configured LLM provider through LiteLLM.
- Structured JSON output is parsed and validated.

## Epic 6: Evidence-Aware Themes

### Issue 20: Implement Theme and Evidence models
Acceptance criteria:
- themes and evidence tables exist.
- Evidence links to theme, document, and chunk.

### Issue 21: Implement theme generation service
Acceptance criteria:
- Service retrieves project chunks.
- Service calls LLM with theme-generation prompt.
- Service validates structured response.

### Issue 22: Persist generated themes and evidence
Acceptance criteria:
- Generated themes are saved.
- Supporting evidence is saved.
- Evidence count is updated.

### Issue 23: Implement themes API
Acceptance criteria:
- GET project themes.
- POST generate themes.
- GET theme detail.
- PATCH theme.
- DELETE theme.

### Issue 24: Build themes page
Acceptance criteria:
- User can generate themes.
- Theme cards show title, description, confidence, evidence count.

### Issue 25: Build theme detail page
Acceptance criteria:
- User can view evidence.
- User can edit theme.
- User can delete evidence.

## Epic 7: Chat and RAG

### Issue 26: Implement Chat and ChatMessage models
Acceptance criteria:
- chats and chat_messages tables exist.

### Issue 27: Implement RAG answer service
Acceptance criteria:
- User question is embedded.
- Relevant chunks are retrieved.
- LLM answer cites chunks.

### Issue 28: Implement chat API
Acceptance criteria:
- User can create chat.
- User can send message.
- Assistant message is stored with citations.

### Issue 29: Build chat UI
Acceptance criteria:
- User can send questions.
- Assistant answers render.
- Citations are shown below answers.

## Epic 8: Exports

### Issue 30: Implement Markdown export
Acceptance criteria:
- Project themes and evidence export as Markdown.

### Issue 31: Implement CSV export
Acceptance criteria:
- Evidence-level CSV export works.

### Issue 32: Implement JSON export
Acceptance criteria:
- Project structured export works.

### Issue 33: Build export menu
Acceptance criteria:
- User can download Markdown, CSV, and JSON from UI.

## Epic 9: Testing and Quality

### Issue 34: Add backend unit tests
Acceptance criteria:
- Core services have tests.
- AI calls are mocked.

### Issue 35: Add frontend smoke tests
Acceptance criteria:
- Main pages render.
- Basic API mocks work.

### Issue 36: Add sample transcript fixtures
Acceptance criteria:
- Repo includes small sample transcript files for local testing.

### Issue 37: Improve error states
Acceptance criteria:
- Upload, processing, AI, and chat failures show clear UI messages.

### Issue 38: Add developer setup guide
Acceptance criteria:
- README includes full local setup steps.
