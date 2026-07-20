import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionSummary } from "./session-summary";
import { sessions } from "@/mocks/fixtures/domain";

const meta = { title: "Research Objects/Session/Session Summary", component: SessionSummary, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>], args: { session: sessions[0] } } satisfies Meta<typeof SessionSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
export const WithoutRelationships: Story = { args: { showRelationships: false } };
