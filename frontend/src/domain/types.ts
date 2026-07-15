export type EntityId = string;

export type LifecycleStatus =
  | "ai-generated"
  | "researcher-reviewed"
  | "approved"
  | "superseded";

export type ProcessingStatus = "uploaded" | "processing" | "complete" | "failed";

export type SessionType =
  | "interview"
  | "usability-test"
  | "focus-group"
  | "working-session"
  | "design-critique"
  | "other";

export type ProductReference = {
  id: EntityId;
  name: string;
};

export type ProjectSummary = {
  id: EntityId;
  name: string;
  description?: string;
  participantCount: number;
  sessionCount: number;
  readyTranscriptCount?: number;
  updatedAt: string;
};

export type ParticipantSummary = {
  id: EntityId;
  projectId: EntityId;
  firstName: string;
  lastName: string;
  email?: string;
  organization?: string;
  persona?: string;
  referenceId?: string;
  role?: string;
  recordIds: EntityId[];
  sessionCount: number;
  researcherNotes?: string;
};

export type SessionSummary = {
  id: EntityId;
  projectId: EntityId;
  title: string;
  type: SessionType;
  startsAt?: string;
  durationMinutes?: number;
  participants: ParticipantSummary[];
  documentCount: number;
  transcriptStatus: ProcessingStatus | "none";
  hasPrimaryTranscript?: boolean;
  themeStatus: "not-generated" | "generating" | LifecycleStatus | "failed";
  reportStatus: "not-generated" | "generating" | LifecycleStatus | "failed";
  relatedRecords: ProductReference[];
  relatedCommonComponents: ProductReference[];
  updatedAt: string;
};

export type TranscriptDocumentSummary = {
  id: EntityId;
  projectId: EntityId;
  sessionId: EntityId;
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  status: ProcessingStatus;
  isPrimary: boolean;
  uploadedAt: string;
  processedAt?: string;
  errorMessage?: string;
};

export type TranscriptBlock = {
  id: EntityId;
  speaker: string;
  location: string;
  text: string;
};

export type TranscriptDocumentDetail = TranscriptDocumentSummary & {
  blocks: TranscriptBlock[];
  sourceUrl?: string;
  downloadUrl?: string;
};

export type TranscriptSearchResult = {
  id: EntityId;
  documentId: EntityId;
  speaker: string;
  location: string;
  excerpt: string;
  relevance: number;
  blockIndex: number;
};

export type TranscriptContext = {
  document: TranscriptDocumentDetail;
  result: TranscriptSearchResult;
  passages: TranscriptBlock[];
  focusedPassageId: EntityId;
};

export type ThemeStatus =
  | "ai-generated"
  | "researcher-reviewed"
  | "approved"
  | "rejected";

export type SessionReportStatus = LifecycleStatus;

export type SessionReportItemType =
  | "requirement"
  | "decision"
  | "action-item"
  | "open-question"
  | "key-insight";

export type ThemeEvidenceDetail = {
  id: EntityId;
  documentId: EntityId;
  documentName: string;
  speaker: string;
  location: string;
  excerpt: string;
  relevance: number;
  contextResultId: EntityId;
};

export type SessionTheme = {
  id: EntityId;
  projectId: EntityId;
  sessionId: EntityId;
  name: string;
  summary: string;
  status: ThemeStatus;
  confidence: number;
  sourceLabel: string;
  evidence: ThemeEvidenceDetail[];
};

export type SessionReportItem = {
  id: EntityId;
  type: SessionReportItemType;
  title: string;
  summary: string;
  provenance: string;
  evidence: ThemeEvidenceDetail[];
};

export type SessionReportParticipant = {
  id: EntityId;
  name: string;
  role?: string;
  organization?: string;
  notes?: string;
};

export type SessionReport = {
  id: EntityId;
  projectId: EntityId;
  sessionId: EntityId;
  status: SessionReportStatus;
  sessionTitle: string;
  sessionType: string;
  sessionDate: string;
  durationMinutes?: number;
  participants: SessionReportParticipant[];
  executiveSummary: string;
  items: SessionReportItem[];
  detailedNotes: string;
  generatedAt: string;
};

export type SessionCitation = {
  id: EntityId;
  documentId: EntityId;
  documentName: string;
  speaker: string;
  location: string;
  excerpt: string;
  contextResultId: EntityId;
};

export type SessionConversationTurn = {
  id: EntityId;
  role: "researcher" | "assistant";
  content: string;
  citations: SessionCitation[];
  createdAt: string;
};

export type SessionConversation = {
  id: EntityId;
  projectId: EntityId;
  sessionId: EntityId;
  status: "saved" | "archived" | "deleted";
  turns: SessionConversationTurn[];
};
