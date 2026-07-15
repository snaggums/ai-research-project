import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { toSessionSummary } from "@/adapters/sessions";
import { toTranscriptDocumentDetail, toTranscriptSearchResult } from "@/adapters/transcripts";
import { ApplicationShell } from "@/components/application";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { transcriptApiFixtures, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { SessionDetailView } from "./session-views";
import { SessionTranscriptWorkspaceView, type SessionTranscriptWorkspaceViewProps } from "./transcript-views";

function StoryPage(props: SessionTranscriptWorkspaceViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: props.projectId, name: "Alpha Project" }}><SessionDetailView activeTab="transcript" projectId={props.projectId} projectName="Alpha Project" session={toSessionSummary(sessionApiFixtures[0])} transcriptContent={<SessionTranscriptWorkspaceView {...props} />} /></ApplicationShell></div>;
}
const documents = [toTranscriptDocumentDetail(transcriptApiFixtures[0])];
const meta = { title: "Page Templates/Sessions/Transcript Workspace", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { documents, onDelete: () => undefined, onRetry: () => undefined, onSearch: () => undefined, onSetPrimary: () => undefined, onUpload: () => undefined, projectId: "alpha-project", sessionId: "mobile-checkout-test" } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Empty: Story = { args: { documents: [] } };
export const Processing: Story = { args: { documents: [toTranscriptDocumentDetail(transcriptApiFixtures[1])] } };
export const Viewing: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("link", { name: "View transcript" })); } };
export const SearchResults: Story = { args: { searchQuery: "navigation confusion", searchResults: transcriptSearchFixtures.map(toTranscriptSearchResult) } };
export const Loading: Story = { args: { state: "loading" } };
export const Error: Story = { args: { errorMessage: "Check your connection and try again.", state: "error" } };
export const MobileReady: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
export const MobileSearchResults: Story = { args: { searchQuery: "navigation confusion", searchResults: transcriptSearchFixtures.map(toTranscriptSearchResult) }, parameters: { viewport: { defaultViewport: "mobile1" } } };
