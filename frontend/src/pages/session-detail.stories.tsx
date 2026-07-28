import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import { RecordSynthesisRequirementsNote } from "@/components/research/record-synthesis-requirements-note";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { SessionDetailView, type SessionDetailViewProps } from "./session-views";

function StoryPage(props: SessionDetailViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: props.projectId, name: props.projectName }}><SessionDetailView {...props} /></ApplicationShell></div>;
}
const session = toSessionSummary(sessionApiFixtures[0]);
const meta = { title: "Page Templates/Sessions/Session Detail", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { activeTab: "overview", onAddParticipant: fn(), onEditParticipant: fn(), onEditSession: fn(), onRemoveParticipant: fn(), projectId: "alpha-project", projectName: "Alpha Project", recordSynthesisRequirementsNote: <RecordSynthesisRequirementsNote />, routeState: "ready", session } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const Participants: Story = { args: { activeTab: "participants" } };
export const ParticipantsFirstRowTooltip: Story = {
  args: { activeTab: "participants" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getAllByRole("button", { name: /Remove participant from Session:/ })[0]);
    const tooltip = await canvas.findByRole("tooltip");
    await expect(tooltip).toHaveTextContent("Remove participant from Session");
    await expect(tooltip).toHaveClass("top-full");
  },
};
export const ParticipantsRemoveConfirmation: Story = {
  args: { activeTab: "participants" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: /Remove participant from Session:/ })[0]);
    const dialog = within(document.body).getByRole("dialog", { name: "Remove participant from Session?" });
    await expect(within(dialog).getByText(/remain in Project participants/)).toBeInTheDocument();
  },
};
export const ParticipantsRemoveFailure: Story = {
  args: {
    activeTab: "participants",
    participantActionError: "The Session could not be updated. Try removing the participant again.",
  },
};
export const ParticipantsEmpty: Story = { args: { activeTab: "participants", session: { ...session, participants: [] } } };
export const Loading: Story = { args: { routeState: "loading", session: undefined } };
export const Error: Story = { args: { onRetry: () => undefined, routeState: "error", session: undefined } };
export const NotFound: Story = { args: { routeState: "not-found", session: undefined } };
export const MobileOverview: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
export const MobileParticipants: Story = { args: { activeTab: "participants" }, parameters: { viewport: { defaultViewport: "mobile1" } } };
