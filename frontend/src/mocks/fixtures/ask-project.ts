import type {
  AskProjectAnswerParagraph,
  AskProjectConversationTurn,
  AskProjectSourceAvailability,
} from "@/components/research/ask-project-workspace";
import type { EvidenceCitation } from "@/components/research/evidence-citation-card";
import type { ChatResponse } from "@/api/types";

export const askProjectSuggestedQuestions = [
  "What findings appeared across Sessions?",
  "Where did participants disagree?",
  "What should the team prioritize next?",
];

export const askProjectQuestion =
  "What usability findings appeared across Project Sessions?";

export const askProjectAnswer: AskProjectAnswerParagraph[] = [
  {
    id: "project-findings-answer",
    segments: [
      {
        text: "Across Project Sessions, participants consistently needed explicit payment confirmation",
        citationReferences: [1],
      },
      {
        text: ", reassurance that entered information would persist",
        citationReferences: [2],
      },
      {
        text: ", and clear progress feedback during long-running steps",
        citationReferences: [3],
      },
      {
        text: ".",
      },
    ],
  },
];

export const askProjectCitations: EvidenceCitation[] = [
  {
    excerpt:
      "The confirmation is what told me the payment actually went through.",
    id: "project-checkout-confirmation",
    project: "Healthcare Fraud Project",
    reference: 1,
    relevance: "supporting",
    session: "Checkout usability test",
    speakerTimestamp: "Marcus • 00:08:42",
    transcript: "S014_Checkout_Transcript.docx",
    transcriptHref:
      "/projects/healthcare-fraud-project/sessions/checkout-usability-test/transcript?result=project-checkout-confirmation",
  },
  {
    excerpt:
      "I wasn’t sure whether going back would clear what I entered.",
    id: "project-persistence-reassurance",
    project: "Healthcare Fraud Project",
    reference: 2,
    relevance: "supporting",
    session: "Mobile checkout interview",
    speakerTimestamp: "Priya • 00:04:16",
    transcript: "S021_Mobile_Checkout.docx",
    transcriptHref:
      "/projects/healthcare-fraud-project/sessions/mobile-checkout-interview/transcript?result=project-persistence-reassurance",
  },
  {
    excerpt:
      "While it was processing, I could not tell whether anything was happening.",
    id: "project-progress-feedback",
    project: "Healthcare Fraud Project",
    reference: 3,
    relevance: "supporting",
    session: "Checkout follow-up",
    speakerTimestamp: "Daniel • 00:11:03",
    transcript: "S027_Checkout_Followup.docx",
    transcriptHref:
      "/projects/healthcare-fraud-project/sessions/checkout-follow-up/transcript?result=project-progress-feedback",
  },
];

export const askProjectPartialCitations: EvidenceCitation[] = [
  {
    excerpt:
      "Fewer steps can be helpful, but I still want to review the order before paying.",
    id: "project-one-click-checkout",
    project: "Healthcare Fraud Project",
    reference: 1,
    relevance: "partial",
    session: "Checkout follow-up",
    speakerTimestamp: "Daniel • 00:13:20",
    transcript: "S027_Checkout_Followup.docx",
    transcriptHref:
      "/projects/healthcare-fraud-project/sessions/checkout-follow-up/transcript?result=project-one-click-checkout",
  },
];

export const askProjectAnsweredTurns: AskProjectConversationTurn[] = [
  {
    content: askProjectQuestion,
    id: "project-findings-question",
    role: "researcher",
  },
  {
    answer: askProjectAnswer,
    citations: askProjectCitations,
    id: "project-findings-response",
    response: "answer",
    role: "assistant",
    traceabilityNote:
      "Trace: Project Sessions → searchable active transcripts → cited primary transcript passages.",
  },
];

export const askProjectGeneratingTurns: AskProjectConversationTurn[] = [
  {
    content: askProjectQuestion,
    id: "project-generating-question",
    role: "researcher",
  },
];

export const askProjectInsufficientEvidenceTurns: AskProjectConversationTurn[] =
  [
    {
      content: "Did participants prefer one-click checkout?",
      id: "project-one-click-question",
      role: "researcher",
    },
    {
      id: "project-one-click-response",
      partialCitations: askProjectPartialCitations,
      response: "insufficient-evidence",
      role: "assistant",
    },
  ];

export const emptyAskProjectSourceAvailability: AskProjectSourceAvailability[] =
  [
    { label: "Indexed transcript passages", value: "0" },
    { label: "Active transcripts", value: "0" },
    { label: "Searchable Sessions", value: "0" },
  ];

export const askProjectChatResponse: ChatResponse = {
  answer:
    "Across Project Sessions, participants needed explicit confirmation and clear progress feedback. [1]",
  citations: [
    {
      chunk_id: "project-checkout-confirmation",
      chunk_index: 0,
      context_result_id: "project-checkout-confirmation",
      document_id: "checkout-transcript",
      document_name: "S014_Checkout_Transcript.docx",
      location: "00:08:42",
      score: 0.91,
      session_id: "checkout-usability-test",
      session_title: "Checkout usability test",
      speaker: "Marcus",
      text: "The confirmation is what told me the payment actually went through.",
    },
  ],
  message: "Answered with local mock RAG.",
  model: "mock-chat",
  provider: "mock",
  question: askProjectQuestion,
  used_mock: true,
};
