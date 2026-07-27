import type { Meta, StoryObj } from "@storybook/react-vite";

import { insufficientRecordScope, readyRecordScope } from "@/mocks/fixtures/records";
import {
  RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION,
  RecordSynthesisScopeSummary,
} from "./record-synthesis-scope-summary";

const meta = { title: "Research Objects/Record/Record Synthesis Scope Summary", component: RecordSynthesisScopeSummary, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>], args: { requirementsDescription: RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION, scope: readyRecordScope } } satisfies Meta<typeof RecordSynthesisScopeSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReadyWithExclusion: Story = {};
export const ReadyWithoutExclusions: Story = { args: { scope: { ...readyRecordScope, excludedSessions: [] } } };
export const NeedsData: Story = { args: { scope: insufficientRecordScope } };
export const NeedsDataWithoutExclusions: Story = { args: { scope: { ...insufficientRecordScope, excludedSessions: [] } } };
export const Compact: Story = { args: { layout: "compact", requirementsDescription: undefined }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
