import type {
  TranscriptCodeValue,
  TranscriptEvidenceValue,
  TranscriptHighlightValue,
  TranscriptReaderBlockValue,
} from "@/components/research/transcript-coding-types";
import type {
  RecordCode,
  TranscriptAnchor,
  TranscriptCodingWorkspace,
} from "@/api/types";

export const transcriptCodingCodes: TranscriptCodeValue[] = [
  {
    id: "code-navigation-terminology",
    name: "Navigation terminology",
    description: "Labels, grouping, and navigation language.",
  },
  {
    id: "code-workflow-confidence",
    name: "Workflow confidence",
    description: "Confidence while completing a workflow.",
  },
  {
    id: "code-information-architecture",
    name: "Information architecture",
    description: "Labels, grouping, and navigation.",
  },
];

export const transcriptCodingEvidence: TranscriptEvidenceValue[] = [
  {
    id: "evidence-navigation-primary",
    excerpt: "I expected uploaded transcripts to be under Documents, but the menu called it Source Material.",
    location: "12:45–13:02",
    speaker: "Jordan Moore",
  },
  {
    id: "evidence-navigation-secondary",
    excerpt: "I kept looking under Documents before I noticed that Source Material meant the raw transcript.",
    location: "14:08–14:22",
    speaker: "Jordan Moore",
  },
  {
    id: "evidence-confidence-primary",
    excerpt: "I paused because I was not sure whether Source Material meant the raw transcript or something already analyzed.",
    location: "13:16–13:38",
    speaker: "Jordan Moore",
  },
];

export const transcriptReaderBlocks: TranscriptReaderBlockValue[] = [
  {
    id: "reader-question-one",
    excerpt: "Where would you expect to find uploaded research after a session?",
    location: "12:31–12:44",
    speaker: "Maya Chen",
    state: "default",
  },
  {
    ...transcriptCodingEvidence[0],
    id: "reader-navigation",
    state: "selection-active",
  },
  {
    id: "reader-question-two",
    excerpt: "What made that label confusing in the moment?",
    location: "13:03–13:15",
    speaker: "Maya Chen",
    state: "default",
  },
  {
    ...transcriptCodingEvidence[2],
    id: "reader-confidence",
    state: "default",
  },
  {
    id: "reader-question-three",
    excerpt: "What label would have helped you continue with confidence?",
    location: "13:39–13:52",
    speaker: "Maya Chen",
    state: "default",
  },
];

export const importedTemplatedTranscriptBlocks: TranscriptReaderBlockValue[] = [
  {
    id: "imported-s003-1",
    excerpt: "Please send a secure message about your parent's medication.",
    location: "0:00",
    speaker: "Maya Chen",
    state: "default",
  },
  {
    id: "imported-s003-2",
    excerpt: "I am looking for Messages. I see it, but I want to confirm I am in my mother's account.",
    location: "3:06",
    speaker: "Tanya",
    state: "default",
  },
  {
    id: "imported-s003-3",
    excerpt: "What tells you which account is active?",
    location: "6:13",
    speaker: "Maya Chen",
    state: "default",
  },
  {
    id: "imported-s005-role-label",
    excerpt: "The recurring issue is that teams treat each Record as unique, but users experience one system.",
    location: "0:00",
    speaker: "Jordan - UX",
    state: "default",
  },
];

export const transcriptCodingSuggestions = [
  {
    id: "suggestion-navigation",
    codeName: "Navigation terminology",
    confidence: 0.88,
    description: "Labels for uploaded research did not match participant expectations.",
    evidence: transcriptCodingEvidence.slice(0, 2),
    provenance: "AI generated • Jordan Moore",
  },
  {
    id: "suggestion-confidence",
    codeName: "Workflow confidence",
    confidence: 0.88,
    description: "The participant paused because the destination label did not communicate what happened next.",
    evidence: transcriptCodingEvidence.slice(2, 3),
    provenance: "AI generated • Jordan Moore",
  },
] as const;

export const transcriptCodingHighlights: TranscriptHighlightValue[] = [
  {
    id: "highlight-navigation",
    codes: [transcriptCodingCodes[0]],
    evidence: transcriptCodingEvidence[0],
    provenance: "Researcher accepted",
    status: "accepted",
  },
  {
    id: "highlight-confidence",
    codes: [transcriptCodingCodes[1]],
    evidence: transcriptCodingEvidence[2],
    provenance: "Researcher accepted",
    status: "accepted",
  },
  {
    id: "highlight-uncoded",
    codes: [],
    evidence: transcriptCodingEvidence[1],
    provenance: "Researcher highlighted",
    status: "uncoded",
  },
];

const fixtureTimestamp = "2026-07-20T12:00:00Z";
const fixtureChecksum = "sha256:transcript-coding-fixture";

function apiCode(code: TranscriptCodeValue): RecordCode {
  return {
    id: code.id,
    record_id: "record-1",
    name: code.name,
    description: code.description ?? null,
    status: "active",
    created_at: fixtureTimestamp,
    updated_at: fixtureTimestamp,
  };
}

const codingBlocks = transcriptReaderBlocks.reduce<Array<TranscriptCodingWorkspace["transcript"]["blocks"][number]>>(
  (blocks, block) => {
    const start = blocks.length === 0 ? 0 : blocks[blocks.length - 1].end_char + 1;
    blocks.push({
      id: block.id,
      chunk_id: block.id,
      speaker: block.speaker ?? "Speaker",
      location: block.location,
      text: block.excerpt,
      start_char: start,
      end_char: start + block.excerpt.length,
    });
    return blocks;
  },
  [],
);

function anchorForEvidence(evidence: TranscriptEvidenceValue): TranscriptAnchor {
  const block = codingBlocks.find((candidate) =>
    candidate.id === evidence.blockId || candidate.text === evidence.excerpt,
  );
  return {
    document_id: "checkout-transcript",
    chunk_id: block?.chunk_id ?? null,
    block_id: block?.id ?? evidence.blockId ?? null,
    start_char: block?.start_char ?? 0,
    end_char: (block?.start_char ?? 0) + evidence.excerpt.length,
    excerpt_snapshot: evidence.excerpt,
    speaker: evidence.speaker ?? null,
    location: evidence.location,
    start_ms: null,
    end_ms: null,
    content_checksum: fixtureChecksum,
  };
}

export const transcriptCodingApiFixture: TranscriptCodingWorkspace = {
  project_id: "alpha-project",
  session_id: "mobile-checkout-test",
  document_id: "checkout-transcript",
  record: { id: "record-1", name: "Record 1" },
  transcript: {
    content_checksum: fixtureChecksum,
    blocks: codingBlocks,
  },
  suggestion_run: {
    id: "coding-run-1",
    status: "complete",
    error_detail: null,
  },
  codes: transcriptCodingCodes.map(apiCode),
  highlights: transcriptCodingHighlights.map((highlight) => ({
    id: highlight.id,
    project_id: "alpha-project",
    session_id: "mobile-checkout-test",
    document_id: "checkout-transcript",
    anchor: anchorForEvidence(highlight.evidence),
    origin: highlight.provenance?.includes("AI") ? "ai-suggestion" : "researcher",
    codes: highlight.codes.map(apiCode),
    created_at: fixtureTimestamp,
    updated_at: fixtureTimestamp,
    deleted_at: null,
  })),
  suggestions: transcriptCodingSuggestions.map((suggestion, suggestionIndex) => ({
    id: suggestion.id,
    run_id: "coding-run-1",
    record_id: "record-1",
    proposed_name: suggestion.codeName,
    proposed_description: suggestion.description,
    confidence: suggestion.confidence,
    status: "awaiting-review",
    was_edited: false,
    accepted_code_id: null,
    reviewed_at: null,
    evidence: suggestion.evidence.map((evidence, evidenceIndex) => ({
      id: evidence.id,
      anchor: anchorForEvidence(evidence),
      display_order: suggestionIndex * 10 + evidenceIndex,
    })),
  })),
};
