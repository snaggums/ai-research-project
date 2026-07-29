import type { TranscriptDocument, TranscriptSearchResult } from "@/api/types";

export const transcriptBlocks = [
  { id: "passage-1", speaker: "Maya Chen (Moderator)", location: "00:00:58", text: "Before you move on, tell me what you expect to stay visible as you enter delivery information." },
  { id: "passage-2", speaker: "Jordan Moore", location: "00:01:12", text: "I expected the cart summary to stay visible while I entered delivery information. When it disappeared, I wasn’t sure whether my items were still saved." },
  { id: "passage-3", speaker: "Maya Chen (Moderator)", location: "00:02:41", text: "What would make that step feel more trustworthy?" },
  { id: "passage-4", speaker: "Jordan Moore", location: "00:02:48", text: "A compact order summary and a clear progress indicator would help me understand where I am." },
];

export const transcriptApiFixtures: TranscriptDocument[] = [
  {
    id: "checkout-transcript", project_id: "alpha-project", session_id: "mobile-checkout-test",
    filename: "mobile-checkout-interview.docx", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size_bytes: 1887436,
    status: "complete", lifecycle_status: "active", is_primary: true, uploaded_at: "2026-07-12T14:42:00Z", processed_at: "2026-07-12T14:44:00Z", error_message: null,
    blocks: transcriptBlocks, source_url: "#open-source", download_url: "#download-source",
  },
  {
    id: "processing-transcript", project_id: "alpha-project", session_id: "checkout-interview",
    filename: "checkout-workflow-interview.txt", mime_type: "text/plain", size_bytes: 48211,
    status: "processing", lifecycle_status: "legacy", is_primary: false, uploaded_at: "2026-07-13T15:00:00Z", processed_at: null, error_message: null,
    blocks: [], source_url: null, download_url: "#download-processing-source",
  },
  {
    id: "failed-transcript", project_id: "alpha-project", session_id: "checkout-working-session",
    filename: "synthesis-working-session.pdf", mime_type: "application/pdf", size_bytes: 822476,
    status: "failed", lifecycle_status: "legacy", is_primary: false, uploaded_at: "2026-07-14T09:00:00Z", processed_at: null, error_message: "AIR could not extract text from this source.",
    blocks: [], source_url: null, download_url: "#download-failed-source",
  },
];

export const transcriptSearchFixtures: TranscriptSearchResult[] = [
  { id: "result-1", document_id: "checkout-transcript", speaker: "Jordan Moore", location: "00:01:12", excerpt: "The navigation confusion started when the cart summary disappeared while I entered delivery information.", relevance: 1, block_index: 1 },
  { id: "result-2", document_id: "checkout-transcript", speaker: "Maya Chen (Moderator)", location: "00:00:58", excerpt: "What navigation confusion stood out while you moved from the cart into checkout?", relevance: 1, block_index: 0 },
  { id: "result-3", document_id: "checkout-transcript", speaker: "Jordan Moore", location: "00:02:48", excerpt: "The navigation confusion would be reduced by a clear progress indicator and persistent order summary.", relevance: 1, block_index: 3 },
];
