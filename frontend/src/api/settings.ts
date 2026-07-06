import type { AISettings, AISettingsPayload, AISettingsTestResult } from "./types";

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
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getAISettings() {
  return request<AISettings>("/settings/ai");
}

export function updateAISettings(payload: AISettingsPayload) {
  return request<AISettings>("/settings/ai", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function testAISettings() {
  return request<AISettingsTestResult>("/settings/ai/test", {
    method: "POST",
  });
}
