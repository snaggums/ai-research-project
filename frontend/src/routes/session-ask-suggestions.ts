export const defaultSessionSuggestedQuestions = [
  "What caused participants to lose confidence during checkout?",
  "What evidence supports keeping the order summary visible?",
  "What should we test in the next session?",
];

const firstTwoQuestionsBySessionTitle: Record<string, [string, string]> = {
  "medicare fraud documenter - s001": [
    "Does the redesigned workflow support the investigative process?",
    "How do investigators make decisions?",
  ],
  "medicare fraud documenter - s002": [
    "What safeguards can be added to instill confidence?",
    "How can submission records preserve auditability?",
  ],
  "medicare fraud documenter - s003": [
    "How can we avoid duplications?",
    "What do investigators need to know their information is ready to submit?",
  ],
  "medicare fraud documenter - s004": [
    "How has the workflow improved with the redesign?",
    "How is a case closed?",
  ],
  "medicare fraud documenter - s005": [
    "How does the redesign support supervisors?",
    "What is needed to preserve the case chronology?",
  ],
  "medicaid fraud documenter - s001": [
    "What State-specific safeguards should be considered?",
    "How can we improve the redesigned workflow?",
  ],
};

export function sessionSuggestedQuestions(sessionTitle: string) {
  const firstTwo = firstTwoQuestionsBySessionTitle[sessionTitle.trim().toLowerCase()];
  return firstTwo
    ? [...firstTwo, defaultSessionSuggestedQuestions[2]]
    : defaultSessionSuggestedQuestions;
}
