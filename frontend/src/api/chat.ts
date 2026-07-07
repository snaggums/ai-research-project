import type { ChatResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export async function askProjectQuestion(projectId: string, question: string, limit = 6) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, limit }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<ChatResponse>;
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
