import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { transcriptCodingCodes } from "@/mocks/fixtures/transcript-coding";
import { TranscriptHighlightFilters } from "./transcript-highlight-filters";

const meta = {
  title: "Research Objects/Transcript Coding/Highlight Filters",
  component: TranscriptHighlightFilters,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-[30rem] p-6"><Story /></div>],
  parameters: { docs: { description: { component: "Applies a match-any Code selection within the Highlight scope chosen in the workspace tabs. Provenance filtering is intentionally deferred." } } },
  args: { availableCodes: transcriptCodingCodes, onApply: fn(), onClear: fn(), onCodeIdsChange: fn() },
} satisfies Meta<typeof TranscriptHighlightFilters>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { defaultCodeIds: transcriptCodingCodes.slice(0, 2).map((code) => code.id), resultCount: 2, totalCount: 4 } };
export const TwoLineAcceptedCodes: Story = {
  args: {
    availableCodes: [
      ...transcriptCodingCodes,
      { id: "information-architecture", name: "Information architecture", description: "Labels, grouping, and navigation" },
      { id: "content-discoverability", name: "Content discoverability", description: "Finding research content" },
      { id: "cross-session-patterns", name: "Cross-session patterns", description: "Patterns across research Sessions" },
    ],
    defaultCodeIds: [
      ...transcriptCodingCodes.map((code) => code.id),
      "information-architecture",
      "content-discoverability",
      "cross-session-patterns",
    ],
    resultCount: 5,
    totalCount: 8,
  },
  parameters: {
    docs: {
      description: {
        story: "Accepted Code values wrap within the control for up to two lines, then truncate with an ellipsis.",
      },
    },
  },
};
export const Suggestions: Story = { args: { defaultCodeIds: [transcriptCodingCodes[0].id], resultCount: 1, resultNoun: "suggestions", totalCount: 2 } };
export const NoResults: Story = { args: { defaultCodeIds: [transcriptCodingCodes[2].id], resultCount: 0, totalCount: 8 } };
export const ClearTogether: Story = {
  args: { defaultCodeIds: [transcriptCodingCodes[0].id], resultCount: 2, totalCount: 8 },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Clear filters" }));
    await expect(args.onClear).toHaveBeenCalled();
  },
};
