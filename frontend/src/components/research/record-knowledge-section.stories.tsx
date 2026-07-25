import type { Meta, StoryObj } from "@storybook/react-vite";

import { recordSynthesisItems } from "@/mocks/fixtures/records";
import { RecordKnowledgeSection } from "./record-knowledge-section";

const requirementItems = recordSynthesisItems.filter((item) => item.type === "requirement");

const meta = {
  title: "Research Objects/Record/Record Knowledge Section",
  component: RecordKnowledgeSection,
  tags: ["autodocs"],
  args: {
    items: requirementItems,
    label: "Requirements",
    onOpenEvidence: () => undefined,
    onRetry: () => undefined,
    onStatusChange: () => undefined,
    onToggleItem: () => undefined,
    type: "requirement",
  },
  decorators: [(Story) => <div className="max-w-5xl"><Story /></div>],
} satisfies Meta<typeof RecordKnowledgeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const PopulatedWithExpandedRow: Story = {
  args: { expandedItemIds: new Set([requirementItems[1].id]) },
};
export const Empty: Story = { args: { items: [], state: "empty" } };
export const Loading: Story = { args: { items: [], state: "loading" } };
export const Error: Story = { args: { items: [], state: "error" } };
export const Decisions: Story = {
  args: {
    items: recordSynthesisItems.filter((item) => item.type === "decision"),
    label: "Decisions",
    type: "decision",
  },
};
export const ActionItems: Story = {
  args: {
    items: recordSynthesisItems.filter((item) => item.type === "action-item"),
    label: "Action items",
    type: "action-item",
  },
};
