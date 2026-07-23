import type {
  RecordCode,
  TranscriptCodeSuggestion,
  TranscriptCodingWorkspace,
  TranscriptHighlight,
} from "@/api/types";
import type {
  TranscriptCodeValue,
  TranscriptEvidenceValue,
  TranscriptHighlightValue,
  TranscriptReaderBlockValue,
} from "@/components/research";
import type { TranscriptCodingSuggestionValue } from "@/pages/transcript-coding-views";

export function toTranscriptCode(code: RecordCode): TranscriptCodeValue {
  return {
    id: code.id,
    name: code.name,
    description: code.description ?? undefined,
  };
}

function toEvidence(
  evidence: TranscriptHighlight["anchor"] | TranscriptCodeSuggestion["evidence"][number],
  fallbackId: string,
): TranscriptEvidenceValue {
  const anchor = "anchor" in evidence ? evidence.anchor : evidence;
  return {
    id: "id" in evidence ? evidence.id : fallbackId,
    blockId: anchor.block_id ?? undefined,
    startOffset: undefined,
    endOffset: undefined,
    excerpt: anchor.excerpt_snapshot,
    location: anchor.location ?? "Transcript passage",
    speaker: anchor.speaker ?? undefined,
  };
}

export function toTranscriptHighlight(highlight: TranscriptHighlight): TranscriptHighlightValue {
  return {
    id: highlight.id,
    codes: highlight.codes.filter((code) => code.status === "active").map(toTranscriptCode),
    evidence: toEvidence(highlight.anchor, `evidence-${highlight.id}`),
    provenance: highlight.origin === "ai-suggestion"
      ? "Researcher accepted AI suggestion"
      : "Researcher highlighted",
    status: highlight.codes.some((code) => code.status === "active") ? "accepted" : "uncoded",
  };
}

export function toTranscriptCodeSuggestion(
  suggestion: TranscriptCodeSuggestion,
): TranscriptCodingSuggestionValue {
  return {
    id: suggestion.id,
    codeName: suggestion.proposed_name,
    description: suggestion.proposed_description ?? "AI-generated Code suggestion",
    confidence: suggestion.confidence ?? undefined,
    provenance: suggestion.was_edited ? "AI generated · Researcher edited" : "AI generated",
    evidence: suggestion.evidence
      .slice()
      .sort((left, right) => left.display_order - right.display_order)
      .map((evidence) => toEvidence(evidence, evidence.id)),
  };
}

export function toTranscriptReaderBlocks(workspace: TranscriptCodingWorkspace): TranscriptReaderBlockValue[] {
  return workspace.transcript.blocks.map((block) => ({
    id: block.id,
    excerpt: block.text,
    location: block.location,
    speaker: block.speaker,
    state: "default",
  }));
}
