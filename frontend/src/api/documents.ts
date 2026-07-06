import type { ResearchDocument, ResearchDocumentDetail } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listProjectDocuments(projectId: string) {
  return request<ResearchDocument[]>(`/projects/${projectId}/documents`);
}

export function uploadProjectDocument(projectId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<ResearchDocument>(`/projects/${projectId}/documents`, {
    method: "POST",
    body: formData,
  });
}

export function getDocument(documentId: string) {
  return request<ResearchDocumentDetail>(`/documents/${documentId}`);
}

export function retryDocumentProcessing(documentId: string) {
  return request<ResearchDocument>(`/documents/${documentId}/process`, {
    method: "POST",
  });
}

export function deleteDocument(documentId: string) {
  return request<void>(`/documents/${documentId}`, {
    method: "DELETE",
  });
}
