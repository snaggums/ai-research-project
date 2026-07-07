const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export type ExportFormat = "markdown" | "csv" | "json";

export function exportUrl(projectId: string, format: ExportFormat) {
  return `${API_BASE_URL}/projects/${projectId}/exports/${format}`;
}
