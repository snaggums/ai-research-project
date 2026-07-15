import type {
  ParticipantSummary,
  ProductReference,
  ProjectSummary,
  SessionSummary,
  TranscriptDocumentSummary,
} from "@/domain/types";

export const recordReferences: ProductReference[] = [
  { id: "record-checkout", name: "Record 1" },
  { id: "record-navigation", name: "Record 2" },
];

export const commonComponentReferences: ProductReference[] = [
  { id: "common-search", name: "Search" },
  { id: "common-navigation", name: "Navigation" },
];

export const alphaProject: ProjectSummary = {
  id: "alpha-project",
  name: "Alpha Project",
  description:
    "Understand how participants move through checkout and where the experience creates uncertainty.",
  participantCount: 4,
  sessionCount: 4,
  readyTranscriptCount: 3,
  updatedAt: "2026-07-12T16:30:00.000Z",
};

export const checkoutResearchProject: ProjectSummary = {
  id: "checkout-research-project",
  name: "Checkout research project",
  description: "Evaluate the checkout flow and identify opportunities to reduce abandonment.",
  participantCount: 12,
  sessionCount: 4,
  readyTranscriptCount: 4,
  updatedAt: "2026-07-12T16:30:00.000Z",
};

export const participants: ParticipantSummary[] = [
  {
    id: "alex-morgan",
    projectId: alphaProject.id,
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@example.com",
    organization: "Northstar Retail",
    role: "Product manager",
    recordIds: [recordReferences[0].id],
    sessionCount: 2,
    researcherNotes: "Interested in faster checkout reporting.",
  },
  {
    id: "jordan-lee",
    projectId: alphaProject.id,
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@example.com",
    organization: "Fieldstone Labs",
    role: "Design lead",
    recordIds: [recordReferences[1].id],
    sessionCount: 1,
  },
  {
    id: "sam-rivera",
    projectId: alphaProject.id,
    firstName: "Sam",
    lastName: "Rivera",
    organization: "Independent",
    role: "Research participant",
    recordIds: [],
    sessionCount: 1,
  },
];

export const sessions: SessionSummary[] = [
  {
    id: "checkout-interview",
    projectId: alphaProject.id,
    title: "Checkout workflow interview",
    type: "interview",
    startsAt: "2026-07-08T14:00:00.000Z",
    durationMinutes: 45,
    participants: [participants[0]],
    documentCount: 1,
    transcriptStatus: "complete",
    hasPrimaryTranscript: true,
    themeStatus: "researcher-reviewed",
    reportStatus: "ai-generated",
    relatedRecords: [recordReferences[0]],
    relatedCommonComponents: [commonComponentReferences[0]],
    updatedAt: "2026-07-12T16:30:00.000Z",
  },
  {
    id: "mobile-checkout-test",
    projectId: alphaProject.id,
    title: "Mobile checkout usability test",
    type: "usability-test",
    startsAt: "2026-07-10T14:00:00.000Z",
    durationMinutes: 60,
    participants: [participants[0], participants[1], participants[2]],
    documentCount: 1,
    transcriptStatus: "processing",
    themeStatus: "not-generated",
    reportStatus: "not-generated",
    relatedRecords: [recordReferences[0]],
    relatedCommonComponents: [commonComponentReferences[1]],
    updatedAt: "2026-07-13T13:45:00.000Z",
  },
  {
    id: "navigation-focus-group",
    projectId: alphaProject.id,
    title: "Navigation terminology focus group",
    type: "focus-group",
    startsAt: "2026-07-11T17:30:00.000Z",
    durationMinutes: 75,
    participants: [participants[1], participants[2]],
    documentCount: 0,
    transcriptStatus: "none",
    themeStatus: "not-generated",
    reportStatus: "not-generated",
    relatedRecords: [recordReferences[1]],
    relatedCommonComponents: [commonComponentReferences[1]],
    updatedAt: "2026-07-11T19:00:00.000Z",
  },
  {
    id: "checkout-working-session",
    projectId: alphaProject.id,
    title: "Checkout synthesis working session",
    type: "working-session",
    startsAt: "2026-07-12T15:00:00.000Z",
    durationMinutes: 45,
    participants: [participants[0], participants[1]],
    documentCount: 1,
    transcriptStatus: "failed",
    themeStatus: "generating",
    reportStatus: "not-generated",
    relatedRecords: recordReferences,
    relatedCommonComponents: commonComponentReferences,
    updatedAt: "2026-07-14T09:15:00.000Z",
  },
];

export const primaryTranscript: TranscriptDocumentSummary = {
  id: "checkout-transcript",
  projectId: alphaProject.id,
  sessionId: sessions[0].id,
  filename: "checkout-workflow-interview.txt",
  mimeType: "text/plain",
  sizeBytes: 48211,
  status: "complete",
  isPrimary: true,
  uploadedAt: "2026-07-08T15:00:00.000Z",
  processedAt: "2026-07-08T15:02:00.000Z",
};
