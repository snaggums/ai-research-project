import type {
  TranscriptContext,
  TranscriptDependencySummary,
  TranscriptDocument,
  TranscriptSearchResponse,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class TranscriptApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TranscriptApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
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
    throw new TranscriptApiError(message, response.status, code);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const root = (projectId: string, sessionId: string) => `/projects/${projectId}/sessions/${sessionId}/documents`;

export function listSessionTranscripts(projectId: string, sessionId: string) {
  return request<TranscriptDocument[]>(root(projectId, sessionId));
}

export function uploadSessionTranscript(projectId: string, sessionId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<TranscriptDocument>(root(projectId, sessionId), { method: "POST", body });
}

export function replaceSessionTranscript(
  projectId: string,
  sessionId: string,
  file: File,
  requestKey: string,
) {
  const body = new FormData();
  body.append("file", file);
  return request<TranscriptDocument>(
    `/projects/${projectId}/sessions/${sessionId}/transcript-replacement`,
    {
      method: "POST",
      body,
      headers: { "Idempotency-Key": requestKey },
    },
  );
}

export function getSessionTranscript(projectId: string, sessionId: string, documentId: string) {
  return request<TranscriptDocument>(`${root(projectId, sessionId)}/${documentId}`);
}

export function getTranscriptDependencies(projectId: string, sessionId: string, documentId: string) {
  return request<TranscriptDependencySummary>(`${root(projectId, sessionId)}/${documentId}/dependencies`);
}

export function retrySessionTranscript(projectId: string, sessionId: string, documentId: string) {
  return request<TranscriptDocument>(`${root(projectId, sessionId)}/${documentId}/process`, { method: "POST" });
}

export function setPrimaryTranscript(projectId: string, sessionId: string, documentId: string) {
  return request<TranscriptDocument>(`${root(projectId, sessionId)}/${documentId}/primary`, { method: "POST" });
}

export function deleteSessionTranscript(
  projectId: string,
  sessionId: string,
  documentId: string,
  dependencyVersion: string,
) {
  return request<void>(`${root(projectId, sessionId)}/${documentId}`, {
    method: "DELETE",
    headers: {
      "If-Match": dependencyVersion,
      "X-Transcript-Confirmation": "preserve-lineage",
    },
  });
}

export function searchSessionTranscript(projectId: string, sessionId: string, documentId: string, query: string) {
  const params = new URLSearchParams({ q: query.trim() });
  return request<TranscriptSearchResponse>(`${root(projectId, sessionId)}/${documentId}/search?${params}`);
}

export function getTranscriptContext(projectId: string, sessionId: string, documentId: string, resultId: string) {
  return request<TranscriptContext>(`${root(projectId, sessionId)}/${documentId}/context/${resultId}`);
}
