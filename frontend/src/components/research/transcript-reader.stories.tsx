import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { transcriptCodingCodes, transcriptReaderBlocks } from "@/mocks/fixtures/transcript-coding";
import type {
  TranscriptHighlightValue,
  TranscriptTextSelectionValue,
} from "./transcript-coding-types";
import { TranscriptHighlightListItem } from "./transcript-highlight-list-item";
import { TranscriptReader } from "./transcript-reader";

type TranscriptReaderStoryProps = React.ComponentProps<typeof TranscriptReader>;

function evidenceFromSelection(selection: TranscriptTextSelectionValue) {
  return {
    excerpt: selection.text,
    id: `${selection.blockId}-${selection.startOffset}-${selection.endOffset}`,
    location: selection.location,
    speaker: selection.speaker,
  };
}

function ManualSelectionExample(props: TranscriptReaderStoryProps) {
  const [savedHighlight, setSavedHighlight] = React.useState<TranscriptHighlightValue>();

  function saveHighlight(selection: TranscriptTextSelectionValue) {
    setSavedHighlight({
      codes: [],
      evidence: evidenceFromSelection(selection),
      id: `highlight-${selection.blockId}-${selection.startOffset}-${selection.endOffset}`,
      provenance: "Researcher highlighted",
      status: "uncoded",
    });
  }

  return (
    <div className="grid gap-6">
      <TranscriptReader
        {...props}
        onHighlight={(selection) => {
          props.onHighlight?.(selection);
          saveHighlight(selection);
        }}
      />
      {savedHighlight ? (
        <section aria-labelledby="saved-highlight-title" className="grid gap-3">
          <h3 className="text-xl font-semibold" id="saved-highlight-title">Saved Highlight</h3>
          <TranscriptHighlightListItem highlight={savedHighlight} />
        </section>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Research Objects/Transcript Coding/Transcript Reader",
  component: TranscriptReader,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-[44rem] p-6"><Story /></div>],
  parameters: { docs: { description: { component: "The continuous transcript reading surface. Selection, suggestions, accepted codes, and filters change passage emphasis without removing surrounding context." } } },
  args: { blocks: transcriptReaderBlocks, onHighlight: fn(), onSelectWithKeyboard: fn() },
} satisfies Meta<typeof TranscriptReader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ReviewSuggestions: Story = { args: { activeHighlightId: "reader-navigation", mode: "review-suggestions" } };
export const ManualSelection: Story = {
  args: {
    blocks: transcriptReaderBlocks.map((block) => ({ ...block, state: "default" })),
    mode: "manual-selection",
  },
  render: (args) => <ManualSelectionExample {...args} />,
};
export const WholeBlockSelection: Story = {
  args: {
    blocks: transcriptReaderBlocks.map((block) => ({ ...block, state: "default" })),
    mode: "manual-selection",
  },
  render: (args) => <ManualSelectionExample {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const passage = canvas.getByText(transcriptReaderBlocks[0].excerpt);
    await userEvent.click(passage);
    await expect(passage.closest("article")).toHaveAttribute("data-state", "selection-active");
    await expect(canvas.getByRole("toolbar", { name: "Transcript selection actions" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Highlight" }));
    await expect(args.onHighlight).toHaveBeenCalledWith(expect.objectContaining({
      blockId: transcriptReaderBlocks[0].id,
      method: "block",
      text: transcriptReaderBlocks[0].excerpt,
    }));
  },
};
export const AlreadyHighlightedSelection: Story = {
  args: {
    blocks: transcriptReaderBlocks.map((block, index) => ({
      ...block,
      highlighted: index === 1,
      state: index === 1 ? "accepted-coded" as const : "default" as const,
    })),
    mode: "manual-selection",
  },
  render: (args) => <ManualSelectionExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText(transcriptReaderBlocks[1].excerpt));
    await expect(canvas.getByRole("button", { name: "Highlighted" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Apply code" })).not.toBeInTheDocument();
  },
};
export const EscapeClearsSelection: Story = {
  args: {
    blocks: transcriptReaderBlocks.map((block) => ({ ...block, state: "default" as const })),
    mode: "manual-selection",
  },
  render: (args) => <ManualSelectionExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstPassage = canvas.getByText(transcriptReaderBlocks[0].excerpt).closest("article");
    if (!firstPassage) throw new Error("Expected the first Transcript passage.");

    await userEvent.click(firstPassage);
    await expect(firstPassage).toHaveAttribute("aria-current", "true");
    await userEvent.keyboard("{Escape}");
    await expect(firstPassage).not.toHaveAttribute("aria-current");

    await userEvent.click(canvas.getByRole("button", { name: "Select with keyboard" }));
    await userEvent.keyboard("{Enter}");
    await expect(firstPassage).toHaveAttribute("aria-current", "true");
    await userEvent.keyboard("{Escape}");
    await expect(firstPassage).not.toHaveAttribute("aria-current");
  },
};
export const FilteredMatches: Story = {
  args: {
    blocks: transcriptReaderBlocks.map((block, index) => ({ ...block, codes: index === 1 ? [transcriptCodingCodes[0]] : [], state: index === 1 ? "filtered-match" : "dimmed" })),
    currentMatch: 1,
    mode: "filter-results",
    onNextMatch: fn(),
    onPreviousMatch: fn(),
    totalMatches: 1,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Select with keyboard" }));
    await expect(canvas.getByText(/Keyboard selection active/)).toBeInTheDocument();

    const matchingPassage = canvas.getByText(transcriptReaderBlocks[1].excerpt).closest("article");
    await expect(matchingPassage).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("toolbar", { name: "Transcript selection actions" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Highlight" }));
    await expect(args.onHighlight).toHaveBeenCalledWith(expect.objectContaining({
      blockId: transcriptReaderBlocks[1].id,
      method: "keyboard",
      text: transcriptReaderBlocks[1].excerpt,
    }));
    await expect(canvas.queryByText(/Keyboard selection active/)).not.toBeInTheDocument();
  },
};
