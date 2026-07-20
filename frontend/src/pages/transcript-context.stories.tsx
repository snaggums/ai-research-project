import type { Meta, StoryObj } from "@storybook/react-vite";

import { toTranscriptContext } from "@/adapters/transcripts";
import { ApplicationShell } from "@/components/application";
import { transcriptApiFixtures, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { TranscriptContextView, type TranscriptContextViewProps } from "./transcript-views";

const context = toTranscriptContext({ document: transcriptApiFixtures[0], result: transcriptSearchFixtures[0], passages: transcriptApiFixtures[0].blocks, focused_passage_id: "passage-2" });
function StoryPage(props: TranscriptContextViewProps) { return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: props.projectId, name: props.projectName }}><TranscriptContextView {...props} /></ApplicationShell></div>; }
const meta = { title: "Page Templates/Sessions/Transcript Context", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { context, projectId: "alpha-project", projectName: "Alpha Project", returnHref: "/projects/alpha-project/sessions/mobile-checkout-test/transcript", sessionId: "mobile-checkout-test", sessionTitle: "Mobile checkout test", state: "ready" } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Loading: Story = { args: { context: undefined, state: "loading" } };
export const Unavailable: Story = { args: { context: undefined, state: "unavailable" } };
export const Error: Story = { args: { context: undefined, onRetry: () => undefined, state: "error" } };
export const MobileReady: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
