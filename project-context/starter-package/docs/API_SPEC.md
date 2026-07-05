# API Specification

Base URL: `/api`

## Projects

### GET `/projects`

Returns all projects.

Response:

```json
[
  {
    "id": "project_id",
    "name": "Healthcare Study",
    "description": "Interview transcripts",
    "created_at": "2026-07-05T12:00:00Z",
    "updated_at": "2026-07-05T12:00:00Z"
  }
]
```

### POST `/projects`

Creates a project.

Request:

```json
{
  "name": "Healthcare Study",
  "description": "Interview transcripts"
}
```

### GET `/projects/{project_id}`

Returns project details including document/theme counts.

### PATCH `/projects/{project_id}`

Updates project name or description.

### DELETE `/projects/{project_id}`

Deletes project and associated data.

---

## Documents

### GET `/projects/{project_id}/documents`

Returns documents in a project.

### POST `/projects/{project_id}/documents`

Uploads a document.

Content type: `multipart/form-data`

Fields:

- `file`

Response:

```json
{
  "id": "document_id",
  "project_id": "project_id",
  "filename": "interview-01.docx",
  "status": "uploaded"
}
```

### GET `/documents/{document_id}`

Returns document metadata and extracted content.

### POST `/documents/{document_id}/process`

Triggers or retries processing.

### DELETE `/documents/{document_id}`

Deletes a document, chunks, and related evidence.

---

## Themes

### GET `/projects/{project_id}/themes`

Returns all themes for a project.

### POST `/projects/{project_id}/themes/generate`

Generates AI themes for a project.

Request:

```json
{
  "max_themes": 12,
  "include_contradictory_evidence": true
}
```

Response:

```json
{
  "status": "started"
}
```

For MVP, this may run synchronously if datasets are small. Prefer background task if response time exceeds a few seconds.

### POST `/projects/{project_id}/themes`

Creates a manual theme.

Request:

```json
{
  "title": "Navigation confusion",
  "description": "Users had trouble finding key settings.",
  "confidence": 0.8,
  "created_by": "user"
}
```

### GET `/themes/{theme_id}`

Returns theme details and evidence.

### PATCH `/themes/{theme_id}`

Updates theme title, description, confidence, or notes.

### DELETE `/themes/{theme_id}`

Deletes a theme and associated evidence.

---

## Evidence

### GET `/themes/{theme_id}/evidence`

Returns evidence for a theme.

### POST `/themes/{theme_id}/evidence`

Adds evidence manually.

Request:

```json
{
  "document_id": "document_id",
  "chunk_id": "chunk_id",
  "quote": "I couldn't find where to change that setting.",
  "reasoning": "The quote directly supports the navigation confusion theme.",
  "relevance_score": 0.92,
  "evidence_type": "supporting"
}
```

### PATCH `/evidence/{evidence_id}`

Updates quote, reasoning, relevance score, or evidence type.

### DELETE `/evidence/{evidence_id}`

Deletes evidence.

---

## Chat

### GET `/projects/{project_id}/chats`

Returns project chat threads.

### POST `/projects/{project_id}/chats`

Creates a chat.

### GET `/chats/{chat_id}`

Returns chat with messages.

### POST `/chats/{chat_id}/messages`

Sends a user message and receives an AI answer.

Request:

```json
{
  "message": "What frustrated users most?"
}
```

Response:

```json
{
  "message": {
    "role": "assistant",
    "content": "Users were most frustrated by account setup and navigation...",
    "citations": [
      {
        "document_id": "doc1",
        "document_name": "interview-01.txt",
        "chunk_id": "chunk1",
        "quote": "I couldn't find where to change that setting."
      }
    ]
  }
}
```

---

## Search

### POST `/projects/{project_id}/search`

Semantic search over project chunks.

Request:

```json
{
  "query": "onboarding confusion",
  "limit": 10
}
```

---

## Settings

### GET `/settings/ai`

Returns configured provider metadata, not raw API key.

### PUT `/settings/ai`

Stores provider configuration.

Request:

```json
{
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "api_key": "...",
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small"
}
```

### POST `/settings/ai/test`

Tests provider connection.

---

## Exports

### GET `/projects/{project_id}/exports/markdown`

Exports findings report as Markdown.

### GET `/projects/{project_id}/exports/csv`

Exports themes and evidence as CSV.

### GET `/projects/{project_id}/exports/json`

Exports structured project data as JSON.
