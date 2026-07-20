import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { toTranscriptDocumentSummary } from "@/adapters/transcripts";
import { transcriptApiFixtures } from "@/mocks/fixtures/transcripts";
import { TranscriptDocumentItem } from "./transcript-document-item";

const complete = toTranscriptDocumentSummary(transcriptApiFixtures[0]);
const processing = toTranscriptDocumentSummary(transcriptApiFixtures[1]);
const failed = toTranscriptDocumentSummary(transcriptApiFixtures[2]);
const meta = { title: "Research Objects/Transcript/Transcript Document Item", component: TranscriptDocumentItem, tags: ["autodocs"], decorators: [(Story) => <div className="p-6"><Story /></div>], args: { document: complete, href: "#view", onDelete: fn(), onRetry: fn(), onSetPrimary: fn() } } satisfies Meta<typeof TranscriptDocumentItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CompletePrimary: Story = {};
export const Complete: Story = { args: { document: { ...complete, isPrimary: false }, isPrimary: false } };
export const Uploaded: Story = { args: { document: { ...processing, status: "uploaded" } } };
export const Processing: Story = { args: { document: processing } };
export const Failed: Story = { args: { document: failed } };
export const Retrying: Story = { args: { document: { ...failed, status: "processing" }, retrying: true } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
