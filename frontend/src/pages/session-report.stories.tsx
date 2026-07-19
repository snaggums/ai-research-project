import type { Meta, StoryObj } from "@storybook/react-vite";

import { toSessionReport } from "@/adapters/synthesis";
import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionDetailView } from "./session-views";
import { SessionReportWorkspaceView, type SessionReportWorkspaceViewProps } from "./synthesis-views";

function StoryPage(props: SessionReportWorkspaceViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: "alpha-project", name: "Alpha Project" }}><SessionDetailView activeTab="report" onEditSession={() => undefined} projectId="alpha-project" projectName="Alpha Project" session={toSessionSummary(sessionApiFixtures[0])} workspaceContent={<SessionReportWorkspaceView {...props} />} /></ApplicationShell></div>;
}
const report = toSessionReport(sessionReportFixture);
const meta = { title: "Page Templates/Sessions/Session Report Workspace", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { onGenerate: () => undefined, report } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Empty: Story = { args: { report: undefined } };
export const Generating: Story = { args: { generating: true } };
export const Error: Story = { args: { errorMessage: "Check your connection and try again.", state: "error" } };
export const ResearcherReviewed: Story = { args: { report: { ...report, status: "researcher-reviewed" } } };
export const Approved: Story = { args: { report: { ...report, status: "approved" } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
