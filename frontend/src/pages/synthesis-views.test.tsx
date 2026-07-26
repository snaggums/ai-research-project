import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toSessionReport } from "@/adapters/synthesis";
import type { SessionReport } from "@/domain/types";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionReportWorkspaceView, type SessionReportWorkspaceViewProps } from "./synthesis-views";

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
