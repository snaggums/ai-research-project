import type {
  CreateRecordCodePayload,
  CreateTranscriptHighlightPayload,
  RecordCode,
  TranscriptCodeSuggestion,
  TranscriptCodingWorkspace,
  TranscriptHighlight,
  UpdateRecordCodePayload,
  UpdateTranscriptCodeSuggestionPayload,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class TranscriptCodingApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TranscriptCodingApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `Request failed with status ${response.status}`;
    let code: string | undefined;
    try {
      const parsed = JSON.parse(raw) as { code?: unknown; detail?: unknown };
      if (typeof parsed.detail === "string") message = parsed.detail;
      if (typeof parsed.code === "string") code = parsed.code;
    } catch {
      // Plain-text API errors remain researcher-readable.
    }
    throw new TranscriptCodingApiError(message, response.status, code);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function idempotencyHeaders(): HeadersInit {
  return { "Idempotency-Key": crypto.randomUUID() };
}

const sessionRoot = (projectId: string, sessionId: string) =>
  `/projects/${projectId}/sessions/${sessionId}`;

export function getTranscriptCodingWorkspace(projectId: string, sessionId: string) {
  return request<TranscriptCodingWorkspace>(`${sessionRoot(projectId, sessionId)}/coding`);
}

export function createTranscriptHighlight(
  projectId: string,
  sessionId: string,
  payload: CreateTranscriptHighlightPayload,
) {
  return request<TranscriptHighlight>(`${sessionRoot(projectId, sessionId)}/highlights`, {
    method: "POST",
    headers: idempotencyHeaders(),
    body: JSON.stringify(payload),
  });
}

export function deleteTranscriptHighlight(projectId: string, sessionId: string, highlightId: string) {
  return request<void>(`${sessionRoot(projectId, sessionId)}/highlights/${highlightId}`, {
    method: "DELETE",
    headers: idempotencyHeaders(),
  });
}

export function addTranscriptHighlightCodes(
  projectId: string,
  sessionId: string,
  highlightId: string,
  codeIds: string[],
) {
  return request<TranscriptHighlight>(`${sessionRoot(projectId, sessionId)}/highlights/${highlightId}/codes`, {
    method: "POST",
    headers: idempotencyHeaders(),
    body: JSON.stringify({ code_ids: codeIds }),
  });
}

export function removeTranscriptHighlightCode(
  projectId: string,
  sessionId: string,
  highlightId: string,
  codeId: string,
) {
  return request<TranscriptHighlight>(`${sessionRoot(projectId, sessionId)}/highlights/${highlightId}/codes/${codeId}`, {
    method: "DELETE",
    headers: idempotencyHeaders(),
  });
}

export function createRecordCode(recordId: string, payload: CreateRecordCodePayload) {
  return request<RecordCode>(`/records/${recordId}/codes`, {
    method: "POST",
    headers: idempotencyHeaders(),
    body: JSON.stringify(payload),
  });
}

export function updateRecordCode(recordId: string, codeId: string, payload: UpdateRecordCodePayload) {
  return request<RecordCode>(`/records/${recordId}/codes/${codeId}`, {
    method: "PATCH",
    headers: idempotencyHeaders(),
    body: JSON.stringify(payload),
  });
}

export function updateTranscriptCodeSuggestion(
  projectId: string,
  sessionId: string,
  suggestionId: string,
  payload: UpdateTranscriptCodeSuggestionPayload,
) {
  return request<TranscriptCodeSuggestion>(`${sessionRoot(projectId, sessionId)}/code-suggestions/${suggestionId}`, {
    method: "PATCH",
    headers: idempotencyHeaders(),
    body: JSON.stringify(payload),
  });
}

export function acceptTranscriptCodeSuggestion(projectId: string, sessionId: string, suggestionId: string) {
  return request<TranscriptCodingWorkspace>(`${sessionRoot(projectId, sessionId)}/code-suggestions/${suggestionId}/accept`, {
    method: "POST",
    headers: idempotencyHeaders(),
  });
}

export function rejectTranscriptCodeSuggestion(projectId: string, sessionId: string, suggestionId: string) {
  return request<TranscriptCodeSuggestion>(`${sessionRoot(projectId, sessionId)}/code-suggestions/${suggestionId}/reject`, {
    method: "POST",
    headers: idempotencyHeaders(),
  });
}

export function generateTranscriptCodeSuggestions(projectId: string, sessionId: string) {
  return request<TranscriptCodingWorkspace>(`${sessionRoot(projectId, sessionId)}/code-suggestions/generate`, {
    method: "POST",
    headers: idempotencyHeaders(),
  });
}
