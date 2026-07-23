export type TranscriptHighlightStatus = "accepted" | "suggested" | "uncoded";

export type TranscriptReaderBlockState =
  | "default"
  | "selection-active"
  | "accepted-coded"
  | "uncoded"
  | "filtered-match"
  | "dimmed";

export interface TranscriptCodeValue {
  id: string;
  name: string;
  description?: string;
}

export interface TranscriptEvidenceValue {
  blockId?: string;
  endOffset?: number;
  id: string;
  excerpt: string;
  location: string;
  speaker?: string;
  startOffset?: number;
}

export interface TranscriptReaderBlockValue extends TranscriptEvidenceValue {
  codes?: TranscriptCodeValue[];
  highlighted?: boolean;
  state?: TranscriptReaderBlockState;
}

export interface TranscriptTextSelectionValue {
  blockId: string;
  endOffset: number;
  location: string;
  method: "block" | "keyboard" | "pointer";
  speaker?: string;
  startOffset: number;
  text: string;
}

export interface TranscriptHighlightValue {
  id: string;
  codes: TranscriptCodeValue[];
  evidence: TranscriptEvidenceValue;
  provenance?: string;
  status: TranscriptHighlightStatus;
}

export type TranscriptHighlightFilterStatus =
  | "all"
  | "accepted-coded"
  | "uncoded";
