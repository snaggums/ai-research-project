# Database Schema

## Database

PostgreSQL with pgvector extension.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Entity Relationship Summary

```text
Project 1 ── * Document
Document 1 ── * Chunk
Project 1 ── * Theme
Theme 1 ── * Evidence
Chunk 1 ── * Evidence
Project 1 ── * Insight
Project 1 ── * Chat
Chat 1 ── * ChatMessage
```

## Tables

### projects

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| name | text | Required |
| description | text | Optional |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

### documents

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| project_id | FK | references projects.id |
| filename | text | Original filename |
| file_path | text | Local filesystem path |
| mime_type | text | Optional |
| content | text | Extracted text |
| status | enum/text | uploaded, processing, complete, failed |
| error_message | text | Optional |
| uploaded_at | timestamp | Required |
| processed_at | timestamp | Optional |

### chunks

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| document_id | FK | references documents.id |
| project_id | FK | denormalized for fast filtering |
| text | text | Chunk content |
| embedding | vector | pgvector embedding |
| chunk_index | int | Order in document |
| start_char | int | Optional |
| end_char | int | Optional |
| metadata | jsonb | Page number, section, headings, etc. |
| created_at | timestamp | Required |

### themes

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| project_id | FK | references projects.id |
| title | text | Required |
| description | text | Required |
| confidence | float | 0.0 to 1.0 |
| evidence_count | int | Cached count |
| created_by | enum/text | ai or user |
| user_notes | text | Optional |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

### evidence

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| theme_id | FK | references themes.id |
| document_id | FK | references documents.id |
| chunk_id | FK | references chunks.id |
| quote | text | Exact or near-exact excerpt |
| reasoning | text | Why this supports the theme |
| relevance_score | float | 0.0 to 1.0 |
| evidence_type | enum/text | supporting or contradictory |
| start_char | int | Optional |
| end_char | int | Optional |
| created_at | timestamp | Required |

### insights

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| project_id | FK | references projects.id |
| theme_id | FK nullable | Optional theme relationship |
| title | text | Required |
| description | text | Required |
| evidence_summary | text | Optional |
| created_by | enum/text | ai or user |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

### chats

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| project_id | FK | references projects.id |
| title | text | Optional |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

### chat_messages

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| chat_id | FK | references chats.id |
| role | enum/text | user, assistant, system |
| content | text | Required |
| citations | jsonb | Source chunks used |
| created_at | timestamp | Required |

### ai_settings

For MVP, one global settings row may be sufficient.

| Column | Type | Notes |
|---|---|---|
| id | UUID / int | Primary key |
| provider | text | openai, anthropic, gemini, openrouter, azure, ollama |
| model | text | Provider model name |
| embedding_provider | text | Optional |
| embedding_model | text | Optional |
| api_key_encrypted | text | Optional if persisted |
| base_url | text | Optional for OpenRouter/Ollama/Azure |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

## Status Values

### Document Status

```text
uploaded
processing
complete
failed
```

### created_by Values

```text
ai
user
```

### Evidence Type Values

```text
supporting
contradictory
```

## Indexes

Recommended indexes:

```sql
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_chunks_project_id ON chunks(project_id);
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_themes_project_id ON themes(project_id);
CREATE INDEX idx_evidence_theme_id ON evidence(theme_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
```

Vector index after enough rows exist:

```sql
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

For small MVP datasets, exact vector search may be acceptable before adding ivfflat.

## SQLAlchemy Notes

Use SQLAlchemy 2 style models.

Recommended conventions:

- Use `Mapped[]` and `mapped_column()`.
- Use UTC timestamps.
- Use relationships for project/document/chunk/theme/evidence.
- Keep vector field implementation compatible with `pgvector.sqlalchemy.Vector`.

## Alembic Notes

First migration should:

1. Enable pgvector extension.
2. Create all base tables.
3. Add indexes.

Keep enum fields as strings in MVP to avoid migration friction.
