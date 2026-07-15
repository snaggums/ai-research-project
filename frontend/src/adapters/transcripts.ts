import type {
  TranscriptContext as TranscriptContextTransport,
  TranscriptDocument as TranscriptDocumentTransport,
  TranscriptSearchResult as TranscriptSearchResultTransport,
} from "@/api/types";
import type {
  TranscriptContext,
  TranscriptDocumentDetail,
  TranscriptDocumentSummary,
  TranscriptSearchResult,
} from "@/domain/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

function resolveApiUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("#")) return value;
  const browserOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const apiBase = new URL(API_BASE_URL, browserOrigin);
  return new URL(value, apiBase).toString();
}

export function toTranscriptDocumentSummary(document: TranscriptDocumentTransport): TranscriptDocumentSummary {
  return {
    id: document.id,
    projectId: document.project_id,
    sessionId: document.session_id,
    filename: document.filename,
    mimeType: document.mime_type ?? undefined,
    sizeBytes: document.size_bytes ?? undefined,
    status: document.status,
    isPrimary: document.is_primary,
    uploadedAt: document.uploaded_at,
    processedAt: document.processed_at ?? undefined,
    errorMessage: document.error_message ?? undefined,
  };
}

export function toTranscriptDocumentDetail(document: TranscriptDocumentTransport): TranscriptDocumentDetail {
  return {
    ...toTranscriptDocumentSummary(document),
    blocks: document.blocks,
    sourceUrl: resolveApiUrl(document.source_url),
    downloadUrl: resolveApiUrl(document.download_url),
  };
}

export function toTranscriptSearchResult(result: TranscriptSearchResultTransport): TranscriptSearchResult {
  return {
    id: result.id,
    documentId: result.document_id,
    speaker: result.speaker,
    location: result.location,
    excerpt: result.excerpt,
    relevance: result.relevance,
    blockIndex: result.block_index,
  };
}

export function toTranscriptContext(context: TranscriptContextTransport): TranscriptContext {
  return {
    document: toTranscriptDocumentDetail(context.document),
    result: toTranscriptSearchResult(context.result),
    passages: context.passages,
    focusedPassageId: context.focused_passage_id,
  };
}
