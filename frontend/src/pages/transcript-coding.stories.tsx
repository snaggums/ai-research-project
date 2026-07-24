import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { toSessionSummary } from "@/adapters/sessions";
import { toTranscriptDocumentDetail } from "@/adapters/transcripts";
import { ApplicationShell } from "@/components/application";
import {
  transcriptApiFixtures,
} from "@/mocks/fixtures/transcripts";
import {
  transcriptCodingCodes,
  transcriptCodingHighlights,
  transcriptCodingSuggestions,
  importedTemplatedTranscriptBlocks,
  transcriptReaderBlocks,
} from "@/mocks/fixtures/transcript-coding";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { SessionDetailView } from "./session-views";
import { TranscriptCodingWorkspaceView, type TranscriptCodingWorkspaceViewProps } from "./transcript-coding-views";
import { SessionTranscriptWorkspaceView } from "./transcript-views";

function StoryPage(props: TranscriptCodingWorkspaceViewProps) {
  const projectId = "alpha-project";
  const sessionId = "mobile-checkout-test";
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell activeProjectItem="sessions" context="project" project={{ id: projectId, name: "Alpha Project" }}>
        <SessionDetailView
          activeTab="transcript"
          onEditSession={() => undefined}
          projectId={projectId}
          projectName="Alpha Project"
          session={toSessionSummary(sessionApiFixtures[0])}
          transcriptContent={(
            <div className="grid gap-8">
              <SessionTranscriptWorkspaceView
                documents={[toTranscriptDocumentDetail(transcriptApiFixtures[0])]}
                onDelete={() => undefined}
                onRetry={() => undefined}
                onSearch={() => undefined}
                onSetPrimary={() => undefined}
                onUpload={() => undefined}
                projectId={projectId}
                sessionId={sessionId}
              />
              <TranscriptCodingWorkspaceView {...props} />
            </div>
          )}
        />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Sessions/Transcript Coding Workspace",
  component: StoryPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Desktop source compositions for the approved 05.15 Transcript Coding Workspace. The existing Transcripts section remains above Transcript coding.",
      },
    },
  },
  args: {
    acceptedHighlights: transcriptCodingHighlights,
    availableCodes: transcriptCodingCodes,
    blocks: transcriptReaderBlocks,
    onAcceptSuggestion: fn(),
    onApplyCodes: fn(),
    onCreateCode: fn(),
    onCreateHighlight: fn(),
    onDeleteHighlight: fn(),
    onEditCode: fn(),
    onEditSuggestion: fn(),
    onOpenHighlight: fn(),
    onRegenerate: fn(),
    onRejectSuggestion: fn(),
    onRemoveAcceptedCode: fn(),
    onRemoveCode: fn(),
    suggestions: transcriptCodingSuggestions.map((suggestion) => ({ ...suggestion, evidence: [...suggestion.evidence] })),
  },
} satisfies Meta<typeof StoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReviewSuggestions: Story = {};
export const ImportedTemplatedDocx: Story = {
  args: {
    blocks: importedTemplatedTranscriptBlocks,
    suggestions: [],
    acceptedHighlights: [],
  },
};
export const AcceptedHighlights: Story = { args: { state: "accepted-highlights" } };
export const ManualSelection: Story = {
  args: { state: "manual-selection" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Select with keyboard" }));
    await userEvent.keyboard("{ArrowUp}{Enter}");
    await userEvent.click(canvas.getByRole("button", { name: "Highlight" }));
    await expect(args.onCreateHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ status: "uncoded" }),
      expect.objectContaining({ text: transcriptReaderBlocks[0].excerpt }),
    );
    await expect(canvas.getByRole("heading", { name: "Uncoded highlights" })).toBeInTheDocument();
  },
};
export const ClickPassageAndHighlight: Story = {
  args: { state: "manual-selection" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText(transcriptReaderBlocks[0].excerpt));
    await expect(canvas.getByRole("toolbar", { name: "Transcript selection actions" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Highlight" }));
    await expect(args.onCreateHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ status: "uncoded" }),
      expect.objectContaining({
        blockId: transcriptReaderBlocks[0].id,
        method: "block",
        text: transcriptReaderBlocks[0].excerpt,
      }),
    );
  },
};
export const ClickPassageAndApplyCode: Story = {
  args: { state: "manual-selection" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText(transcriptReaderBlocks[0].excerpt));
    await userEvent.click(canvas.getByRole("button", { name: "Apply code" }));
    await userEvent.click(canvas.getByRole("option", { name: /Information architecture/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(args.onApplyCodes).toHaveBeenCalledWith(expect.objectContaining({
      codeIds: ["code-information-architecture"],
      selection: expect.objectContaining({
        blockId: transcriptReaderBlocks[0].id,
        method: "block",
        text: transcriptReaderBlocks[0].excerpt,
      }),
    }));
  },
};
export const ApplyCodeToUncodedHighlight: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Uncoded highlights" }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply code" }));
    await expect(canvas.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("option", { name: /Navigation terminology/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(args.onApplyCodes).toHaveBeenCalledWith({
      codeIds: ["code-navigation-terminology"],
      highlightId: "highlight-uncoded",
    });
    await expect(canvas.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
  },
};
export const UncodedRecordRequired: Story = {
  args: { canApplyCodes: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Uncoded highlights" }));
    await expect(canvas.getByRole("button", { name: "Apply code" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Apply code" })).toHaveAccessibleDescription(
      "Assign this Session to a Record before applying a Code.",
    );
  },
};
export const ApplyCode: Story = { args: { state: "apply-code" } };
export const ActiveFilters: Story = { args: { state: "active-filters" } };
export const FilteredHighlightList: Story = { args: { state: "filtered-list" } };
export const Processing: Story = { args: { state: "processing" } };
export const NoSuggestions: Story = { args: { state: "no-suggestions", suggestions: [] } };
export const RecoverableError: Story = { args: { state: "error" } };

export const CreateAndApplyCodeToSelection: Story = {
  args: { state: "manual-selection" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Select with keyboard" }));
    await userEvent.keyboard("{ArrowUp}{Enter}");
    await userEvent.click(canvas.getByRole("button", { name: "Apply code" }));
    await userEvent.click(canvas.getByRole("button", { name: "Create a new code" }));
    await userEvent.type(canvas.getByRole("textbox", { name: /Code name/ }), "Research expectations");
    await userEvent.type(canvas.getByRole("textbox", { name: "Description" }), "Expected locations and labels.");
    await userEvent.click(canvas.getByRole("button", { name: "Create code" }));
    await expect(canvas.getByRole("option", { name: /Research expectations/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(args.onApplyCodes).toHaveBeenCalledWith(expect.objectContaining({
      codeIds: ["code-research-expectations"],
      selection: expect.objectContaining({ text: transcriptReaderBlocks[0].excerpt }),
    }));
    await expect(canvas.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
  },
};

export const AcceptSuggestionAndUpdateWorkspace: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const selectedSuggestion = canvas
      .getByRole("button", { name: /Navigation terminology Labels for uploaded research/ })
      .closest("article");
    if (!selectedSuggestion) throw new Error("Expected the selected suggestion card.");
    await userEvent.click(within(selectedSuggestion).getByRole("button", { name: "Accept" }));
    await expect(args.onAcceptSuggestion).toHaveBeenCalledWith("suggestion-navigation");
    await expect(canvas.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "Suggestions" })).toHaveTextContent("(1)");
  },
};

export const OpenAndEditListResult: Story = {
  args: { state: "filtered-list" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Open in transcript/ }));
    await expect(args.onOpenHighlight).toHaveBeenCalledWith("highlight-navigation");
    await userEvent.click(canvas.getByRole("button", { name: "Highlight list" }));
    await userEvent.click(canvas.getByRole("button", { name: "Edit codes" }));
    await expect(canvas.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
    await expect(canvas.getByRole("option", { name: /Navigation terminology/ })).toHaveAttribute("aria-selected", "true");
  },
};

export const SelectSuggestion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Workflow confidence/ }));
    await expect(canvas.getByText("The participant paused because the destination label did not communicate what happened next.").closest("article")).toHaveAttribute("data-selected", "true");
  },
};

export const ApplyFiltersAndReturnToSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Filter highlights" }));
    await expect(canvas.getByRole("heading", { name: "Filter highlights" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Codes" }));
    await userEvent.click(canvas.getByRole("option", { name: "Navigation terminology" }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply filters" }));
    await expect(canvas.getByRole("heading", { name: "Suggestions awaiting review" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    await expect(canvas.getByLabelText("1 active filter criteria")).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: "Active filters" })).toBeInTheDocument();
    await expect(canvas.getByText("1 of 2 suggestions match the active filters.")).toBeInTheDocument();
  },
};
