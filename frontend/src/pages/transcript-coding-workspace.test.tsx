import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  importedTemplatedTranscriptBlocks,
  transcriptCodingCodes,
  transcriptCodingHighlights,
  transcriptCodingSuggestions,
  transcriptReaderBlocks,
} from "@/mocks/fixtures/transcript-coding";
import { TranscriptCodingWorkspaceView } from "./transcript-coding-views";

const props = {
  acceptedHighlights: transcriptCodingHighlights,
  availableCodes: transcriptCodingCodes,
  blocks: transcriptReaderBlocks,
  suggestions: transcriptCodingSuggestions.map((suggestion) => ({
    ...suggestion,
    evidence: [...suggestion.evidence],
  })),
};

describe("Transcript Coding Workspace filters", () => {
  it("renders imported DOCX turns as separate speaker and timestamp blocks", () => {
    render(
      <TranscriptCodingWorkspaceView
        {...props}
        acceptedHighlights={[]}
        blocks={importedTemplatedTranscriptBlocks}
        suggestions={[]}
      />,
    );

    expect(screen.getByText(/Maya Chen.*0:00/)).toBeInTheDocument();
    expect(screen.getByText(/Tanya.*3:06/)).toBeInTheDocument();
    expect(screen.getByText(/Jordan - UX.*0:00/)).toBeInTheDocument();
    expect(screen.getByText(/confirm I am in my mother's account/)).toBeInTheDocument();
  });

  it("keeps manual Highlight actions available before AI suggestions exist", async () => {
    const user = userEvent.setup();
    const onCreateHighlight = vi.fn();
    render(
      <TranscriptCodingWorkspaceView
        {...props}
        acceptedHighlights={[]}
        onCreateHighlight={onCreateHighlight}
        state="no-suggestions"
        suggestions={[]}
      />,
    );

    expect(screen.getByText("No AI suggestions are awaiting review.")).toBeInTheDocument();
    await user.click(screen.getByText(transcriptReaderBlocks[0].excerpt));
    await user.click(screen.getByRole("button", { name: "Highlight" }));
    expect(onCreateHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ status: "uncoded" }),
      expect.objectContaining({ blockId: transcriptReaderBlocks[0].id }),
    );
  });

  it("uses mutually exclusive status tabs and applies Code filters cumulatively", async () => {
    const user = userEvent.setup();
    render(<TranscriptCodingWorkspaceView {...props} />);

    expect(screen.getByRole("heading", { name: "Suggestions awaiting review" })).toBeInTheDocument();
    const suggestionsTab = screen.getByRole("tab", { name: "Suggestions" });
    expect(suggestionsTab).toHaveAttribute("aria-selected", "true");
    expect(suggestionsTab).toHaveTextContent("(2)");

    const acceptedTab = screen.getByRole("tab", { name: "Accepted highlights" });
    await user.click(acceptedTab);
    expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
    await user.click(acceptedTab);
    expect(acceptedTab).toHaveAttribute("aria-selected", "true");

    const uncodedTab = screen.getByRole("tab", { name: "Uncoded highlights" });
    await user.click(uncodedTab);
    expect(screen.getByRole("heading", { name: "Uncoded highlights" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter highlights" })).toBeDisabled();

    await user.click(suggestionsTab);
    expect(screen.getByRole("heading", { name: "Suggestions awaiting review" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filter highlights" }));
    expect(screen.getByText("2 of 2 suggestions")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    const toolbar = screen.getByLabelText("Highlight filter toolbar");
    expect(within(toolbar).queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Active filters" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Codes" }));
    await user.click(screen.getByRole("option", { name: "Navigation terminology" }));
    expect(screen.getByText("1 of 2 suggestions")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(screen.getByRole("heading", { name: "Suggestions awaiting review" })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.getByLabelText("1 active filter criteria")).toBeInTheDocument();
    const activeFilters = screen.getByRole("region", { name: "Active filters" });
    expect(within(activeFilters).getByText("Navigation terminology")).toBeInTheDocument();
    expect(within(activeFilters).getByText("1 of 2 suggestions match the active filters.")).toBeInTheDocument();
    const suggestionsSection = screen.getByRole("heading", { name: "Suggestions awaiting review" }).closest("section");
    if (!suggestionsSection) throw new Error("Expected the Suggestions section.");
    expect(within(suggestionsSection).queryByText("Workflow confidence", { selector: "span" })).not.toBeInTheDocument();

    await user.click(acceptedTab);
    expect(within(activeFilters).getByText("1 of 2 highlights match the active filters.")).toBeInTheDocument();
    await user.click(uncodedTab);
    expect(screen.queryByRole("region", { name: "Active filters" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter highlights" })).toBeDisabled();
    await user.click(suggestionsTab);
    expect(screen.getByRole("region", { name: "Active filters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Navigation terminology filter" }));
    expect(within(toolbar).queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/active filter criteria/)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Active filters" })).not.toBeInTheDocument();
  });

  it("renders only matching saved Highlights in the filtered List view", () => {
    render(<TranscriptCodingWorkspaceView {...props} state="filtered-list" />);

    const activeFilters = screen.getByRole("region", { name: "Active filters" });
    expect(within(activeFilters).getByText("1 of 2 highlights match the active filters.")).toBeInTheDocument();
    expect(within(activeFilters).getByText("Navigation terminology")).toBeInTheDocument();

    const results = screen.getByRole("heading", { name: "Matching highlights" }).closest("section");
    if (!results) throw new Error("Expected the matching Highlights section.");
    expect(within(results).getByText(/I expected uploaded transcripts to be under Documents/)).toBeInTheDocument();
    expect(within(results).queryByText(/I paused because I was not sure/)).not.toBeInTheDocument();
    expect(within(results).queryByText(/I kept looking under Documents/)).not.toBeInTheDocument();
  });

  it("retains an exact selection when saving an uncoded Highlight", async () => {
    const user = userEvent.setup();
    const onCreateHighlight = vi.fn();
    render(<TranscriptCodingWorkspaceView {...props} onCreateHighlight={onCreateHighlight} state="manual-selection" />);

    await user.click(screen.getByRole("button", { name: "Select with keyboard" }));
    await user.keyboard("{ArrowUp}{Enter}");
    await user.click(screen.getByRole("button", { name: "Highlight" }));

    expect(onCreateHighlight).toHaveBeenCalledWith(
      expect.objectContaining({
        codes: [],
        evidence: expect.objectContaining({
          blockId: transcriptReaderBlocks[0].id,
          excerpt: transcriptReaderBlocks[0].excerpt,
        }),
        status: "uncoded",
      }),
      expect.objectContaining({
        blockId: transcriptReaderBlocks[0].id,
        text: transcriptReaderBlocks[0].excerpt,
      }),
    );
    expect(screen.getByRole("heading", { name: "Uncoded highlights" })).toBeInTheDocument();
    expect(screen.getAllByText(transcriptReaderBlocks[0].excerpt, { exact: false })).toHaveLength(2);
  });

  it("creates an uncoded whole-passage Highlight when a reader block is clicked", async () => {
    const user = userEvent.setup();
    const onCreateHighlight = vi.fn();
    render(<TranscriptCodingWorkspaceView {...props} onCreateHighlight={onCreateHighlight} state="manual-selection" />);

    await user.click(screen.getByText(transcriptReaderBlocks[0].excerpt));
    await user.click(screen.getByRole("button", { name: "Highlight" }));

    expect(onCreateHighlight).toHaveBeenCalledWith(
      expect.objectContaining({
        evidence: expect.objectContaining({ excerpt: transcriptReaderBlocks[0].excerpt }),
        status: "uncoded",
      }),
      expect.objectContaining({
        blockId: transcriptReaderBlocks[0].id,
        method: "block",
        text: transcriptReaderBlocks[0].excerpt,
      }),
    );
    expect(screen.getByRole("heading", { name: "Uncoded highlights" })).toBeInTheDocument();
  });

  it("applies an existing Code directly from the Uncoded highlights rail", async () => {
    const user = userEvent.setup();
    const onApplyCodes = vi.fn();
    render(<TranscriptCodingWorkspaceView {...props} onApplyCodes={onApplyCodes} />);

    await user.click(screen.getByRole("tab", { name: "Uncoded highlights" }));
    await user.click(screen.getByRole("button", { name: "Apply code" }));
    expect(screen.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /Navigation terminology/ }));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApplyCodes).toHaveBeenCalledWith({
      codeIds: ["code-navigation-terminology"],
      highlightId: "highlight-uncoded",
    });
    expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
  });

  it("reconciles an optimistic Highlight ID before applying a Code", async () => {
    const user = userEvent.setup();
    const onApplyCodes = vi.fn();
    const { rerender } = render(
      <TranscriptCodingWorkspaceView
        {...props}
        acceptedHighlights={[]}
        onApplyCodes={onApplyCodes}
        state="no-suggestions"
        suggestions={[]}
      />,
    );

    await user.click(screen.getByText(transcriptReaderBlocks[0].excerpt));
    await user.click(screen.getByRole("button", { name: "Highlight" }));
    await user.click(screen.getByRole("button", { name: "Apply code" }));

    rerender(
      <TranscriptCodingWorkspaceView
        {...props}
        acceptedHighlights={[{
          codes: [],
          evidence: {
            ...transcriptReaderBlocks[0],
            id: "persisted-evidence",
          },
          id: "persisted-highlight",
          provenance: "Researcher highlighted",
          status: "uncoded",
        }]}
        onApplyCodes={onApplyCodes}
        state="accepted-highlights"
        suggestions={[]}
      />,
    );

    await user.click(screen.getByRole("option", { name: /Navigation terminology/ }));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApplyCodes).toHaveBeenCalledWith({
      codeIds: ["code-navigation-terminology"],
      highlightId: "persisted-highlight",
    });
  });

  it("disables right-rail Code application when the Session has no Record", async () => {
    const user = userEvent.setup();
    render(<TranscriptCodingWorkspaceView {...props} canApplyCodes={false} />);

    await user.click(screen.getByRole("tab", { name: "Uncoded highlights" }));
    const applyCode = screen.getByRole("button", { name: "Apply code" });
    expect(applyCode).toBeDisabled();
    expect(applyCode).toHaveAccessibleDescription(
      "Assign this Session to a Record before applying a Code.",
    );
  });

  it("retains the whole-passage selection when applying a Code from a clicked reader block", async () => {
    const user = userEvent.setup();
    const onApplyCodes = vi.fn();
    render(<TranscriptCodingWorkspaceView {...props} onApplyCodes={onApplyCodes} state="manual-selection" />);

    await user.click(screen.getByText(transcriptReaderBlocks[0].excerpt));
    await user.click(screen.getByRole("button", { name: "Apply code" }));
    await user.click(screen.getByRole("option", { name: /Information architecture/ }));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApplyCodes).toHaveBeenCalledWith(expect.objectContaining({
      codeIds: ["code-information-architecture"],
      selection: expect.objectContaining({
        blockId: transcriptReaderBlocks[0].id,
        method: "block",
        text: transcriptReaderBlocks[0].excerpt,
      }),
    }));
    expect(screen.getAllByText("Information architecture", { selector: "span" }).length).toBeGreaterThan(0);
  });

  it("keeps a pending passage through code creation and application", async () => {
    const user = userEvent.setup();
    const onApplyCodes = vi.fn();
    const onCreateCode = vi.fn();
    render(
      <TranscriptCodingWorkspaceView
        {...props}
        onApplyCodes={onApplyCodes}
        onCreateCode={onCreateCode}
        state="manual-selection"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select with keyboard" }));
    await user.keyboard("{ArrowUp}{Enter}");
    await user.click(screen.getByRole("button", { name: "Apply code" }));
    await user.click(screen.getByRole("button", { name: "Create a new code" }));
    await user.type(screen.getByLabelText(/Code name/), "Research expectations");
    await user.type(screen.getByLabelText("Description"), "Expected locations and labels.");
    await user.click(screen.getByRole("button", { name: "Create code" }));

    expect(onCreateCode).toHaveBeenCalledWith(expect.objectContaining({
      name: "Research expectations",
    }));
    expect(screen.getByRole("option", { name: /Research expectations/ })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApplyCodes).toHaveBeenCalledWith(expect.objectContaining({
      codeIds: ["code-research-expectations"],
      selection: expect.objectContaining({
        blockId: transcriptReaderBlocks[0].id,
        text: transcriptReaderBlocks[0].excerpt,
      }),
    }));
    expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
    expect(screen.getAllByText("Research expectations", { selector: "span" }).length).toBeGreaterThan(0);
  });

  it("visibly accepts, edits, and rejects suggestions", async () => {
    const user = userEvent.setup();
    render(<TranscriptCodingWorkspaceView {...props} />);

    const selectedSuggestionCard = screen
      .getByRole("button", { name: /Navigation terminology Labels for uploaded research/ })
      .closest("article");
    if (!selectedSuggestionCard) throw new Error("Expected the selected suggestion card.");
    await user.click(within(selectedSuggestionCard).getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByRole("textbox", { name: /Code name/ }));
    await user.type(screen.getByRole("textbox", { name: /Code name/ }), "Content terminology");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Content terminology", { selector: "span" })).toBeInTheDocument();

    const editedSuggestionCard = screen.getByText("Content terminology", { selector: "span" }).closest("article");
    if (!editedSuggestionCard) throw new Error("Expected the edited suggestion card.");
    await user.click(within(editedSuggestionCard).getByRole("button", { name: "Accept" }));
    expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Suggestions" })).toHaveTextContent("(1)");

    await user.click(screen.getByRole("tab", { name: "Suggestions" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByRole("tab", { name: "Suggestions" })).toHaveTextContent("(0)");
    expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
  });

  it("opens a List result in the transcript and edits its applied Codes", async () => {
    const user = userEvent.setup();
    const onOpenHighlight = vi.fn();
    render(
      <TranscriptCodingWorkspaceView
        {...props}
        onOpenHighlight={onOpenHighlight}
        state="filtered-list"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Open in transcript/ }));
    expect(onOpenHighlight).toHaveBeenCalledWith("highlight-navigation");
    expect(screen.getByRole("heading", { name: "Transcript" })).toBeInTheDocument();
    expect(screen.getByText(transcriptReaderBlocks[1].excerpt).closest("article")).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "Highlight list" }));
    await user.click(screen.getByRole("button", { name: "Edit codes" }));
    expect(screen.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Navigation terminology/ })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("option", { name: /Information architecture/ }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
    expect(screen.getAllByText("Information architecture", { selector: "span" }).length).toBeGreaterThan(0);
  });
});
