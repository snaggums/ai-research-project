import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toSessionReport, toSessionTheme } from "@/adapters/synthesis";
import type { SessionReport } from "@/domain/types";
import { sessionReportFixture, sessionThemeFixtures } from "@/mocks/fixtures/synthesis";
import { SessionReportWorkspaceView, type SessionReportWorkspaceViewProps, SessionThemesWorkspaceView } from "./synthesis-views";

function StatefulReportWorkspace() {
  const [report, setReport] = React.useState<SessionReport>(toSessionReport(sessionReportFixture));
  const editItem: NonNullable<SessionReportWorkspaceViewProps["onEditItem"]> = (itemId, payload) => {
    setReport((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId ? {
        ...item,
        title: payload.title,
        summary: payload.summary,
        ownership: payload.ownership && (item.type === "decision" || item.type === "action-item")
          ? {
            role: item.type === "decision" ? "decision-maker" : "assignee",
            status: payload.ownership.status,
            value: payload.ownership.status === "confirmed-empty" ? undefined : payload.ownership.value,
          }
          : item.ownership,
      } : item),
    }));
  };

  return <SessionReportWorkspaceView onEditItem={editItem} onGenerate={() => undefined} report={report} />;
}

describe("SessionReportWorkspaceView item editing", () => {
  it("requires Title and ownership, treats Summary as optional, and returns custom ownership to the card", async () => {
    const user = userEvent.setup();
    const report = toSessionReport(sessionReportFixture);
    const decision = report.items.find((item) => item.type === "decision")!;
    render(<StatefulReportWorkspace />);

    await user.click(screen.getByRole("button", { name: decision.title }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const dialog = screen.getByRole("dialog", { name: "Edit report item" });
    const dialogScope = within(dialog);
    const save = dialogScope.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    expect(dialogScope.queryByText("Choose a decision maker or select None.")).not.toBeInTheDocument();
    expect(dialogScope.getByLabelText(/Summary/)).not.toBeRequired();

    await user.clear(dialogScope.getByLabelText(/Summary/));
    await user.type(dialogScope.getByRole("combobox", { name: /Decision maker/ }), "Research operations");

    expect(dialogScope.queryByText("Needs review")).not.toBeInTheDocument();
    expect(save).toBeEnabled();
    await user.click(save);

    expect(screen.queryByRole("dialog", { name: "Edit report item" })).not.toBeInTheDocument();
    const updatedCard = screen.getByRole("button", { name: decision.title }).closest("article");
    expect(updatedCard).not.toBeNull();
    expect(within(updatedCard!).getByText("Research operations")).toBeInTheDocument();
    expect(within(updatedCard!).queryByText("Needs review")).not.toBeInTheDocument();
    expect(within(updatedCard!).getByText("Confirmed")).toBeInTheDocument();
  });
});

describe("SessionThemesWorkspaceView editing", () => {
  it("edits only the Theme name and summary without exposing review decisions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onStatusChange = vi.fn();
    const themes = sessionThemeFixtures.map(toSessionTheme);
    render(
      <SessionThemesWorkspaceView
        onEdit={onEdit}
        onGenerate={() => undefined}
        onStatusChange={onStatusChange}
        projectId="alpha-project"
        sessionId="mobile-checkout-test"
        themes={themes}
      />,
    );

    const themeCard = screen.getByRole("heading", { name: themes[0].name }).closest("article");
    if (!themeCard) throw new Error("Expected the Theme card.");
    await user.click(within(themeCard).getByRole("button", { name: "Edit" }));

    const dialog = screen.getByRole("dialog", { name: "Edit theme" });
    const dialogScope = within(dialog);
    expect(dialogScope.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument();
    expect(dialogScope.queryByRole("button", { name: /Reject/ })).not.toBeInTheDocument();

    await user.clear(dialogScope.getByRole("textbox", { name: /^Theme name/ }));
    await user.type(dialogScope.getByRole("textbox", { name: /^Theme name/ }), "Clearer checkout orientation");
    await user.clear(dialogScope.getByRole("textbox", { name: /^Theme summary/ }));
    await user.type(dialogScope.getByRole("textbox", { name: /^Theme summary/ }), "Participants need persistent context while moving through checkout.");
    await user.click(dialogScope.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onEdit).toHaveBeenCalledWith(themes[0].id, {
      name: "Clearer checkout orientation",
      summary: "Participants need persistent context while moving through checkout.",
    }));
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Edit theme" })).not.toBeInTheDocument();
    expect(screen.getByText("AI Generated")).toBeInTheDocument();
  }, 10_000);

  it("keeps the editor open and reports a failed save", async () => {
    const user = userEvent.setup();
    const themes = sessionThemeFixtures.map(toSessionTheme);
    const onEdit = vi.fn().mockRejectedValue(new Error("The Theme service is unavailable."));
    render(
      <SessionThemesWorkspaceView
        onEdit={onEdit}
        onGenerate={() => undefined}
        projectId="alpha-project"
        sessionId="mobile-checkout-test"
        themes={themes}
      />,
    );

    const themeCard = screen.getByRole("heading", { name: themes[0].name }).closest("article");
    if (!themeCard) throw new Error("Expected the Theme card.");
    await user.click(within(themeCard).getByRole("button", { name: "Edit" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit theme" })).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
    expect(await screen.findByText("The Theme service is unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Edit theme" })).toBeInTheDocument();
  });
});
