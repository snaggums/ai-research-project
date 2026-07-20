import type { Meta, StoryObj } from "@storybook/react-vite";

import { recordSummaries } from "@/mocks/fixtures/records";
import { RecordListItem } from "./record-list-item";

const meta = {
  title: "Research Objects/Record/Record List Item",
  component: RecordListItem,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-6" onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><Story /></div>],
  args: { href: "#record", record: recordSummaries[0] },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof RecordListItem>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const NeedsData: Story = { args: { record: recordSummaries[1] } };
export const UpToDate: Story = { args: { record: recordSummaries[2] } };
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
export const Hover: Story = { parameters: { pseudo: { hover: ".air-record-list-item-link" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-record-list-item-link" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: ".air-record-list-item-link" } } };
