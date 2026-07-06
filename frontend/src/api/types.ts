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

export type AISettings = {
  id: string;
  provider: string;
  model: string;
  base_url: string | null;
  embedding_provider: string;
  embedding_model: string;
  api_key_env_var: string | null;
  has_api_key: boolean;
  created_at: string;
  updated_at: string;
};

export type AISettingsPayload = {
  provider: string;
  model: string;
  base_url?: string | null;
  embedding_provider: string;
  embedding_model: string;
};

export type AISettingsTestResult = {
  ok: boolean;
  message: string;
  provider: string;
  model: string;
  api_key_env_var: string | null;
  has_api_key: boolean;
};
