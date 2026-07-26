import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toSessionConversation, toSessionReport, toSessionTheme } from "@/adapters/synthesis";
import { sessionConversationFixture, sessionReportFixture, sessionThemeFixtures, suggestedSessionQuestions } from "@/mocks/fixtures/synthesis";
import { AskThisSessionWorkspaceView, SessionReportWorkspaceView, SessionThemesWorkspaceView } from "./synthesis-views";

const axeOptions = { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } };

describe("Session synthesis workspace accessibility", () => {
  it("has no automated violations in Themes, Report, and Ask ready states", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<SessionThemesWorkspaceView onGenerate={() => undefined} projectId="alpha-project" sessionId="mobile-checkout-test" themes={sessionThemeFixtures.map(toSessionTheme)} />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
    rerender(<SessionReportWorkspaceView onGenerate={() => undefined} report={toSessionReport(sessionReportFixture)} />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
    await user.click(screen.getByRole("button", { name: toSessionReport(sessionReportFixture).items[0].title }));
    await user.click(screen.getAllByRole("button", { name: "Open evidence" })[0]);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
    rerender(<AskThisSessionWorkspaceView conversation={toSessionConversation(sessionConversationFixture)} onAsk={() => undefined} projectId="alpha-project" sessionId="mobile-checkout-test" suggestedQuestions={suggestedSessionQuestions} />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });

  it("has no automated violations in the open report-item editor and ownership listbox", async () => {
    const user = userEvent.setup();
    const report = toSessionReport(sessionReportFixture);
    render(<SessionReportWorkspaceView onEditItem={() => undefined} onGenerate={() => undefined} report={report} />);
    const decision = report.items.find((item) => item.type === "decision")!;
    await user.click(screen.getByRole("button", { name: decision.title }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Edit report item" });
    await user.click(screen.getByRole("combobox", { name: /Decision maker/ }));
    expect((await axe.run(dialog, axeOptions)).violations).toEqual([]);
  });
});
