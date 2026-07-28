import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { toTranscriptDocumentSummary } from "@/adapters/transcripts";
import { transcriptApiFixtures } from "@/mocks/fixtures/transcripts";
import { TranscriptDocumentItem } from "./transcript-document-item";

const complete = toTranscriptDocumentSummary(transcriptApiFixtures[0]);
const processing = toTranscriptDocumentSummary(transcriptApiFixtures[1]);
const failed = toTranscriptDocumentSummary(transcriptApiFixtures[2]);
const meta = {
  title: "Research Objects/Transcript/Transcript Document Item",
  component: TranscriptDocumentItem,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
  args: {
    document: complete,
    href: "#view",
    lifecycle: "active",
    onDelete: fn(),
    onReplace: fn(),
    onRetry: fn(),
    viewLabel: "View transcript",
  },
} satisfies Meta<typeof TranscriptDocumentItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Active: Story = {};
export const Legacy: Story = {
  args: {
    document: { ...complete, filename: "legacy-checkout-interview.docx", lifecycleStatus: "legacy", isPrimary: false },
    isPrimary: false,
    lifecycle: "legacy",
    onReplace: undefined,
  },
};
export const Removed: Story = {
  args: {
    document: { ...complete, filename: "mobile-checkout-interview-v1.docx", lifecycleStatus: "tombstoned", isPrimary: false },
    isPrimary: false,
    lifecycle: "removed",
    onDelete: undefined,
    onReplace: undefined,
  },
};
export const Uploaded: Story = { args: { document: { ...processing, status: "uploaded" } } };
export const Processing: Story = { args: { document: processing } };
export const Failed: Story = { args: { document: failed } };
export const Retrying: Story = { args: { document: { ...failed, status: "processing" }, retrying: true } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
