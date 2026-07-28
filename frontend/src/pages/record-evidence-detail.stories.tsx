import type { Meta, StoryObj } from "@storybook/react-vite";

import { toTranscriptContext } from "@/adapters/transcripts";
import { ApplicationShell } from "@/components/application";
import { alphaProject } from "@/mocks/fixtures/domain";
import { recordSummaries } from "@/mocks/fixtures/records";
import { transcriptApiFixtures, transcriptBlocks, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { RecordEvidenceDetailView } from "./record-views";

const context = toTranscriptContext({ document: transcriptApiFixtures[0], result: transcriptSearchFixtures[0], passages: transcriptBlocks, focused_passage_id: transcriptBlocks[1].id });
const recordRootPath = `/projects/${alphaProject.id}/records`;

function StoryPage() {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectChildId="record-1" activeProjectItem="records" context="project" project={{ id: alphaProject.id, name: alphaProject.name }}><RecordEvidenceDetailView context={context} evidenceId="evidence-confirmation-1" itemTitle="Confirmation must communicate payment success" record={recordSummaries[0]} recordRootPath={recordRootPath} sessionTitle="Mobile checkout usability test" /></ApplicationShell></div>;
}

const meta = { title: "Page Templates/Records/Record Synthesis Evidence Detail", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
