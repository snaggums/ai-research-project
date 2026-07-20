import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionListItem } from "./session-list-item";
import { sessions } from "@/mocks/fixtures/domain";

const meta = { title: "Research Objects/Session/Session List Item", component: SessionListItem, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-6xl p-6" onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><Story /></div>], args: { href: "#session", onEdit: () => undefined, onDelete: () => undefined, session: sessions[0] }, parameters: { pseudo: { active: false, focusVisible: false, hover: false } } } satisfies Meta<typeof SessionListItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PrimaryTranscript: Story = {};
export const NoTranscript: Story = { args: { session: sessions[2] } };
export const Processing: Story = { args: { session: sessions[1] } };
export const Failed: Story = { args: { session: sessions[3] } };
export const Hover: Story = { parameters: { pseudo: { hover: ".air-session-item-link" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-session-item-link" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: ".air-session-item-link" } } };
