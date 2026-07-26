import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { toSessionReport } from "@/adapters/synthesis";
import type { SessionReport as SessionReportValue } from "@/domain/types";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionReport } from "./session-report";

const report = toSessionReport(sessionReportFixture);

function withOwnership(
  source: SessionReportValue,
  state: "suggested" | "confirmed" | "needs-review",
): SessionReportValue {
  return {
    ...source,
    items: source.items.map((item) => {
      if (item.type === "decision") {
        return {
          ...item,
          ownership: state === "confirmed"
            ? { role: "decision-maker" as const, value: "Rachel Chen", status: "confirmed" as const }
            : state === "suggested"
              ? {
                role: "decision-maker" as const,
                value: "Alex Morgan",
                status: "ai-suggested" as const,
                rationale: "AI matched Alex Morgan to the decisional speaker at 14:32. Confirm or edit during report review.",
              }
              : { role: "decision-maker" as const, status: "needs-review" as const },
        };
      }
      if (item.type === "action-item") {
        return {
          ...item,
          ownership: state === "confirmed"
            ? { role: "assignee" as const, value: "Design team", status: "confirmed" as const }
            : state === "suggested"
              ? {
                role: "assignee" as const,
                value: "Design team",
                status: "ai-suggested" as const,
                rationale: "AI inferred Design team from the transcript assignment at 18:06. Confirm, replace, or enter another assignee during report review.",
              }
              : { role: "assignee" as const, status: "needs-review" as const },
        };
      }
      return item;
    }),
  };
}

const meta = {
  title: "Research Objects/Synthesis/Session Report",
  component: SessionReport,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>],
  args: {
    onApprove: () => undefined,
    onCreateRevision: () => undefined,
    onEditItem: () => undefined,
    onEditReport: () => undefined,
    onOpenContext: () => undefined,
    onRegenerate: () => undefined,
    onReview: () => undefined,
    report: withOwnership(report, "suggested"),
  },
} satisfies Meta<typeof SessionReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AIGenerated: Story = {};
export const ReadyForApproval: Story = {
  args: {
    report: withOwnership(
      { ...report, status: "researcher-reviewed" },
      "confirmed",
    ),
  },
};
export const ApprovalBlocked: Story = {
  args: {
    report: withOwnership(
      { ...report, status: "researcher-reviewed" },
      "needs-review",
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Approve report" }));
    await expect(canvas.getByRole("alert")).toHaveFocus();
    await expect(canvas.getByText("Resolve ownership before approving")).toBeVisible();
  },
};
export const ApprovalErrorNavigation: Story = {
  args: {
    report: withOwnership(
      { ...report, status: "researcher-reviewed" },
      "needs-review",
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Approve report" }));
    await userEvent.click(canvas.getByRole("button", { name: /Decision ·/ }));
    const decisionDisclosure = canvas.getByRole("button", {
      name: report.items.find((item) => item.type === "decision")!.title,
    });
    await expect(decisionDisclosure).toHaveAttribute("aria-expanded", "true");
    await expect(decisionDisclosure).toHaveFocus();
  },
};
export const Approved: Story = {
  args: { report: { ...withOwnership(report, "confirmed"), status: "approved" } },
};
export const Superseded: Story = {
  args: { report: { ...withOwnership(report, "confirmed"), status: "superseded" } },
};
export const Constrained: Story = {
  decorators: [(Story) => <div className="max-w-[48rem]"><Story /></div>],
};
