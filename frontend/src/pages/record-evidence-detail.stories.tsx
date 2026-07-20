import type { Meta, StoryObj } from "@storybook/react-vite";

import { toTranscriptContext } from "@/adapters/transcripts";
import { ApplicationShell } from "@/components/application";
import { recordSummaries } from "@/mocks/fixtures/records";
import { transcriptApiFixtures, transcriptBlocks, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { RecordEvidenceDetailView } from "./record-views";

const context = toTranscriptContext({ document: transcriptApiFixtures[0], result: transcriptSearchFixtures[0], passages: transcriptBlocks, focused_passage_id: transcriptBlocks[1].id });

function StoryPage() {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeGlobalItem="records" activeGlobalSubItem="record-1" context="workspace"><RecordEvidenceDetailView context={context} evidenceId="evidence-confirmation-1" itemTitle="Confirmation must communicate payment success" record={recordSummaries[0]} sessionTitle="Mobile checkout usability test" /></ApplicationShell></div>;
}

const meta = { title: "Page Templates/Records/Record Synthesis Evidence Detail", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
