import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { toSessionReport } from "@/adapters/synthesis";
import type { SessionReportItem as SessionReportItemValue } from "@/domain/types";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionReportItem } from "./session-report-item";

const report = toSessionReport(sessionReportFixture);
const [requirement, decisionSource, actionSource, openQuestion, keyInsight] = report.items;
const decision: SessionReportItemValue = {
  ...decisionSource,
  ownership: {
    role: "decision-maker",
    value: "Alex Morgan",
    status: "ai-suggested",
    rationale: "AI matched Alex Morgan to the decisional speaker at 14:32. Confirm or edit during report review.",
  },
};
const actionItem: SessionReportItemValue = {
  ...actionSource,
  ownership: {
    role: "assignee",
    value: "Design team",
    status: "ai-suggested",
    rationale: "AI inferred Design team from the transcript assignment at 18:06. Confirm, replace, or enter another assignee during report review.",
  },
};

const meta = {
  title: "Research Objects/Synthesis/Session Report Item",
  component: SessionReportItem,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>],
  args: {
    item: requirement,
    onEdit: () => undefined,
    onOpenContext: () => undefined,
  },
} satisfies Meta<typeof SessionReportItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RequirementCollapsed: Story = {};
export const RequirementExpanded: Story = { args: { defaultExpanded: true } };
export const DecisionCollapsedAiSuggested: Story = { args: { item: decision } };
export const DecisionExpandedAiSuggested: Story = {
  args: { defaultExpanded: true, item: decision },
};
export const DecisionConfirmed: Story = {
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
export const ActionItemCollapsedAiSuggested: Story = { args: { item: actionItem } };
export const ActionItemExpandedAiSuggested: Story = {
  args: { defaultExpanded: true, item: actionItem },
};
export const ActionItemNeedsReview: Story = {
  args: {
    item: {
      ...actionItem,
      ownership: { role: "assignee", status: "needs-review" },
    },
  },
};
export const ActionItemConfirmedEmpty: Story = {
  args: {
    item: {
      ...actionItem,
      ownership: { role: "assignee", status: "confirmed-empty" },
    },
  },
};
export const OpenQuestionCollapsed: Story = { args: { item: openQuestion } };
export const OpenQuestionExpanded: Story = {
  args: { defaultExpanded: true, item: openQuestion },
};
export const KeyInsightCollapsed: Story = { args: { item: keyInsight } };
export const KeyInsightExpanded: Story = {
  args: { defaultExpanded: true, item: keyInsight },
};
export const ConstrainedLongContent: Story = {
  args: {
    item: {
      ...actionItem,
      title: "Coordinate the checkout confirmation content review with design, engineering, legal, and the client delivery team",
      ownership: {
        ...actionItem.ownership!,
        value: "Enterprise checkout modernization design and delivery team",
      },
    },
  },
  decorators: [(Story) => <div className="max-w-[42rem]"><Story /></div>],
};
export const KeyboardDisclosure: Story = {
  args: { item: decision },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disclosure = canvas.getByRole("button", { name: decision.title });
    disclosure.focus();
    await userEvent.keyboard("{Enter}");
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(decision.summary)).toBeVisible();
  },
};
