import type { Meta, StoryObj } from "@storybook/react-vite";

import { toTranscriptDocumentDetail } from "@/adapters/transcripts";
import { Button } from "@/components/ui/button";
import { transcriptApiFixtures } from "@/mocks/fixtures/transcripts";
import { TranscriptPreview } from "./transcript-preview";

const document = toTranscriptDocumentDetail(transcriptApiFixtures[0]);
const actions = <><Button size="small" variant="gray-subtle">Open source</Button><Button size="small" variant="gray-subtle">Download source</Button></>;
const meta = { title: "Research Objects/Transcript/Transcript Preview", component: TranscriptPreview, tags: ["autodocs"], decorators: [(Story) => <div className="p-6"><Story /></div>], args: { actions, document } } satisfies Meta<typeof TranscriptPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const EmptyExtraction: Story = { args: { document: { ...document, blocks: [] }, state: "empty-extraction" } };
export const Processing: Story = { args: { document: { ...document, blocks: [], status: "processing" }, state: "processing" } };
export const Failed: Story = { args: { document: { ...document, blocks: [], status: "failed" }, state: "failed" } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
