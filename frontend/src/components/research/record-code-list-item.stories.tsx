import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { RecordCodeListItem } from "./record-code-list-item";
import { recordCodeDetails } from "./record-code-story-data";

const meta = {
  title: "Research Objects/Record/Record Code List Item",
  component: RecordCodeListItem,
  tags: ["autodocs"],
  args: {
    code: recordCodeDetails[0],
    onSelect: fn(),
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
} satisfies Meta<typeof RecordCodeListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const LongContent: Story = {
  args: {
    code: {
      ...recordCodeDetails[0],
      description:
        "Participants repeatedly reported that labels, destinations, and secondary navigation actions were difficult to distinguish when workflows contained several similarly named controls.",
      name: "Navigation terminology and destination clarity across complex workflows",
    },
  },
};
