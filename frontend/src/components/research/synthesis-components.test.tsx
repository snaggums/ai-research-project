import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toSessionConversation, toSessionReport, toSessionTheme } from "@/adapters/synthesis";
import { sessionConversationFixture, sessionReportFixture, sessionThemeFixtures, suggestedSessionQuestions } from "@/mocks/fixtures/synthesis";
import { AskThisSession } from "./ask-this-session";
import { SessionReport } from "./session-report";
import { ThemeCard } from "./theme-card";
import { ThemeEvidenceDetail } from "./theme-evidence-detail";

describe("Session synthesis Research Objects", () => {
  it("keeps Theme Card evidence concise and opens the complete evidence detail", async () => {
    const onReview = vi.fn();
    const user = userEvent.setup();
    const theme = toSessionTheme(sessionThemeFixtures[0]);
    const { rerender } = render(<ThemeCard onReview={onReview} theme={theme} />);
    expect(screen.getByText("Supporting evidence")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Supporting evidence/ }));
    expect(onReview).toHaveBeenCalledOnce();
    rerender(<ThemeEvidenceDetail contextHref={() => "#context"} theme={theme} />);
    expect(screen.getAllByRole("link", { name: /Open transcript context/ })).toHaveLength(3);
  });

  it("renders Session Report sections in the approved canonical order", () => {
    render(<SessionReport report={toSessionReport(sessionReportFixture)} />);
    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings.indexOf("Requirements")).toBeLessThan(headings.indexOf("Decisions"));
    expect(headings.indexOf("Decisions")).toBeLessThan(headings.indexOf("Action Items"));
    expect(headings.indexOf("Action Items")).toBeLessThan(headings.indexOf("Open Questions"));
    expect(headings.indexOf("Open Questions")).toBeLessThan(headings.indexOf("Key Insights"));
  });

  it("submits a suggested Ask question while preserving the Search versus Ask distinction", async () => {
    const onAsk = vi.fn();
    const user = userEvent.setup();
    render(<AskThisSession conversation={toSessionConversation(sessionConversationFixture)} onAsk={onAsk} projectId="alpha-project" sessionId="mobile-checkout-test" suggestedQuestions={suggestedSessionQuestions} />);
    await user.click(screen.getByRole("button", { name: suggestedSessionQuestions[0] }));
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(onAsk).toHaveBeenCalledWith(suggestedSessionQuestions[0]);
    expect(screen.getByText(/Generate a grounded answer/)).toBeInTheDocument();
  });
});
