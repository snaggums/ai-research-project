import type { Meta, StoryObj } from "@storybook/react-vite";

import { recordSynthesisItems } from "@/mocks/fixtures/records";
import { RecordKnowledgeDetails } from "./record-knowledge-details";

const meta = {
  title: "Research Objects/Record/Record Knowledge Details",
  component: RecordKnowledgeDetails,
  tags: ["autodocs"],
  args: {
    item: recordSynthesisItems[7],
    onOpenEvidence: () => undefined,
    onStatusChange: () => undefined,
  },
  decorators: [(Story) => <div className="max-w-5xl rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)]"><Story /></div>],
} satisfies Meta<typeof RecordKnowledgeDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResearcherReviewed: Story = {};
export const AiGenerated: Story = { args: { item: recordSynthesisItems[0] } };
export const ApprovedWithoutLifecycleAction: Story = { args: { item: recordSynthesisItems[8] } };
export const WithoutActions: Story = { args: { showActions: false } };
