import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { RecordCodeComparison } from "./record-code-comparison";
import { recordCodeDetails } from "./record-code-story-data";

const meta = {
  title: "Research Objects/Record/Record Code Comparison",
  component: RecordCodeComparison,
  tags: ["autodocs"],
  args: {
    code: recordCodeDetails[0],
    onOpenInTranscriptCoding: fn(),
    onRetry: fn(),
  },
  decorators: [(Story) => <div className="w-[704px]"><Story /></div>],
} satisfies Meta<typeof RecordCodeComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Loading: Story = { args: { code: undefined, state: "loading" } };
export const NoSelection: Story = { args: { code: undefined, state: "no-selection" } };
export const Error: Story = { args: { state: "error" } };
export const LongContent: Story = {
  args: {
    code: {
      ...recordCodeDetails[0],
      description:
        "Participants across several Sessions described consequential decisions without visible criteria, supporting history, likely outcomes, or enough contextual guidance to understand what would happen next.",
      name: "Decision support for legally meaningful actions across complex investigator workflows",
    },
  },
};
