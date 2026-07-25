import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { TranscriptCodingSummary } from "./transcript-coding-summary";

const meta = {
  title: "Research Objects/Transcript Coding/Transcript Coding Summary",
  component: TranscriptCodingSummary,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-6"><Story /></div>],
  parameters: { docs: { description: { component: "Session-level status and counts for AI suggestions, accepted codes, and rejected suggestions." } } },
  args: { acceptedCount: 0, onAction: fn(), rejectedCount: 0, state: "awaiting-review", suggestionCount: 8 },
} satisfies Meta<typeof TranscriptCodingSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AwaitingReview: Story = {};
export const Processing: Story = { args: { state: "processing" } };
export const Complete: Story = { args: { acceptedCount: 5, rejectedCount: 3, state: "complete", suggestionCount: 0 } };
export const NoSuggestions: Story = { args: { state: "empty", suggestionCount: 0 } };
export const RecoverableError: Story = { args: { state: "error", suggestionCount: 0 } };
