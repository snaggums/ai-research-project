import type {
  AskSessionResponse,
  SessionConversation,
  SessionReport,
  SessionReportGenerateResponse,
  SessionTheme,
  SessionThemeGenerateResponse,
  SessionThemePayload,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class SynthesisApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SynthesisApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) throw new SynthesisApiError((await response.text()) || `Request failed with status ${response.status}`, response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const sessionRoot = (projectId: string, sessionId: string) => `/projects/${projectId}/sessions/${sessionId}`;
const json = (body?: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export function listSessionThemes(projectId: string, sessionId: string) {
  return request<SessionTheme[]>(`${sessionRoot(projectId, sessionId)}/themes`);
}

export function generateSessionThemes(projectId: string, sessionId: string) {
  return request<SessionThemeGenerateResponse>(`${sessionRoot(projectId, sessionId)}/themes/generate`, json());
}

export function updateSessionTheme(projectId: string, sessionId: string, themeId: string, payload: SessionThemePayload) {
  return request<SessionTheme>(`${sessionRoot(projectId, sessionId)}/themes/${themeId}`, {
    ...json(payload),
    method: "PATCH",
  });
}

export function getSessionReport(projectId: string, sessionId: string) {
  return request<SessionReport | null>(`${sessionRoot(projectId, sessionId)}/report`);
}

export function generateSessionReport(projectId: string, sessionId: string) {
  return request<SessionReportGenerateResponse>(`${sessionRoot(projectId, sessionId)}/report/generate`, json());
}

export function updateSessionReportStatus(projectId: string, sessionId: string, status: SessionReport["status"]) {
  return request<SessionReport>(`${sessionRoot(projectId, sessionId)}/report`, {
    ...json({ status }),
    method: "PATCH",
  });
}

export function createSessionReportRevision(projectId: string, sessionId: string) {
  return request<SessionReport>(`${sessionRoot(projectId, sessionId)}/report/revisions`, json());
}

export function getSessionConversation(projectId: string, sessionId: string) {
  return request<SessionConversation>(`${sessionRoot(projectId, sessionId)}/conversations`);
}

export function askSession(projectId: string, sessionId: string, question: string) {
  return request<AskSessionResponse>(`${sessionRoot(projectId, sessionId)}/conversations/ask`, json({ question }));
}
