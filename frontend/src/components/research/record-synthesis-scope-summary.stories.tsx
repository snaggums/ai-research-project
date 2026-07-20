import type { Meta, StoryObj } from "@storybook/react-vite";

import { insufficientRecordScope, readyRecordScope } from "@/mocks/fixtures/records";
import { RecordSynthesisScopeSummary } from "./record-synthesis-scope-summary";

const meta = { title: "Research Objects/Record/Record Synthesis Scope Summary", component: RecordSynthesisScopeSummary, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>], args: { scope: readyRecordScope } } satisfies Meta<typeof RecordSynthesisScopeSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReadyWithExclusion: Story = {};
export const ReadyWithoutExclusions: Story = { args: { scope: { ...readyRecordScope, excludedSessions: [] } } };
export const NeedsData: Story = { args: { scope: insufficientRecordScope } };
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
