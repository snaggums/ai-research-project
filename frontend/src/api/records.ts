import type {
  RecordCatalogItem,
  RecordChatResponse,
  RecordChatSourceAvailability,
  RecordSynthesis,
  RecordSynthesisEligibility,
  RecordSynthesisEvidence,
  RecordSynthesisItem,
  Session,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class RecordApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RecordApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    throw new RecordApiError((await response.text()) || `Request failed with status ${response.status}`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const root = (recordId: string) => `/records/${recordId}`;

export function listRecords() {
  return request<RecordCatalogItem[]>("/records");
}

export function getRecord(recordId: string) {
  return request<RecordCatalogItem>(root(recordId));
}

export function listRecordSessions(recordId: string) {
  return request<Session[]>(`${root(recordId)}/sessions`);
}

export function getRecordChatSources(recordId: string) {
  return request<RecordChatSourceAvailability>(`${root(recordId)}/chat/sources`);
}

export function askRecord(recordId: string, question: string, limit = 6) {
  return request<RecordChatResponse>(`${root(recordId)}/chat/ask`, {
    method: "POST",
    body: JSON.stringify({ question, limit }),
  });
}

export function getRecordSynthesisEligibility(recordId: string) {
  return request<RecordSynthesisEligibility>(`${root(recordId)}/synthesis/eligibility`);
}

export function getLatestRecordSynthesis(recordId: string) {
  return request<RecordSynthesis | null>(`${root(recordId)}/synthesis/latest`);
}

export function generateRecordSynthesis(recordId: string, clientRequestKey = createClientRequestKey()) {
  return request<RecordSynthesis>(`${root(recordId)}/synthesis`, {
    method: "POST",
    body: JSON.stringify({ client_request_key: clientRequestKey }),
  });
}

export function updateRecordSynthesisItem(recordId: string, itemId: string, status: RecordSynthesisItem["status"]) {
  return request<RecordSynthesisItem>(`${root(recordId)}/synthesis/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getRecordSynthesisEvidence(recordId: string, itemId: string, evidenceId: string) {
  return request<RecordSynthesisEvidence>(`${root(recordId)}/synthesis/items/${itemId}/evidence/${evidenceId}`);
}

function createClientRequestKey() {
  return globalThis.crypto?.randomUUID?.() ?? `record-synthesis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
