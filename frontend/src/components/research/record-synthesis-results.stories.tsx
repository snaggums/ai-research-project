import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { recordSynthesis } from "@/mocks/fixtures/records";
import { RecordSynthesisResults } from "./record-synthesis-results";

const meta = { title: "Research Objects/Record/Record Synthesis Results", component: RecordSynthesisResults, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>], args: { onOpenEvidence: fn(), synthesis: recordSynthesis } } satisfies Meta<typeof RecordSynthesisResults>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Empty: Story = { args: { synthesis: { ...recordSynthesis, items: [] } } };
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
