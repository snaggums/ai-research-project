import type { Session, SessionFilters, SessionPayload } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class SessionApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SessionApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { "Content-Type": "application/json", ...options.headers }, ...options });
  if (!response.ok) throw new SessionApiError((await response.text()) || `Request failed with status ${response.status}`, response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listSessions(projectId: string, filters: SessionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.type) params.set("type", filters.type);
  if (filters.transcriptStatus) params.set("transcript_status", filters.transcriptStatus);
  if (filters.analysisStatus) params.set("analysis_status", filters.analysisStatus);
  if (filters.date) params.set("date", filters.date);
  if (filters.recordId) params.set("record_id", filters.recordId);
  if (filters.commonComponentId) params.set("common_component_id", filters.commonComponentId);
  return request<Session[]>(`/projects/${projectId}/sessions${params.size ? `?${params}` : ""}`);
}

export function getSession(projectId: string, sessionId: string) {
  return request<Session>(`/projects/${projectId}/sessions/${sessionId}`);
}

export function createSession(projectId: string, payload: SessionPayload) {
  return request<Session>(`/projects/${projectId}/sessions`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateSession(projectId: string, sessionId: string, payload: SessionPayload) {
  return request<Session>(`/projects/${projectId}/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteSession(projectId: string, sessionId: string) {
  return request<void>(`/projects/${projectId}/sessions/${sessionId}`, { method: "DELETE" });
}
