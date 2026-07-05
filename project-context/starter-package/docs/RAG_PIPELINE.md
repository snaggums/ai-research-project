# RAG Pipeline

## Goals

The RAG pipeline allows users to ask questions about uploaded project transcripts and receive answers grounded in source text.

Every answer should include citations to source chunks when possible.

## Pipeline Stages

1. Text extraction
2. Chunking
3. Embedding
4. Storage
5. Retrieval
6. Context assembly
7. Answer generation
8. Citation construction
9. Chat persistence

## Chunking Strategy

Start simple:

- Chunk size: 700–1,000 tokens
- Overlap: 100–150 tokens
- Preserve document order
- Store `chunk_index`, `start_char`, `end_char`
- Store metadata such as filename and page number where available

For transcript data, later improve chunking by speaker turn or timestamp.

## Embeddings

Embeddings are stored in the `chunks.embedding` pgvector field.

Recommended first options:

- OpenAI `text-embedding-3-small`
- Ollama `nomic-embed-text`

The embedding provider should be configurable.

## Retrieval

For chat:

1. Embed the user query.
2. Filter chunks by `project_id`.
3. Run vector similarity search.
4. Return top `k` chunks.
5. Optionally rerank later.

Initial values:

- `top_k = 8`
- Similarity: cosine distance

## Context Assembly

Each retrieved chunk should be formatted with explicit source metadata:

```text
[Source 1]
Document: interview-01.txt
Chunk ID: chunk_123
Text:
...
```

## Answer Rules

The AI should:

- Answer only using provided context.
- Say when the uploaded data does not contain enough evidence.
- Include cited evidence.
- Avoid inventing participant details.
- Avoid overgeneralizing from weak evidence.
- Distinguish findings from speculation.

## Citation Format

The backend should return structured citations:

```json
{
  "document_id": "doc_123",
  "document_name": "interview-01.txt",
  "chunk_id": "chunk_456",
  "quote": "I couldn't find where to change the setting.",
  "relevance_score": 0.91
}
```

## Chat Persistence

When a user sends a message:

1. Store user message.
2. Retrieve chunks.
3. Generate answer.
4. Store assistant message with citations.
5. Return answer.

## Failure Cases

### No Documents

Return:

> Upload and process at least one document before asking questions.

### Documents Still Processing

Return:

> Some documents are still processing. Answers may be incomplete until processing finishes.

### No Relevant Chunks

Return:

> I could not find enough relevant evidence in the uploaded documents to answer that question.

## Later Improvements

- Hybrid keyword + vector search
- Reranking
- Query decomposition
- Theme-aware retrieval
- Quote-level citation extraction
- Page-level PDF citations
- Speaker-aware transcript citations
- Evaluation set for retrieval quality
