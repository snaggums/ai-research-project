# Codex Prompt: RAG Chat

Implement project chat using retrieval-augmented generation.

Backend requirements:

- Chat model
- ChatMessage model
- Alembic migration
- RAG service:
  - Embed query
  - Retrieve top project chunks
  - Build context
  - Generate answer using LiteLLM
  - Return citations
- Routes:
  - GET /api/projects/{project_id}/chats
  - POST /api/projects/{project_id}/chats
  - GET /api/chats/{chat_id}
  - POST /api/chats/{chat_id}/messages

Frontend requirements:

- Chat page
- Message list
- Message input
- Citation display
- Suggested questions

Acceptance criteria:

- User can ask questions about project transcripts.
- Assistant answers with citations.
- Chat history persists.
