export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectPayload = {
  name: string;
  description?: string | null;
};

export type ResearchDocument = {
  id: string;
  project_id: string;
  filename: string;
  mime_type: string | null;
  status: "uploaded" | "processing" | "complete" | "failed";
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
};

export type ResearchDocumentDetail = ResearchDocument & {
  content: string | null;
};

export type SearchResult = {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  text: string;
  score: number;
};

export type SearchResponse = {
  results: SearchResult[];
};
