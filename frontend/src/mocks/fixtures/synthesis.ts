import type { SessionConversation, SessionReport, SessionTheme, SessionThemeEvidence } from "@/api/types";

export const synthesisEvidenceFixtures: SessionThemeEvidence[] = [
  {
    id: "evidence-order-summary",
    document_id: "checkout-transcript",
    document_name: "mobile-checkout-interview.docx",
    speaker: "Jordan Moore",
    location: "00:01:12",
    excerpt: "I expected the cart summary to stay visible while I entered delivery information. When it disappeared, I wasn’t sure whether my items were still saved.",
    relevance: 0.91,
    context_result_id: "result-1",
  },
  {
    id: "evidence-progress",
    document_id: "checkout-transcript",
    document_name: "mobile-checkout-interview.docx",
    speaker: "Jordan Moore",
    location: "00:02:48",
    excerpt: "A compact order summary and a clear progress indicator would help me understand where I am.",
    relevance: 0.86,
    context_result_id: "result-3",
  },
  {
    id: "evidence-moderator",
    document_id: "checkout-transcript",
    document_name: "mobile-checkout-interview.docx",
    speaker: "Maya Chen (Moderator)",
    location: "00:00:58",
    excerpt: "What stood out as confusing while you moved from the cart into checkout?",
    relevance: 0.82,
    context_result_id: "result-2",
  },
];

export const sessionThemeFixtures: SessionTheme[] = [
  {
    id: "theme-checkout-orientation",
    project_id: "alpha-project",
    session_id: "mobile-checkout-test",
    name: "Checkout orientation and confidence",
    summary: "Participants lost confidence when the order summary disappeared and the checkout step was unclear.",
    status: "ai-generated",
    confidence: 0.82,
    source_label: "Generated from Mobile checkout usability test transcript",
    evidence: synthesisEvidenceFixtures,
  },
  {
    id: "theme-progress-visibility",
    project_id: "alpha-project",
    session_id: "mobile-checkout-test",
    name: "Progress visibility",
    summary: "A persistent progress indicator would help participants understand their location and safely move between steps.",
    status: "researcher-reviewed",
    confidence: 0.78,
    source_label: "Generated from Mobile checkout usability test transcript",
    evidence: synthesisEvidenceFixtures.slice(1),
  },
  {
    id: "theme-summary-continuity",
    project_id: "alpha-project",
    session_id: "mobile-checkout-test",
    name: "Order summary continuity",
    summary: "Keeping a compact order summary visible supports trust that cart contents remain saved.",
    status: "approved",
    confidence: 0.88,
    source_label: "Generated from Mobile checkout usability test transcript",
    evidence: synthesisEvidenceFixtures.slice(0, 2),
  },
];

export const sessionReportFixture: SessionReport = {
  id: "report-mobile-checkout",
  project_id: "alpha-project",
  session_id: "mobile-checkout-test",
  status: "ai-generated",
  session_title: "Mobile checkout usability test",
  session_type: "Usability test",
  session_date: "2026-07-10T14:00:00.000Z",
  duration_minutes: 45,
  participants: [
    { id: "alex-morgan", name: "Alex Morgan", role: "Product manager", organization: "Sky", notes: "Observed checkout and delivery tasks." },
    { id: "jordan-moore", name: "Jordan Moore", role: "Participant", organization: "Independent", notes: "Completed the mobile checkout scenario." },
  ],
  executive_summary: "The session identified orientation and trust issues during mobile checkout. Participants wanted persistent order context and clearer progress through delivery and payment.",
  items: [
    { id: "requirement-1", type: "requirement", title: "Keep order context visible", summary: "Display a compact order summary throughout checkout.", provenance: "AI Generated · 2 supporting excerpts", evidence: synthesisEvidenceFixtures.slice(0, 2), ownership: null },
    { id: "decision-1", type: "decision", title: "Use a persistent progress indicator", summary: "Show the current checkout step and completed steps on mobile.", provenance: "AI Generated · 2 supporting excerpts", evidence: synthesisEvidenceFixtures.slice(1), ownership: { role: "decision-maker", value: null, status: "needs-review", rationale: null } },
    { id: "action-1", type: "action-item", title: "Prototype summary persistence", summary: "Test a compact sticky order summary in the next usability session.", provenance: "AI Generated · 1 supporting excerpt", evidence: synthesisEvidenceFixtures.slice(0, 1), ownership: { role: "assignee", value: null, status: "needs-review", rationale: null } },
    { id: "question-1", type: "open-question", title: "How much order detail is necessary?", summary: "Validate which cart details must remain visible without crowding the mobile viewport.", provenance: "AI Generated · 1 supporting excerpt", evidence: synthesisEvidenceFixtures.slice(0, 1), ownership: null },
    { id: "insight-1", type: "key-insight", title: "Visibility supports trust", summary: "Participants interpreted missing order context as a risk that their selections had been lost.", provenance: "AI Generated · 3 supporting excerpts", evidence: synthesisEvidenceFixtures, ownership: null },
  ],
  detailed_notes: "Review the order-summary and progress-indicator concepts together so the combined layout remains clear at small viewport widths.",
  generated_at: "2026-07-12T16:30:00Z",
};

export const sessionConversationFixture: SessionConversation = {
  id: "conversation-mobile-checkout",
  project_id: "alpha-project",
  session_id: "mobile-checkout-test",
  status: "saved",
  turns: [],
};

export const suggestedSessionQuestions = [
  "What caused participants to lose confidence during checkout?",
  "What evidence supports keeping the order summary visible?",
  "What should we test in the next session?",
];
