import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionCollectionItem } from "./session-collection-item";
import { sessions } from "@/mocks/fixtures/domain";

const meta = { title: "Research Objects/Session/Session Collection Item", component: SessionCollectionItem, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6" onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><Story /></div>], args: { href: "#session", session: sessions[0] } } satisfies Meta<typeof SessionCollectionItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Processing: Story = { args: { session: sessions[1] } };
export const EmptyWorkflow: Story = { args: { session: sessions[2] } };
export const FailedTranscript: Story = { args: { session: sessions[3] } };
export const Compact: Story = { args: { layout: "compact" }, decorators: [(Story) => <div className="w-[22rem]"><Story /></div>] };
