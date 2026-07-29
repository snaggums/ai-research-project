export type Project = {
  id: string;
  name: string;
  description: string | null;
  participant_count: number;
  session_count: number;
  ready_transcript_count: number;
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
  lifecycle_status: "active" | "legacy" | "replacement-pending" | "replacement-failed" | "tombstoned";
  is_primary: boolean;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
  blocks: TranscriptBlock[];
  source_url: string | null;
  download_url: string | null;
};

export type TranscriptDependencySummary = {
  is_primary: boolean;
  accepted_highlight_count: number;
  uncoded_highlight_count: number;
  code_suggestion_run_count: number;
  session_report_count: number;
  record_synthesis_count: number;
  retention_consequence: "preserve-lineage";
  version: string;
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

export type TranscriptCodingBlock = TranscriptBlock & {
  chunk_id: string | null;
  start_char: number;
  end_char: number;
};

export type TranscriptAnchor = {
  document_id: string;
  chunk_id: string | null;
  block_id: string | null;
  start_char: number;
  end_char: number;
  excerpt_snapshot: string;
  speaker: string | null;
  location: string | null;
  start_ms: number | null;
  end_ms: number | null;
  content_checksum: string;
};

export type RecordCode = {
  id: string;
  record_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export type RecordCodeSupportingHighlight = {
  id: string;
  project_id: string;
  project_name: string;
  session_id: string;
  session_title: string;
  excerpt: string;
  speaker: string | null;
  location: string | null;
};

export type RecordCodeEvidenceGroup = {
  session_id: string;
  session_title: string;
  highlights: RecordCodeSupportingHighlight[];
};

export type RecordAcceptedCode = {
  id: string;
  record_id: string;
  name: string;
  description: string | null;
  accepted_highlight_count: number;
  session_count: number;
  latest_evidence_at: string;
  evidence_groups: RecordCodeEvidenceGroup[];
};

export type RecordTranscriptCodes = {
  record_id: string;
  accepted_code_count: number;
  session_count: number;
  codes: RecordAcceptedCode[];
};

export type TranscriptHighlight = {
  id: string;
  project_id: string;
  session_id: string;
  document_id: string;
  anchor: TranscriptAnchor;
  origin: "researcher" | "ai-suggestion";
  codes: RecordCode[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TranscriptCodeSuggestionEvidence = {
  id: string;
  anchor: TranscriptAnchor;
  display_order: number;
};

export type TranscriptCodeSuggestion = {
  id: string;
  run_id: string;
  record_id: string;
  proposed_name: string;
  proposed_description: string | null;
  confidence: number | null;
  status: "awaiting-review" | "accepted" | "rejected";
  was_edited: boolean;
  accepted_code_id: string | null;
  reviewed_at: string | null;
  evidence: TranscriptCodeSuggestionEvidence[];
};

export type TranscriptCodingWorkspace = {
  project_id: string;
  session_id: string;
  document_id: string;
  record: SessionReference | null;
  transcript: {
    content_checksum: string;
    blocks: TranscriptCodingBlock[];
  };
  suggestion_run: {
    id: string | null;
    status: "idle" | "queued" | "processing" | "complete" | "failed";
    error_detail: string | null;
  };
  codes: RecordCode[];
  highlights: TranscriptHighlight[];
  suggestions: TranscriptCodeSuggestion[];
};

export type CreateTranscriptHighlightPayload = {
  anchor: Omit<TranscriptAnchor, "document_id" | "chunk_id" | "start_ms" | "end_ms"> & {
    chunk_id?: string | null;
    start_ms?: number | null;
    end_ms?: number | null;
  };
  code_ids: string[];
  new_code: { name: string; description?: string | null } | null;
};

export type UpdateTranscriptHighlightPayload = {
  code_ids: string[];
};

export type CreateRecordCodePayload = {
  name: string;
  description?: string | null;
};

export type UpdateRecordCodePayload = Partial<CreateRecordCodePayload>;

export type UpdateTranscriptCodeSuggestionPayload = {
  proposed_name?: string;
  proposed_description?: string | null;
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
  session_id: string;
  session_title: string;
  speaker: string;
  location: string;
  context_result_id: string;
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
  ownership: {
    role: "decision-maker" | "assignee";
    value: string | null;
    status: "ai-suggested" | "confirmed" | "confirmed-empty" | "needs-review";
    rationale: string | null;
  } | null;
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

export type SessionReportPayload = Partial<Pick<SessionReport, "status" | "executive_summary" | "detailed_notes">>;
export type SessionReportItemPayload = Partial<Pick<SessionReportItem, "title" | "summary">> & {
  ownership?: {
    status: "confirmed" | "confirmed-empty";
    value?: string | null;
  };
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

export type RecordCatalogItem = {
  id: string;
  name: string;
  description: string;
  related_session_count: number;
  eligible_session_count: number;
  readiness: "ready" | "needs-data" | "up-to-date";
  latest_synthesis_at: string | null;
  approved_report_count?: number;
  knowledge_item_count?: number;
  knowledge_updated_at?: string | null;
};

export type RecordSynthesisSourceSession = {
  id: string;
  title: string;
  report_id: string;
  report_status: "ai-generated" | "researcher-reviewed" | "approved" | "superseded";
};

export type RecordSynthesisExcludedSession = {
  id: string;
  title: string;
  reason: string;
};

export type RecordSynthesisEligibility = {
  record_id: string;
  description: string;
  minimum_eligible_sessions: number;
  included_sessions: RecordSynthesisSourceSession[];
  excluded_sessions: RecordSynthesisExcludedSession[];
};

export type RecordSynthesisItem = {
  id: string;
  type: "requirement" | "decision" | "action-item";
  status: "ai-generated" | "researcher-reviewed" | "approved" | "superseded";
  title: string;
  summary: string;
  evidence_preview: string;
  source_session_count: number;
  source_report_item_count: number;
  provenance: string;
  evidence_ids: string[];
};

export type RecordSynthesis = {
  id: string;
  record_id: string;
  status: "not-generated" | "processing" | "complete" | "failed";
  generated_at: string | null;
  source_session_count: number;
  source_report_revision_count: number;
  provider: string | null;
  model: string | null;
  prompt_version: string | null;
  items: RecordSynthesisItem[];
  error_message: string | null;
};

export type RecordSynthesisEvidence = {
  id: string;
  record_id: string;
  item_id: string;
  item_title: string;
  project_id: string;
  session_id: string;
  session_title: string;
  context: TranscriptContext;
};

export type RecordKnowledgeOwnership = {
  role: "decision-maker" | "assignee";
  value: string | null;
  status: "ai-suggested" | "confirmed" | "confirmed-empty" | "needs-review";
  rationale: string | null;
};

export type RecordKnowledgeItem = {
  id: string;
  type: "requirement" | "decision" | "action-item";
  status: "current" | "superseded";
  title: string;
  summary: string;
  provenance: string;
  ownership: RecordKnowledgeOwnership | null;
  source_project_id: string;
  source_session_id: string;
  source_session_title: string;
  source_report_id: string;
  source_report_item_id: string;
  source_report_updated_at: string;
  position: number;
  promoted_at: string;
  superseded_at: string | null;
  evidence_preview: string;
  evidence_ids: string[];
};

export type RecordKnowledge = {
  record_id: string;
  items: RecordKnowledgeItem[];
  total_count: number;
  knowledge_updated_at: string | null;
};

export type RecordKnowledgeSource = {
  session_id: string;
  session_title: string;
  report_id: string | null;
  report_status: "ai-generated" | "researcher-reviewed" | "approved" | "superseded" | null;
  promoted_item_count: number;
  included: boolean;
  reason: string | null;
};

export type RecordKnowledgeSources = {
  record_id: string;
  description: string;
  sources: RecordKnowledgeSource[];
};

export type RecordKnowledgeEvidence = RecordSynthesisEvidence;

export type RecordChatSourceAvailability = {
  record_id: string;
  primary_transcript_count: number;
  reviewed_report_count: number;
  record_knowledge_available: boolean;
  searchable: boolean;
};

export type RecordChatCitation = {
  id: string;
  reference: number;
  project_id: string;
  project_name: string;
  session_id: string;
  session_title: string;
  document_id: string;
  document_name: string;
  speaker: string;
  location: string;
  excerpt: string;
  context_result_id: string;
  relevance: "supporting" | "partial";
  score: number;
};

export type RecordChatResponse = {
  question: string;
  status: "answered" | "insufficient-evidence";
  answer: string | null;
  citations: RecordChatCitation[];
  traceability_note: string;
  record_knowledge_used: boolean;
  provider: string;
  model: string | null;
  used_mock: boolean;
};
