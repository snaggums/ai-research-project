import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import type { SessionReportItem } from "@/domain/types";
import { SessionReportOwnershipEditor } from "./session-report-ownership-editor";

const decision: SessionReportItem = {
  id: "decision-confirmation",
  type: "decision",
  title: "Keep confirmation details on the completion screen",
  summary: "Show payment status, order number, and delivery details together after submission.",
  provenance: "AI Generated · 2 supporting excerpts",
  evidence: [],
  ownership: {
    role: "decision-maker",
    value: "Alex Morgan",
    status: "ai-suggested",
    rationale: "AI matched Alex Morgan to the decisional speaker at 14:32.",
  },
};

const actionItem: SessionReportItem = {
  ...decision,
  id: "action-confirmation-copy",
  type: "action-item",
  title: "Revise confirmation copy before the next test",
  ownership: {
    role: "assignee",
    value: "Design team",
    status: "ai-suggested",
    rationale: "AI inferred Design team from the transcript assignment at 18:06.",
  },
};

const meta = {
  title: "Research Objects/Synthesis/Session Report Ownership Editor",
  component: SessionReportOwnershipEditor,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-2xl rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"><Story /></div>],
  args: {
    item: decision,
    participantNames: ["Alex Morgan", "Jordan Lee"],
  },
} satisfies Meta<typeof SessionReportOwnershipEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DecisionMakerAiSuggested: Story = {};
export const AssigneeAiSuggested: Story = { args: { item: actionItem } };
export const NeedsReview: Story = {
  args: {
    item: {
      ...decision,
      ownership: { role: "decision-maker", status: "needs-review" },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: /Decision maker/ }));
    await expect(canvas.getByRole("listbox", { name: "Decision maker options" })).toBeVisible();
    await expect(canvas.getByRole("option", { name: "None" })).toBeVisible();
  },
};
export const Confirmed: Story = {
  args: {
    item: {
      ...decision,
      ownership: {
        role: "decision-maker",
        value: "Rachel Chen",
        status: "confirmed",
      },
    },
  },
};
export const ConfirmedEmpty: Story = {
  args: {
    confirmedEmpty: true,
    item: {
      ...decision,
      ownership: { role: "decision-maker", status: "confirmed-empty" },
    },
  },
};
export const AssigneeUnassigned: Story = {
  args: {
    confirmedEmpty: true,
    item: {
      ...actionItem,
      ownership: { role: "assignee", status: "confirmed-empty" },
    },
  },
};
export const Saving: Story = { args: { item: actionItem, saving: true } };
export const Disabled: Story = { args: { disabled: true, item: actionItem } };
