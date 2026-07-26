import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toSessionReport } from "@/adapters/synthesis";
import type { SessionReport as SessionReportValue } from "@/domain/types";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionReport } from "./session-report";
import { SessionReportItem } from "./session-report-item";
import { SessionReportOwnershipEditor } from "./session-report-ownership-editor";

const report = toSessionReport(sessionReportFixture);

function withOwnership(
  source: SessionReportValue,
  status: "confirmed" | "needs-review",
): SessionReportValue {
  return {
    ...source,
    status: "researcher-reviewed",
    items: source.items.map((item) => {
      if (item.type === "decision") {
        return {
          ...item,
          ownership: {
            role: "decision-maker" as const,
            status,
            value: status === "confirmed" ? "Rachel Chen" : undefined,
          },
        };
      }
      if (item.type === "action-item") {
        return {
          ...item,
          ownership: {
            role: "assignee" as const,
            status,
            value: status === "confirmed" ? "Design team" : undefined,
          },
        };
      }
      return item;
    }),
  };
}

describe("SessionReportItem", () => {
  it("uses a collapsed disclosure by default and reveals approved actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onOpenContext = vi.fn();
    const item = report.items[0];
    render(<SessionReportItem item={item} onEdit={onEdit} onOpenContext={onOpenContext} />);
    const disclosure = screen.getByRole("button", { name: item.title });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(item.summary)).not.toBeInTheDocument();
    await user.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(item.summary)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Open evidence" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onOpenContext).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("shows ownership value and status only for Decisions and Action Items", () => {
    const decision = withOwnership(report, "confirmed").items.find((item) => item.type === "decision")!;
    const { rerender } = render(<SessionReportItem item={decision} />);
    expect(screen.getByText("Decision maker")).toBeInTheDocument();
    expect(screen.getByText("Rachel Chen")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    rerender(<SessionReportItem item={report.items[0]} />);
    expect(screen.queryByText("Decision maker")).not.toBeInTheDocument();
    expect(screen.queryByText("Assignee")).not.toBeInTheDocument();
  });
});

describe("SessionReport approval validation", () => {
  it("focuses the summary, expands the selected row, and blocks approval", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const blocked = withOwnership(report, "needs-review");
    const decision = blocked.items.find((item) => item.type === "decision")!;
    render(<SessionReport onApprove={onApprove} report={blocked} />);
    await user.click(screen.getByRole("button", { name: "Approve report" }));
    expect(await screen.findByRole("alert")).toHaveFocus();
    await user.click(screen.getByRole("button", { name: /Decision ·/ }));
    const disclosure = screen.getByRole("button", { name: decision.title });
    await waitFor(() => expect(disclosure).toHaveFocus());
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("approves when every Decision and Action Item is confirmed", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(<SessionReport onApprove={onApprove} report={withOwnership(report, "confirmed")} />);
    await user.click(screen.getByRole("button", { name: "Approve report" }));
    expect(onApprove).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("SessionReportOwnershipEditor", () => {
  it("places None first for Decision makers and uses it as the explicit empty value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onConfirmedEmptyChange = vi.fn();
    const decision = {
      ...report.items.find((item) => item.type === "decision")!,
      ownership: {
        role: "decision-maker" as const,
        status: "needs-review" as const,
      },
    };
    render(
      <SessionReportOwnershipEditor
        item={decision}
        onConfirmedEmptyChange={onConfirmedEmptyChange}
        onValueChange={onValueChange}
        participantNames={["Alex Morgan", "Jordan Lee"]}
      />,
    );

    const combobox = screen.getByRole("combobox", { name: /Decision maker/ });
    const label = document.querySelector(`label[for="${combobox.id}"]`);
    expect(label).toHaveTextContent("Decision maker*");
    expect(label?.querySelector("[aria-hidden='true']")).toHaveTextContent("*");
    expect(screen.getByRole("button", { name: "Open decision maker options" })).toBeInTheDocument();
    expect(screen.queryByRole("listbox", { name: "Decision maker options" })).not.toBeInTheDocument();

    await user.click(combobox);
    const listbox = screen.getByRole("listbox", { name: "Decision maker options" });
    expect(screen.getByRole("button", { name: "Close decision maker options" })).toBeInTheDocument();
    expect(within(listbox).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "None",
      "Alex Morgan",
      "Jordan Lee",
    ]);
    expect(screen.getByText("Choose a Session participant or enter another name.")).toBeInTheDocument();
    expect(label?.parentElement).toHaveTextContent("Needs review");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    await user.click(within(listbox).getByRole("option", { name: "None" }));
    expect(onConfirmedEmptyChange).toHaveBeenCalledWith(true);
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(screen.queryByText("Needs review")).not.toBeInTheDocument();
  });

  it("accepts custom Assignee values", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const actionItem = report.items.find((item) => item.type === "action-item")!;
    render(
      <SessionReportOwnershipEditor
        item={actionItem}
        onValueChange={onValueChange}
        participantNames={["Alex Morgan", "Jordan Lee"]}
      />,
    );
    await user.type(screen.getByRole("combobox", { name: /Assignee/ }), "Content design");
    expect(onValueChange).toHaveBeenLastCalledWith("Content design");
    expect(screen.queryByText("Needs review")).not.toBeInTheDocument();
  });

  it("supports Arrow key navigation and Enter selection without moving DOM focus from the combobox", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const decision = {
      ...report.items.find((item) => item.type === "decision")!,
      ownership: {
        role: "decision-maker" as const,
        status: "needs-review" as const,
      },
    };
    render(
      <SessionReportOwnershipEditor
        item={decision}
        onValueChange={onValueChange}
        participantNames={["Alex Morgan", "Jordan Lee"]}
      />,
    );

    const combobox = screen.getByRole("combobox", { name: /Decision maker/ });
    await user.click(combobox);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(combobox).toHaveFocus();
    expect(combobox).toHaveValue("Alex Morgan");
    expect(onValueChange).toHaveBeenLastCalledWith("Alex Morgan");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows Needs review when a previously confirmed value is cleared", async () => {
    const user = userEvent.setup();
    const decision = {
      ...report.items.find((item) => item.type === "decision")!,
      ownership: {
        role: "decision-maker" as const,
        value: "Alex Morgan",
        status: "confirmed" as const,
      },
    };
    render(
      <SessionReportOwnershipEditor
        item={decision}
        participantNames={["Alex Morgan", "Jordan Lee"]}
      />,
    );

    await user.clear(screen.getByRole("combobox", { name: /Decision maker/ }));
    expect(screen.getByText("Needs review")).toBeInTheDocument();
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
  });
});
