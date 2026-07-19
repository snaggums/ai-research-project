import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within } from "storybook/test";

import { recordSynthesisItems } from "@/mocks/fixtures/records";
import { RecordSynthesisItem } from "./record-synthesis-item";

const meta = { title: "Research Objects/Record/Record Synthesis Item", component: RecordSynthesisItem, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-3xl p-6"><Story /></div>], args: { item: recordSynthesisItems[0], onOpenEvidence: fn() } } satisfies Meta<typeof RecordSynthesisItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RequirementAIGenerated: Story = {};
export const RequirementResearcherReviewed: Story = { args: { item: recordSynthesisItems[1] } };
export const DecisionApproved: Story = { args: { item: recordSynthesisItems[2] } };
export const ActionItem: Story = { args: { item: recordSynthesisItems[3] } };
export const Superseded: Story = { args: { item: { ...recordSynthesisItems[0], status: "superseded" } } };
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
export const OpenEvidence: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: /Open evidence/ })); } };
