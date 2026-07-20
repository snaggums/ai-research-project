import type { Meta, StoryObj } from "@storybook/react-vite";

import { recordSummaries } from "@/mocks/fixtures/records";
import { RecordSummary } from "./record-summary";

const meta = { title: "Research Objects/Record/Record Summary", component: RecordSummary, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>], args: { record: recordSummaries[0] } } satisfies Meta<typeof RecordSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const NeedsData: Story = { args: { record: recordSummaries[1] } };
export const UpToDate: Story = { args: { record: recordSummaries[2] } };
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
