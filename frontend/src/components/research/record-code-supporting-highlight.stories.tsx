import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { RecordCodeSupportingHighlight } from "./record-code-supporting-highlight";
import { recordCodeDetails } from "./record-code-story-data";

const defaultHighlight = recordCodeDetails[0].evidenceGroups[0].highlights[0];

const meta = {
  title: "Research Objects/Record/Record Code Supporting Highlight",
  component: RecordCodeSupportingHighlight,
  tags: ["autodocs"],
  args: {
    highlight: defaultHighlight,
    onOpenInTranscriptCoding: fn(),
  },
  decorators: [(Story) => <div className="w-[640px]"><Story /></div>],
} satisfies Meta<typeof RecordCodeSupportingHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongExcerpt: Story = {
  args: {
    highlight: {
      ...defaultHighlight,
      excerpt:
        "I moved through the navigation, several utility actions, a contextual panel, and the table before I could find the control I needed, and when I returned the focus position was no longer where I expected it to be.",
    },
  },
};
