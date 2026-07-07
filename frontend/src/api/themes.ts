import type { Theme, ThemeEvidence, ThemeEvidencePayload, ThemeGenerateResponse, ThemePayload } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listProjectThemes(projectId: string) {
  return request<Theme[]>(`/projects/${projectId}/themes`);
}

export function generateProjectThemes(projectId: string) {
  return request<ThemeGenerateResponse>(`/projects/${projectId}/themes/generate`, {
    method: "POST",
    body: JSON.stringify({ max_themes: 5, replace_existing: true }),
  });
}

export function updateTheme(themeId: string, payload: ThemePayload) {
  return request<Theme>(`/themes/${themeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTheme(themeId: string) {
  return request<void>(`/themes/${themeId}`, { method: "DELETE" });
}

export function updateEvidence(evidenceId: string, payload: ThemeEvidencePayload) {
  return request<ThemeEvidence>(`/evidence/${evidenceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteEvidence(evidenceId: string) {
  return request<void>(`/evidence/${evidenceId}`, { method: "DELETE" });
}

async function readErrorMessage(response: Response) {
  const rawMessage = await response.text();
  if (!rawMessage) return "";

  try {
    const parsed = JSON.parse(rawMessage) as { detail?: unknown };
    if (typeof parsed.detail === "string") {
      return parsed.detail;
    }
    if (Array.isArray(parsed.detail)) {
      return parsed.detail.map((item) => JSON.stringify(item)).join("; ");
    }
  } catch {
    return rawMessage;
  }

  return rawMessage;
}
