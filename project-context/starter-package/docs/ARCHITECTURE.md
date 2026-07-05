# Architecture

## System Overview

Qual AI Workspace is a full-stack web application with a React frontend, FastAPI backend, PostgreSQL database, pgvector embeddings, local file storage, and LiteLLM provider abstraction.

## High-Level Components

```text
Frontend React App
  ↓ REST API
FastAPI Backend
  ↓
Services Layer
  ├── Project service
  ├── Document service
  ├── File parsing service
  ├── Chunking service
  ├── Embedding service
  ├── Theme generation service
  ├── Evidence service
  ├── RAG service
  └── Export service
  ↓
PostgreSQL + pgvector
  ↓
Local Filesystem
```

## Backend Folder Structure

```text
backend/
  app/
    api/
      routes_projects.py
      routes_documents.py
      routes_themes.py
      routes_chats.py
      routes_exports.py
      routes_settings.py
    services/
      project_service.py
      document_service.py
      parsing_service.py
      chunking_service.py
      theme_service.py
      evidence_service.py
      export_service.py
    models/
      project.py
      document.py
      chunk.py
      theme.py
      evidence.py
      insight.py
      chat.py
      settings.py
    schemas/
      project.py
      document.py
      theme.py
      evidence.py
      chat.py
      export.py
      settings.py
    db/
      session.py
      base.py
      init_db.py
    prompts/
      theme_generation.md
      rag_answer.md
      insight_generation.md
      export_report.md
    workers/
      document_processing.py
      theme_generation.py
    embeddings/
      provider.py
      openai_embeddings.py
      ollama_embeddings.py
      chunk_embeddings.py
    rag/
      retriever.py
      citation_builder.py
      answer_service.py
    ai/
      litellm_client.py
      provider_config.py
      structured_output.py
    utils/
      file_utils.py
      text_utils.py
      errors.py
  alembic/
  tests/
```

## Frontend Folder Structure

```text
frontend/
  src/
    pages/
      ProjectsPage.tsx
      ProjectDetailPage.tsx
      DocumentsPage.tsx
      ThemesPage.tsx
      ThemeDetailPage.tsx
      ChatPage.tsx
      SettingsPage.tsx
    components/
      AppShell.tsx
      ProjectCard.tsx
      DocumentUploader.tsx
      DocumentStatusBadge.tsx
      ThemeCard.tsx
      EvidenceList.tsx
      ChatPanel.tsx
      CitationList.tsx
      ExportMenu.tsx
    hooks/
      useProjects.ts
      useDocuments.ts
      useThemes.ts
      useChat.ts
      useSettings.ts
    api/
      client.ts
      projects.ts
      documents.ts
      themes.ts
      chats.ts
      exports.ts
      settings.ts
    store/
      uiStore.ts
      settingsStore.ts
    types/
      project.ts
      document.ts
      theme.ts
      evidence.ts
      chat.ts
    layouts/
      MainLayout.tsx
      ProjectLayout.tsx
    features/
      projects/
      documents/
      themes/
      chat/
      exports/
```

## Runtime Flow

### Document Upload and Processing

```text
Upload file
  ↓
Store file in local filesystem
  ↓
Create Document row: status = uploaded
  ↓
Background task starts
  ↓
Extract text
  ↓
Update Document.content
  ↓
Chunk text
  ↓
Generate embeddings
  ↓
Store Chunk rows with vector embeddings
  ↓
Document.status = complete
```

### Theme Generation

```text
User clicks Generate Themes
  ↓
Retrieve project chunks
  ↓
Optionally cluster / sample representative chunks
  ↓
LLM generates structured theme candidates
  ↓
For each theme, retrieve supporting chunks
  ↓
LLM selects evidence quotes and reasoning
  ↓
Create Theme and Evidence rows
  ↓
Return themes to frontend
```

### RAG Chat

```text
User asks question
  ↓
Embed query
  ↓
Retrieve top relevant chunks for project
  ↓
Build context with document/chunk citations
  ↓
LLM answers using context only
  ↓
Store user and assistant messages
  ↓
Return answer with citations
```

## Provider Strategy

Use LiteLLM as the primary LLM abstraction layer. The app should support BYO API key in MVP.

Initial providers:

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- OpenRouter
- Ollama

For MVP, store provider settings locally or in DB. Do not build enterprise secrets management yet.

## Background Processing Strategy

Start with FastAPI Background Tasks.

Use Celery later when:

- Uploads become large
- Multiple users run concurrent jobs
- Theme generation takes too long
- Retries and persistent job queues become necessary

## Security Notes for MVP

Because there is no authentication initially:

- Treat app as local/dev or single-user internal tool.
- Do not deploy publicly without auth.
- Avoid logging API keys.
- Store API keys encrypted if persisted.
- Prefer session-only or local environment configuration initially.

## Design Principles

- Keep AI outputs structured.
- Make evidence first-class.
- Make every generated artifact editable.
- Cite source text wherever possible.
- Keep the first product simple enough to complete.
