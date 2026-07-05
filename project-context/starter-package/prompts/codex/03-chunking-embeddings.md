# Codex Prompt: Chunking and Embeddings

Implement document chunking and embeddings using PostgreSQL pgvector.

Backend requirements:

- Chunk model and migration
- pgvector extension migration
- Chunking service with configurable chunk size and overlap
- Embedding provider abstraction
- Store embeddings for each chunk
- Semantic search endpoint: POST /api/projects/{project_id}/search

Use mock embeddings if API provider is not configured, but keep the abstraction ready for OpenAI and Ollama.

Acceptance criteria:

- Processed documents create chunks.
- Chunks have embeddings.
- Search endpoint returns relevant chunks for a query.
