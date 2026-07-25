import type { Meta, StoryObj } from "@storybook/react-vite";

import { recordSynthesisItems } from "@/mocks/fixtures/records";
import { RecordKnowledgeRow } from "./record-knowledge-row";

const meta = {
  title: "Research Objects/Record/Record Knowledge Row",
  component: RecordKnowledgeRow,
  tags: ["autodocs"],
  args: {
    expanded: false,
    item: recordSynthesisItems[0],
    onOpenEvidence: () => undefined,
    onStatusChange: () => undefined,
    onToggle: () => undefined,
  },
  decorators: [(Story) => <div className="max-w-5xl"><Story /></div>],
} satisfies Meta<typeof RecordKnowledgeRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CollapsedAiGenerated: Story = {};
export const ExpandedAiGenerated: Story = { args: { expanded: true } };
export const CollapsedResearcherReviewed: Story = { args: { item: recordSynthesisItems[1] } };
export const ExpandedResearcherReviewed: Story = { args: { expanded: true, item: recordSynthesisItems[7] } };
export const CollapsedApproved: Story = { args: { item: recordSynthesisItems[3] } };
export const ExpandedApproved: Story = { args: { expanded: true, item: recordSynthesisItems[8] } };
export const CollapsedSuperseded: Story = { args: { item: recordSynthesisItems[4] } };
export const ExpandedSuperseded: Story = { args: { expanded: true, item: recordSynthesisItems[5] } };
export const LongContent: Story = {
  args: {
    item: {
      ...recordSynthesisItems[0],
      title: "Checkout confirmation must explain payment success while preserving the complete order and delivery context",
      summary: "Researchers need a deliberately long example to confirm that titles and summaries wrap without colliding with the single-line lifecycle, Session count, Report item count, and disclosure controls.",
    },
  },
};
