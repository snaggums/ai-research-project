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

export type Participant = {
  id: string;
  project_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  organization: string | null;
  role: string | null;
  record_ids: string[];
  researcher_notes: string | null;
  session_count: number;
  created_at: string;
  updated_at: string;
};

export type ParticipantPayload = {
  first_name: string;
  last_name: string;
  email?: string | null;
  organization?: string | null;
  role?: string | null;
  record_ids: string[];
  researcher_notes?: string | null;
};

export type SessionReference = {
  id: string;
  name: string;
};

export type Session = {
  id: string;
  project_id: string;
  title: string;
  type: "interview" | "usability-test" | "focus-group" | "working-session" | "design-critique" | "other";
  starts_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  participants: Participant[];
  participant_ids: string[];
  document_count: number;
  transcript_names: string[];
  transcript_status: "none" | "uploaded" | "processing" | "complete" | "failed";
  has_primary_transcript: boolean;
  theme_status: "not-generated" | "generating" | "ai-generated" | "researcher-reviewed" | "approved" | "superseded" | "failed";
  report_status: "not-generated" | "generating" | "ai-generated" | "researcher-reviewed" | "approved" | "superseded" | "failed";
  related_records: SessionReference[];
  related_common_components: SessionReference[];
  created_at: string;
  updated_at: string;
};

export type SessionPayload = {
  title: string;
  type: Session["type"];
  starts_at?: string | null;
  duration_minutes?: number | null;
  description?: string | null;
  participant_ids: string[];
  related_record_ids?: string[];
  related_common_component_ids?: string[];
};

export type SessionFilters = {
  search?: string;
  type?: Session["type"] | "";
  transcriptStatus?: Session["transcript_status"] | "";
  analysisStatus?: Session["theme_status"] | "";
  date?: string;
  recordId?: string;
  commonComponentId?: string;
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

export type TranscriptBlock = {
  id: string;
  speaker: string;
  location: string;
  text: string;
};

export type TranscriptDocument = {
  id: string;
  project_id: string;
  session_id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: "uploaded" | "processing" | "complete" | "failed";
  is_primary: boolean;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
  blocks: TranscriptBlock[];
  source_url: string | null;
  download_url: string | null;
};

export type TranscriptSearchResult = {
  id: string;
  document_id: string;
  speaker: string;
  location: string;
  excerpt: string;
  relevance: number;
  block_index: number;
};

export type TranscriptSearchResponse = {
  query: string;
  results: TranscriptSearchResult[];
};

export type TranscriptContext = {
  document: TranscriptDocument;
  result: TranscriptSearchResult;
  passages: TranscriptBlock[];
  focused_passage_id: string;
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

export type ThemeEvidence = {
  id: string;
  theme_id: string;
  document_id: string;
  chunk_id: string;
  quote: string;
  reasoning: string;
  relevance_score: number;
  evidence_type: string;
  document_name: string | null;
  created_at: string;
};

export type Theme = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  confidence: number;
  user_notes: string | null;
  evidence_count: number;
  created_by: string;
  model: string | null;
  created_at: string;
  updated_at: string;
  evidence: ThemeEvidence[];
};

export type ThemePayload = {
  title: string;
  description: string;
  confidence: number;
  user_notes?: string | null;
};

export type ThemeEvidencePayload = {
  quote?: string;
  reasoning?: string;
  relevance_score?: number;
  evidence_type?: string;
};

export type ThemeGenerateResponse = {
  themes: Theme[];
  provider: string;
  model: string | null;
  used_mock: boolean;
  message: string;
};

export type ChatCitation = {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  text: string;
  score: number;
};

export type ChatResponse = {
  question: string;
  answer: string;
  citations: ChatCitation[];
  provider: string;
  model: string | null;
  used_mock: boolean;
  message: string;
};

export type SessionThemeEvidence = {
  id: string;
  document_id: string;
  document_name: string;
  speaker: string;
  location: string;
  excerpt: string;
  relevance: number;
  context_result_id: string;
};

export type SessionTheme = {
  id: string;
  project_id: string;
  session_id: string;
  name: string;
  summary: string;
  status: "ai-generated" | "researcher-reviewed" | "approved" | "rejected";
  confidence: number;
  source_label: string;
  evidence: SessionThemeEvidence[];
};

export type SessionThemePayload = Partial<Pick<SessionTheme, "name" | "summary" | "status">>;

export type SessionThemeGenerateResponse = {
  themes: SessionTheme[];
  message: string;
};

export type SessionReportItem = {
  id: string;
  type: "requirement" | "decision" | "action-item" | "open-question" | "key-insight";
  title: string;
  summary: string;
  provenance: string;
  evidence: SessionThemeEvidence[];
};

export type SessionReportParticipant = {
  id: string;
  name: string;
  role: string | null;
  organization: string | null;
  notes: string | null;
};

export type SessionReport = {
  id: string;
  project_id: string;
  session_id: string;
  status: "ai-generated" | "researcher-reviewed" | "approved" | "superseded";
  session_title: string;
  session_type: string;
  session_date: string;
  duration_minutes: number | null;
  participants: SessionReportParticipant[];
  executive_summary: string;
  items: SessionReportItem[];
  detailed_notes: string;
  generated_at: string;
};

export type SessionReportGenerateResponse = {
  report: SessionReport;
  message: string;
};

export type SessionCitation = {
  id: string;
  document_id: string;
  document_name: string;
  speaker: string;
  location: string;
  excerpt: string;
  context_result_id: string;
};

export type SessionConversationTurn = {
  id: string;
  role: "researcher" | "assistant";
  content: string;
  citations: SessionCitation[];
  created_at: string;
};

export type SessionConversation = {
  id: string;
  project_id: string;
  session_id: string;
  status: "saved" | "archived" | "deleted";
  turns: SessionConversationTurn[];
};

export type AskSessionResponse = {
  conversation: SessionConversation;
  answer: SessionConversationTurn;
};
