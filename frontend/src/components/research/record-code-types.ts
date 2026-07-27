export type RecordCodeSortValue =
  | "most-highlights"
  | "most-sessions"
  | "most-recent-evidence"
  | "name-asc"
  | "name-desc";

export const recordCodeSortOptions = [
  { label: "Most highlights", value: "most-highlights" },
  { label: "Most Sessions", value: "most-sessions" },
  { label: "Most recent evidence", value: "most-recent-evidence" },
  { label: "Name A–Z", value: "name-asc" },
  { label: "Name Z–A", value: "name-desc" },
] satisfies Array<{ label: string; value: RecordCodeSortValue }>;

export interface RecordCodeSummaryValue {
  acceptedHighlightCount: number;
  description: string;
  eligibleSessionCount: number;
  id: string;
  latestEvidenceAt: string;
  latestEvidenceLabel: string;
  name: string;
}

export interface RecordCodeSupportingHighlightValue {
  excerpt: string;
  id: string;
  location: string;
  projectId: string;
  projectName: string;
  sessionId: string;
  sessionTitle: string;
  speaker: string;
}

export interface RecordCodeEvidenceGroupValue {
  highlights: RecordCodeSupportingHighlightValue[];
  sessionId: string;
  sessionTitle: string;
}

export interface RecordCodeDetailValue extends RecordCodeSummaryValue {
  evidenceGroups: RecordCodeEvidenceGroupValue[];
  knowledgeItemCount: number;
}
