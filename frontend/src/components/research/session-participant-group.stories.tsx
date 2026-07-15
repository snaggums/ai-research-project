import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionParticipantGroup } from "./session-participant-group";
import { participants } from "@/mocks/fixtures/domain";

const meta = { title: "Research Objects/Session/Session Participant Group", component: SessionParticipantGroup, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-4xl p-6"><Story /></div>], args: { onEditParticipants: () => undefined, participants } } satisfies Meta<typeof SessionParticipantGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Empty: Story = { args: { participants: [] } };
export const Loading: Story = { args: { participants: [], state: "loading" } };
export const Error: Story = { args: { onRetry: () => undefined, participants: [], state: "error" } };
