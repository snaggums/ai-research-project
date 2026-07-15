import type { Participant, ParticipantPayload } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class ParticipantApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ParticipantApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ParticipantApiError(message || `Request failed with status ${response.status}`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listParticipants(projectId: string, search = "") {
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  const query = params.size ? `?${params.toString()}` : "";
  return request<Participant[]>(`/projects/${projectId}/participants${query}`);
}

export function getParticipant(projectId: string, participantId: string) {
  return request<Participant>(`/projects/${projectId}/participants/${participantId}`);
}

export function createParticipant(projectId: string, payload: ParticipantPayload) {
  return request<Participant>(`/projects/${projectId}/participants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateParticipant(projectId: string, participantId: string, payload: ParticipantPayload) {
  return request<Participant>(`/projects/${projectId}/participants/${participantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteParticipant(projectId: string, participantId: string) {
  return request<void>(`/projects/${projectId}/participants/${participantId}`, { method: "DELETE" });
}
