import type {
  AskRecordAnswerParagraph,
  AskRecordConversationTurn,
  AskRecordSourceAvailability,
} from "@/components/research/ask-record-workspace";
import type { EvidenceCitation } from "@/components/research/evidence-citation-card";
import type {
  RecordChatResponse,
  RecordChatSourceAvailability,
} from "@/api/types";

export const askRecordSuggestedQuestions = [
  "What prevents participants from feeling confident after checkout?",
  "Which requirements appear across multiple Sessions?",
  "Where do reviewed findings and raw evidence disagree?",
];

export const askRecordQuestion =
  "What prevents participants from feeling confident after checkout?";

export const askRecordFollowUpQuestion =
  "Which requirements appear across multiple Sessions?";

export const askRecordAnswer: AskRecordAnswerParagraph[] = [
  {
    id: "answer-confidence",
    segments: [
      {
        text: "Participants lose confidence when the checkout flow does not clearly confirm that payment succeeded and the order was saved.",
        citationReferences: [1],
      },
      {
        text: " Confidence also drops when the confirmation omits delivery details or disappears before participants can review it.",
        citationReferences: [2, 3],
      },
    ],
  },
  {
    id: "answer-implication",
    segments: [
      {
        text: "Across the reviewed Sessions, a durable confirmation with payment, order, and delivery details is the clearest opportunity to reduce uncertainty.",
        citationReferences: [1, 2],
      },
    ],
  },
];

export const askRecordFollowUpAnswer: AskRecordAnswerParagraph[] = [
  {
    id: "answer-shared-requirements",
    segments: [
      {
        text: "Three requirements recur across the related Sessions: confirm payment success, preserve a durable order number, and keep delivery details available for review.",
        citationReferences: [1, 2],
      },
    ],
  },
  {
    id: "answer-shared-requirements-qualification",
    segments: [
      {
        text: "The confirmation requirement has the strongest support. Delivery-detail evidence is consistent but appears in fewer Sessions.",
        citationReferences: [1, 2],
      },
    ],
  },
];

export const askRecordCitations: EvidenceCitation[] = [
  {
    excerpt:
      "Once I saw the payment had gone through and the order number was saved, I knew I did not need to try again.",
    id: "checkout-confirmation",
    project: "Alpha Project",
    reference: 1,
    relevance: "supporting",
    session: "Checkout usability test",
    speakerTimestamp: "Jordan · 08:42",
    transcript: "S005_Simplified_Transcript.docx",
    transcriptHref:
      "/projects/alpha-project/sessions/checkout-usability-test/documents/s005?result=checkout-confirmation",
  },
  {
    excerpt:
      "The confirmation said complete, but I still wanted to check where it was being delivered before I closed the page.",
    id: "delivery-details",
    project: "Alpha Project",
    reference: 2,
    relevance: "supporting",
    session: "Mobile checkout interview",
    speakerTimestamp: "Priya · 14:18",
    transcript: "S004_Simplified_Transcript.docx",
    transcriptHref:
      "/projects/alpha-project/sessions/mobile-checkout-interview/documents/s004?result=delivery-details",
  },
  {
    excerpt:
      "The message disappeared so quickly that I was not sure whether the order actually finished.",
    id: "confirmation-duration",
    project: "Alpha Project",
    reference: 3,
    relevance: "supporting",
    session: "Checkout accessibility review",
    speakerTimestamp: "Marcus · 21:06",
    transcript: "S003_Simplified_Transcript.docx",
    transcriptHref:
      "/projects/alpha-project/sessions/checkout-accessibility-review/documents/s003?result=confirmation-duration",
  },
];

export const askRecordPartialCitations: EvidenceCitation[] = [
  {
    excerpt:
      "I usually save the order number because it is easier to find than the confirmation email.",
    id: "saved-order-number",
    project: "Alpha Project",
    reference: 1,
    relevance: "partial",
    session: "Post-purchase interview",
    speakerTimestamp: "Elena · 11:27",
    transcript: "S006_Simplified_Transcript.docx",
    transcriptHref:
      "/projects/alpha-project/sessions/post-purchase-interview/documents/s006?result=saved-order-number",
  },
];

const completedFirstExchange: AskRecordConversationTurn[] = [
  {
    content: askRecordQuestion,
    id: "researcher-confidence-question",
    role: "researcher",
  },
  {
    answer: askRecordAnswer,
    citations: askRecordCitations,
    id: "air-confidence-answer",
    response: "answer",
    role: "assistant",
  },
];

export const askRecordAnsweredTurns: AskRecordConversationTurn[] = [
  ...completedFirstExchange,
  {
    content: askRecordFollowUpQuestion,
    id: "researcher-shared-requirements-question",
    role: "researcher",
  },
  {
    answer: askRecordFollowUpAnswer,
    citations: askRecordCitations.slice(0, 2),
    id: "air-shared-requirements-answer",
    response: "answer",
    role: "assistant",
  },
];

export const askRecordGeneratingTurns: AskRecordConversationTurn[] = [
  ...completedFirstExchange,
  {
    content: askRecordFollowUpQuestion,
    id: "researcher-generating-follow-up",
    role: "researcher",
  },
];

export const askRecordInsufficientEvidenceTurns: AskRecordConversationTurn[] = [
  ...completedFirstExchange,
  {
    content:
      "Did participants prefer biometric verification over one-time passcodes?",
    id: "researcher-verification-question",
    role: "researcher",
  },
  {
    id: "air-verification-insufficient",
    partialCitations: askRecordPartialCitations,
    response: "insufficient-evidence",
    role: "assistant",
  },
];

export const emptyAskRecordSourceAvailability: AskRecordSourceAvailability[] = [
  { label: "Primary transcripts", value: "0" },
  { label: "Reviewed or approved Session Reports", value: "0" },
  { label: "Record Knowledge", value: "Not available" },
];

export const recordChatSourcesFixture: RecordChatSourceAvailability = {
  record_id: "record-1",
  primary_transcript_count: 3,
  reviewed_report_count: 2,
  record_knowledge_available: true,
  searchable: true,
};

export const recordChatAnswerFixture: RecordChatResponse = {
  question: askRecordQuestion,
  status: "answered",
  answer:
    "Participants lose confidence when checkout does not confirm payment success [1], preserve delivery details [2], or keep confirmation visible long enough to review [3].",
  citations: askRecordCitations.map((citation, index) => ({
    id: citation.id,
    reference: citation.reference,
    project_id: "alpha-project",
    project_name: citation.project ?? "Alpha Project",
    session_id: [
      "mobile-checkout-test",
      "checkout-interview",
      "checkout-accessibility-review",
    ][index],
    session_title: citation.session ?? "Checkout research Session",
    document_id: ["checkout-transcript", "delivery-transcript", "duration-transcript"][index],
    document_name: citation.transcript,
    speaker: citation.speakerTimestamp.split(" • ")[0],
    location: citation.speakerTimestamp.split(" • ")[1] ?? "Transcript excerpt",
    excerpt: citation.excerpt,
    context_result_id: ["result-1", "result-2", "result-3"][index],
    relevance: citation.relevance ?? "supporting",
    score: 0.91 - index * 0.05,
  })),
  traceability_note:
    "Trace: latest Record Knowledge → reviewed Session Report items → cited primary transcript passages.",
  record_knowledge_used: true,
  provider: "mock",
  model: "mock-chat",
  used_mock: true,
};
