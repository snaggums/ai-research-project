import type {
  RecordSummary,
  RecordSynthesis,
  RecordSynthesisItem,
  RecordSynthesisScope,
} from "@/domain/types";

export const recordSummaries: RecordSummary[] = [
  {
    id: "record-1",
    name: "Record 1",
    description: "Checkout and payment experience across interviews and usability tests.",
    relatedSessionCount: 6,
    eligibleSessionCount: 5,
    readiness: "ready",
    latestSynthesisAt: "2026-07-15T18:42:00.000Z",
  },
  {
    id: "record-2",
    name: "Record 2",
    description: "Navigation, orientation, and information-finding research.",
    relatedSessionCount: 3,
    eligibleSessionCount: 1,
    readiness: "needs-data",
  },
  {
    id: "record-3",
    name: "Record 3",
    description: "Account setup and ongoing profile-management research.",
    relatedSessionCount: 4,
    eligibleSessionCount: 4,
    readiness: "up-to-date",
    latestSynthesisAt: "2026-07-14T15:10:00.000Z",
  },
];

export const readyRecordScope: RecordSynthesisScope = {
  recordId: "record-1",
  description: "All eligible Sessions related to Record 1 are included automatically.",
  minimumEligibleSessions: 2,
  includedSessions: [
    {
      id: "checkout-interview",
      title: "Checkout usability test",
      reportId: "report-checkout-interview",
      reportStatus: "researcher-reviewed",
    },
    {
      id: "mobile-navigation-interview",
      title: "Mobile navigation interview",
      reportId: "report-mobile-navigation",
      reportStatus: "approved",
    },
  ],
  excludedSessions: [
    {
      id: "stakeholder-review",
      title: "Stakeholder review",
      reason: "Session Report is AI Generated",
    },
  ],
};

export const insufficientRecordScope: RecordSynthesisScope = {
  recordId: "record-2",
  description: "Only one eligible Session is available. At least two are required.",
  minimumEligibleSessions: 2,
  includedSessions: [readyRecordScope.includedSessions[0]],
  excludedSessions: readyRecordScope.excludedSessions,
};

export const recordSynthesisItems: RecordSynthesisItem[] = [
  {
    id: "record-requirement-confirmation",
    type: "requirement",
    status: "ai-generated",
    title: "Confirmation must communicate payment success",
    summary: "The checkout flow must confirm that payment succeeded and that order details were saved.",
    evidencePreview: "The final confirmation gave me confidence that I would not be charged twice.",
    sourceSessionCount: 2,
    sourceReportItemCount: 3,
    provenance: "mock-chat · prompt v1 · July 15, 2026",
    evidenceIds: ["evidence-confirmation-1", "evidence-confirmation-2"],
  },
  {
    id: "record-requirement-summary",
    type: "requirement",
    status: "researcher-reviewed",
    title: "Keep order context visible throughout checkout",
    summary: "A compact order summary must remain available while participants enter delivery and payment details.",
    evidencePreview: "When the summary disappeared, I was not sure whether my items were still saved.",
    sourceSessionCount: 2,
    sourceReportItemCount: 2,
    provenance: "mock-chat · prompt v1 · July 15, 2026",
    evidenceIds: ["evidence-summary-1"],
  },
  {
    id: "record-decision-progress",
    type: "decision",
    status: "approved",
    title: "Use a persistent checkout progress indicator",
    summary: "Show the current checkout step and completed steps on mobile and desktop.",
    evidencePreview: "A clear progress indicator would help me understand where I am.",
    sourceSessionCount: 2,
    sourceReportItemCount: 2,
    provenance: "mock-chat · prompt v1 · July 15, 2026",
    evidenceIds: ["evidence-progress-1"],
  },
  {
    id: "record-action-prototype",
    type: "action-item",
    status: "ai-generated",
    title: "Prototype persistent order context",
    summary: "Test a compact sticky order summary in the next checkout usability session.",
    evidencePreview: "I wanted to check the cart without leaving the form.",
    sourceSessionCount: 2,
    sourceReportItemCount: 1,
    provenance: "mock-chat · prompt v1 · July 15, 2026",
    evidenceIds: ["evidence-action-1"],
  },
];

export const recordSynthesis: RecordSynthesis = {
  id: "record-1-synthesis-2026-07-15",
  recordId: "record-1",
  status: "complete",
  generatedAt: "2026-07-15T18:42:00.000Z",
  sourceSessionCount: 2,
  sourceReportRevisionCount: 3,
  provider: "mock provider",
  model: "mock-chat",
  promptVersion: "prompt v1",
  items: recordSynthesisItems,
};
