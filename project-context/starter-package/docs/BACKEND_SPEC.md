# Backend Specification

## Stack

- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL
- pgvector
- LiteLLM
- Pydantic v2
- FastAPI Background Tasks initially

## Backend Responsibilities

- Project CRUD
- File upload
- File storage
- Text extraction
- Chunking
- Embedding generation
- Theme generation
- Evidence management
- RAG chat
- Export generation
- AI provider abstraction

## Service Layer

### Project Service

Responsibilities:

- Create, list, update, delete projects
- Return counts and summary metadata

### Document Service

Responsibilities:

- Store uploaded files
- Create document rows
- Trigger processing
- Manage document status

### Parsing Service

Responsibilities:

- Extract text from `.txt`, `.md`, `.docx`, `.pdf`

Recommended packages:

- TXT/MD: built-in file read
- DOCX: `python-docx`
- PDF: `pypdf` or `pdfplumber`

### Chunking Service

Responsibilities:

- Split extracted text into chunks
- Preserve order and metadata
- Return chunk objects ready for embedding

### Embedding Service

Responsibilities:

- Generate embeddings using configured provider
- Store embeddings in pgvector

### Theme Service

Responsibilities:

- Retrieve project chunks
- Build prompt context
- Call LLM
- Parse structured JSON
- Persist themes and evidence
- Update evidence counts

### Evidence Service

Responsibilities:

- Add, edit, delete evidence
- Retrieve evidence for a theme
- Maintain source relationships

### RAG Service

Responsibilities:

- Embed question
- Retrieve relevant chunks
- Build prompt context
- Call LLM
- Return answer with citations
- Persist chat messages

### Export Service

Responsibilities:

- Generate Markdown report
- Generate CSV export
- Generate JSON export

## File Storage

Use local filesystem:

```text
storage/
  uploads/
    project_{project_id}/
      document_{document_id}_{safe_filename}
```

## Error Handling

Use consistent API errors:

```json
{
  "detail": {
    "code": "DOCUMENT_PROCESSING_FAILED",
    "message": "Could not extract text from PDF.",
    "metadata": {}
  }
}
```

## Background Tasks

Initial jobs:

- Process document after upload
- Generate themes

For MVP, FastAPI background tasks are acceptable. For longer-running or production workloads, move to Celery.

## Testing Strategy

Backend tests should cover:

- Project CRUD
- Document upload
- Text extraction
- Chunking
- Embedding mock
- Theme generation with mocked LLM
- RAG with mocked retrieval and LLM
- Export formatting

## Development Environment

Recommended:

```text
docker-compose.yml
  postgres
  backend
  frontend
```

However, MVP can start with local Postgres and separate frontend/backend commands.

## Environment Variables

```text
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/qual_ai
UPLOAD_DIR=./storage/uploads
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4.1-mini
DEFAULT_EMBEDDING_PROVIDER=openai
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small
```

Do not commit API keys.
