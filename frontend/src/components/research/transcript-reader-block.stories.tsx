import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { transcriptCodingCodes, transcriptCodingEvidence } from "@/mocks/fixtures/transcript-coding";
import { TranscriptReaderBlock } from "./transcript-reader-block";

const block = { ...transcriptCodingEvidence[0], codes: [transcriptCodingCodes[0]] };
const meta = {
  title: "Research Objects/Transcript Coding/Transcript Reader Block",
  component: TranscriptReaderBlock,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-[44rem] p-6"><Story /></div>],
  parameters: {
    docs: { description: { component: "A complete transcript passage whose emphasis reflects text selection, accepted coding, filtering, or surrounding context. Removing the final code preserves an uncoded Highlight." } },
  },
  args: { block, onRemoveCode: fn() },
} satisfies Meta<typeof TranscriptReaderBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { block: { ...block, codes: [], state: "default" } } };
export const SelectionActive: Story = { args: { block: { ...block, codes: [], state: "selection-active" } } };
export const AcceptedCoded: Story = { args: { block: { ...block, state: "accepted-coded" } } };
export const Uncoded: Story = { args: { block: { ...block, codes: [], state: "uncoded" } } };
export const FilteredMatch: Story = { args: { block: { ...block, state: "filtered-match" } } };
export const DimmedContext: Story = { args: { block: { ...block, codes: [], state: "dimmed" } } };
export const Selected: Story = { args: { block: { ...block, state: "filtered-match" }, selected: true } };
export const LongPassage: Story = {
  args: {
    block: {
      ...block,
      excerpt: `${block.excerpt} I then returned to the navigation several times because the destination and the expected next step were still unclear.`,
      state: "accepted-coded",
    },
  },
};
