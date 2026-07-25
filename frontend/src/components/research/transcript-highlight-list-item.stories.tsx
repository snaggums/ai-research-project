import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { transcriptCodingHighlights } from "@/mocks/fixtures/transcript-coding";
import { TranscriptHighlightListItem } from "./transcript-highlight-list-item";

const meta = {
  title: "Research Objects/Transcript Coding/Highlight List Item",
  component: TranscriptHighlightListItem,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-3xl p-6"><Story /></div>],
  parameters: { docs: { description: { component: "One complete matching Highlight in List view, retaining source, status, codes, and direct actions back to the transcript." } } },
  args: { highlight: transcriptCodingHighlights[0], onDelete: fn(), onEditCodes: fn(), onOpenInTranscript: fn(), onRemoveCode: fn() },
} satisfies Meta<typeof TranscriptHighlightListItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AcceptedCoded: Story = {};
export const Uncoded: Story = { args: { highlight: transcriptCodingHighlights[2] } };
export const Suggested: Story = { args: { highlight: { ...transcriptCodingHighlights[0], provenance: "AI generated", status: "suggested" } } };
export const LongExcerpt: Story = { args: { highlight: { ...transcriptCodingHighlights[0], evidence: { ...transcriptCodingHighlights[0].evidence, excerpt: `${transcriptCodingHighlights[0].evidence.excerpt} The participant then described returning to the same menu several times and losing confidence in the next step.` } } } };
