import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import {
  askRecordCitations,
  askRecordPartialCitations,
} from "@/mocks/fixtures/ask-record";
import { EvidenceCitationCard } from "./evidence-citation-card";

const meta = {
  title: "Research Objects/Evidence/Evidence Citation Card",
  component: EvidenceCitationCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <main className="w-[min(65rem,calc(100vw-2rem))]">
        <Story />
      </main>
    ),
  ],
  args: {
    citation: askRecordCitations[0],
    onOpenTranscriptContext: fn(),
  },
} satisfies Meta<typeof EvidenceCitationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecordSupportingEvidence: Story = {};

export const RecordPartiallyRelevant: Story = {
  args: { citation: askRecordPartialCitations[0] },
};

export const ProjectSupportingEvidence: Story = {
  args: { context: "project" },
};

export const ProjectPartiallyRelevant: Story = {
  args: {
    citation: askRecordPartialCitations[0],
    context: "project",
  },
};

export const SessionSupportingEvidence: Story = {
  args: {
    citation: {
      excerpt: askRecordCitations[0].excerpt,
      id: "session-checkout-confirmation",
      reference: 1,
      relevance: "supporting",
      speakerTimestamp: askRecordCitations[0].speakerTimestamp,
      transcript: askRecordCitations[0].transcript,
      transcriptHref: askRecordCitations[0].transcriptHref,
    },
    context: "session",
  },
};

export const LongMetadataAndExcerpt: Story = {
  args: {
    citation: {
      ...askRecordCitations[0],
      excerpt:
        "This deliberately long excerpt verifies that participant evidence wraps naturally without clipping, obscuring the source hierarchy, or moving the transcript-context action outside the Citation Card.",
      project:
        "A deliberately long Project name for responsive evidence-card validation",
      session:
        "A deliberately long cross-channel checkout confirmation research Session",
      transcript:
        "S005_Deliberately_Long_Structured_Transcript_File_Name_For_Responsive_Validation.docx",
    },
  },
};
