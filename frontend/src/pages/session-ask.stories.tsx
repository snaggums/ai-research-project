import type { Meta, StoryObj } from "@storybook/react-vite";

import { toSessionConversation } from "@/adapters/synthesis";
import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import type { SessionConversation } from "@/api/types";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { sessionConversationFixture, suggestedSessionQuestions, synthesisEvidenceFixtures } from "@/mocks/fixtures/synthesis";
import { SessionDetailView } from "./session-views";
import { AskThisSessionWorkspaceView, type AskThisSessionWorkspaceViewProps } from "./synthesis-views";

const answeredTransport: SessionConversation = {
  ...sessionConversationFixture,
  turns: [
    { id: "q-1", role: "researcher", content: suggestedSessionQuestions[0], citations: [], created_at: "2026-07-15T12:00:00Z" },
    { id: "a-1", role: "assistant", content: "Participants lost confidence when the order summary disappeared and the checkout step was unclear.", citations: synthesisEvidenceFixtures.slice(0, 2).map((evidence) => ({ id: evidence.id, document_id: evidence.document_id, document_name: evidence.document_name, speaker: evidence.speaker, location: evidence.location, excerpt: evidence.excerpt, context_result_id: evidence.context_result_id })), created_at: "2026-07-15T12:00:01Z" },
  ],
};

function StoryPage(props: AskThisSessionWorkspaceViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: props.projectId, name: "Alpha Project" }}><SessionDetailView activeTab="ask" projectId={props.projectId} projectName="Alpha Project" session={toSessionSummary(sessionApiFixtures[0])} workspaceContent={<AskThisSessionWorkspaceView {...props} />} /></ApplicationShell></div>;
}
const meta = { title: "Page Templates/Sessions/Ask This Session Workspace", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { conversation: toSessionConversation(sessionConversationFixture), onAsk: () => undefined, projectId: "alpha-project", sessionId: "mobile-checkout-test", suggestedQuestions: suggestedSessionQuestions } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Answered: Story = { args: { conversation: toSessionConversation(answeredTransport) } };
export const Loading: Story = { args: { state: "loading" } };
export const Error: Story = { args: { errorMessage: "Retrieval failed. Your question has been retained so you can try again.", state: "error" } };
export const MobileAnswered: Story = { args: { conversation: toSessionConversation(answeredTransport) }, parameters: { viewport: { defaultViewport: "mobile1" } } };
