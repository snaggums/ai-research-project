import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { toSessionTheme } from "@/adapters/synthesis";
import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { sessionThemeFixtures } from "@/mocks/fixtures/synthesis";
import { SessionDetailView } from "./session-views";
import { SessionThemesWorkspaceView, type SessionThemesWorkspaceViewProps } from "./synthesis-views";

function StoryPage(props: SessionThemesWorkspaceViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: props.projectId, name: "Alpha Project" }}><SessionDetailView activeTab="themes" onEditSession={() => undefined} projectId={props.projectId} projectName="Alpha Project" session={toSessionSummary(sessionApiFixtures[0])} workspaceContent={<SessionThemesWorkspaceView {...props} />} /></ApplicationShell></div>;
}
const themes = sessionThemeFixtures.map(toSessionTheme);
const meta = { title: "Page Templates/Sessions/Themes Workspace", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { onEdit: async () => undefined, onGenerate: () => undefined, projectId: "alpha-project", sessionId: "mobile-checkout-test", themes } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Empty: Story = { args: { themes: [] } };
export const Generating: Story = { args: { generating: true } };
export const Error: Story = { args: { errorMessage: "Check your connection and try again.", state: "error" } };
export const ReviewDetail: Story = { args: { selectedThemeId: themes[0].id } };
export const EditTheme: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = within(document.body).getByRole("dialog", { name: "Edit theme" });
    await expect(within(dialog).getByRole("textbox", { name: /^Theme name/ })).toHaveValue(themes[0].name);
    await expect(within(dialog).getByRole("textbox", { name: /^Theme summary/ })).toHaveValue(themes[0].summary);
  },
};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
