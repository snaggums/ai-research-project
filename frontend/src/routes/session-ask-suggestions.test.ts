import {
  defaultSessionSuggestedQuestions,
  sessionSuggestedQuestions,
} from "./session-ask-suggestions";

describe("sessionSuggestedQuestions", () => {
  it.each([
    [
      "Medicare Fraud Documenter - S001",
      "Does the redesigned workflow support the investigative process?",
      "How do investigators make decisions?",
    ],
    [
      "Medicare Fraud Documenter - S002",
      "What safeguards can be added to instill confidence?",
      "How can submission records preserve auditability?",
    ],
    [
      "Medicare Fraud Documenter - S003",
      "How can we avoid duplications?",
      "What do investigators need to know their information is ready to submit?",
    ],
    [
      "Medicare Fraud Documenter - S004",
      "How has the workflow improved with the redesign?",
      "How is a case closed?",
    ],
    [
      "Medicare Fraud Documenter - S005",
      "How does the redesign support supervisors?",
      "What is needed to preserve the case chronology?",
    ],
    [
      "Medicaid Fraud Documenter - S001",
      "What State-specific safeguards should be considered?",
      "How can we improve the redesigned workflow?",
    ],
  ])(
    "uses the approved questions for %s",
    (title, firstQuestion, secondQuestion) => {
      expect(sessionSuggestedQuestions(title)).toEqual([
        firstQuestion,
        secondQuestion,
        defaultSessionSuggestedQuestions[2],
      ]);
    },
  );

  it("retains the default questions for other Sessions", () => {
    expect(sessionSuggestedQuestions("Mobile checkout usability test")).toEqual(
      defaultSessionSuggestedQuestions,
    );
  });
});
