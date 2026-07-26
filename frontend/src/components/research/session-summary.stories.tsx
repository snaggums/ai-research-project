import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionSummary } from "./session-summary";
import { sessions } from "@/mocks/fixtures/domain";

const meta = { title: "Research Objects/Session/Session Summary", component: SessionSummary, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>], args: { onEditSession: () => undefined, session: sessions[1] } } satisfies Meta<typeof SessionSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TabletWrapping: Story = { decorators: [(Story) => <div className="max-w-[48rem]"><Story /></div>] };
export const MobileWrapping: Story = { decorators: [(Story) => <div className="max-w-[24rem]"><Story /></div>] };
export const EmptyValues: Story = {
  args: {
    session: { ...sessions[1], durationMinutes: undefined, participants: [], relatedRecords: [], startsAt: undefined },
  },
};
export const LongContent: Story = {
  args: {
    session: {
      ...sessions[3],
      participants: sessions[1].participants.map((participant, index) => index === 0 ? { ...participant, firstName: "Alexandria", lastName: "Montgomery-Santiago" } : participant),
      relatedRecords: [{ id: "record-long", name: "Enterprise checkout modernization initiative" }, ...sessions[3].relatedRecords],
    },
  },
};
