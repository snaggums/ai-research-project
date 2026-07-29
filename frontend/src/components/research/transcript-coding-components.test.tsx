import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TranscriptCodePanel } from "./transcript-code-panel";
import { TranscriptCodeSuggestion } from "./transcript-code-suggestion";
import { TranscriptCodingSummary } from "./transcript-coding-summary";
import { TranscriptHighlightFilters } from "./transcript-highlight-filters";
import { TranscriptHighlightListItem } from "./transcript-highlight-list-item";
import { TranscriptReader } from "./transcript-reader";
import type { TranscriptCodeValue, TranscriptEvidenceValue, TranscriptHighlightValue } from "./transcript-coding-types";

const codes: TranscriptCodeValue[] = [
  { id: "navigation", name: "Navigation terminology", description: "Labels, grouping, and navigation" },
  { id: "confidence", name: "Workflow confidence", description: "Confidence while completing a workflow" },
];

const evidence: TranscriptEvidenceValue[] = [
  {
    id: "passage-1",
    excerpt: "I expected uploaded transcripts to be under Documents, but the menu called it Source Material.",
    location: "12:45–13:02",
    speaker: "Jordan Moore",
  },
  {
    id: "passage-2",
    excerpt: "I kept looking under Documents before I noticed the different label.",
    location: "15:08–15:18",
    speaker: "Jordan Moore",
  },
];

describe("Transcript Coding Research Objects", () => {
  it("selects a suggestion and expands every complete supporting passage", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TranscriptCodeSuggestion
        codeName="Navigation terminology"
        confidence={0.88}
        description="Labels for uploaded research did not match participant expectations."
        evidence={evidence}
        onSelect={onSelect}
        provenance="AI generated"
        selected
      />,
    );

    expect(screen.getByText(/2 supporting passages/)).toBeInTheDocument();
    expect(screen.queryByText(evidence[1].excerpt)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Navigation terminology/ }));
    expect(onSelect).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "View all supporting transcript evidence" }));
    expect(screen.getByText(/I kept looking under Documents/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View less supporting transcript evidence" })).toBeInTheDocument();
  });

  it("exposes Apply code for an uncoded Highlight and explains when Record assignment is required", async () => {
    const user = userEvent.setup();
    const onApplyCode = vi.fn();
    const { rerender } = render(
      <TranscriptCodeSuggestion
        codeName="Uncoded highlight"
        description="Saved for coding later."
        evidence={[evidence[0]]}
        onApplyCode={onApplyCode}
        status="uncoded"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Apply code" }));
    expect(onApplyCode).toHaveBeenCalledOnce();

    rerender(
      <TranscriptCodeSuggestion
        applyCodeDisabled
        applyCodeUnavailableReason="Assign this Session to a Record before applying a Code."
        codeName="Uncoded highlight"
        description="Saved for coding later."
        evidence={[evidence[0]]}
        onApplyCode={onApplyCode}
        status="uncoded"
      />,
    );

    const disabledAction = screen.getByRole("button", { name: "Apply code" });
    expect(disabledAction).toBeDisabled();
    expect(disabledAction).toHaveAccessibleDescription(
      "Assign this Session to a Record before applying a Code.",
    );
  });

  it("keeps accepted-highlight code removal distinct from destructive highlight deletion", async () => {
    const user = userEvent.setup();
    const onRemoveCode = vi.fn();
    const onDeleteHighlight = vi.fn();
    const onEditCode = vi.fn();
    render(
      <TranscriptCodeSuggestion
        codeName="Navigation terminology"
        defaultEvidenceExpanded
        description="Accepted code"
        evidence={evidence}
        onDeleteHighlight={onDeleteHighlight}
        onEditCode={onEditCode}
        onRemoveCode={onRemoveCode}
        status="accepted"
      />,
    );
    const editButton = screen.getByRole("button", { name: "Edit" });
    await user.click(editButton);
    await user.click(
      screen.getByRole("button", {
        name: `Remove Navigation terminology code from ${evidence[0].speaker}, ${evidence[0].location}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `Delete highlight from ${evidence[0].speaker}, ${evidence[0].location}`,
      }),
    );
    expect(onRemoveCode).toHaveBeenCalledWith(evidence[0].id);
    expect(onEditCode).toHaveBeenCalledOnce();
    expect(onDeleteHighlight).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Delete highlight?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete highlight" }));
    expect(onDeleteHighlight).toHaveBeenCalledWith(evidence[0].id);
    expect(
      screen.getByLabelText(`Highlight from ${evidence[1].speaker}, ${evidence[1].location}`),
    ).toBeInTheDocument();
  });

  it("constrains long accepted-highlight content to the right-rail width", () => {
    const longCodeName = "Evidence needs structured allegation-linked organization";
    render(
      <div className="w-[24.5rem]">
        <TranscriptCodeSuggestion
          codeName={longCodeName}
          description="Flat evidence lists lack types, clear labels, and links to the allegations each file supports, limiting later reviewers' ability to understand evidence context."
          evidence={[{
            ...evidence[0],
            excerpt: "I uploaded the four synthetic supporting documents and added a short description to each. Once I add the claim extract, audit spreadsheet, provider profile, and correspondence, they appear as one flat list.",
          }]}
          onDeleteHighlight={() => undefined}
          onRemoveCode={() => undefined}
          provenance="Researcher accepted AI suggestion"
          status="accepted"
        />
      </div>,
    );

    const title = screen.getAllByText(longCodeName)[0];
    const card = title.closest("article");
    const codeChip = screen.getAllByText(longCodeName)
      .map((node) => node.closest(".air-chip"))
      .find(Boolean);

    expect(card).toHaveClass("min-w-0", "overflow-hidden");
    expect(screen.getByText("Accepted")).toHaveClass("shrink-0");
    expect(codeChip).toHaveClass("max-w-full");
  });

  it("removes the entire accepted Code section through its card-level action", async () => {
    const user = userEvent.setup();
    const onRemoveAcceptedCode = vi.fn();

    function AcceptedCodeSection() {
      const [removed, setRemoved] = React.useState(false);
      if (removed) return null;
      return (
        <TranscriptCodeSuggestion
          codeName="Navigation terminology"
          description="Accepted code"
          evidence={evidence}
          onEditCode={() => undefined}
          onRemoveAcceptedCode={() => {
            onRemoveAcceptedCode();
            setRemoved(true);
          }}
          status="accepted"
        />
      );
    }

    render(<AcceptedCodeSection />);
    const editButton = screen.getByRole("button", { name: "Edit" });
    const removeButton = screen.getByRole("button", { name: "Remove" });
    expect(editButton.closest("footer")).toBe(removeButton.closest("footer"));
    await user.click(removeButton);
    expect(onRemoveAcceptedCode).toHaveBeenCalledOnce();
    expect(screen.queryByText("Navigation terminology")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("composes transcript blocks, removable codes, keyboard selection, and match navigation", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    const onRemoveCode = vi.fn();
    const onSelectWithKeyboard = vi.fn();
    const onNextMatch = vi.fn();
    render(
      <TranscriptReader
        blocks={[
          { ...evidence[0], codes: [codes[0]], state: "filtered-match" },
          { ...evidence[1], state: "dimmed" },
        ]}
        currentMatch={1}
        mode="filter-results"
        onHighlight={onHighlight}
        onNextMatch={onNextMatch}
        onRemoveCode={onRemoveCode}
        onSelectWithKeyboard={onSelectWithKeyboard}
        totalMatches={2}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select with keyboard" }));
    const firstPassage = screen.getByText(evidence[0].excerpt).closest("article");
    const secondPassage = screen.getByText(evidence[1].excerpt).closest("article");
    expect(firstPassage).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(secondPassage).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/Passage selected/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Highlight" }));
    expect(onHighlight).toHaveBeenCalledWith({
      blockId: evidence[1].id,
      endOffset: evidence[1].excerpt.length,
      location: evidence[1].location,
      method: "keyboard",
      speaker: evidence[1].speaker,
      startOffset: 0,
      text: evidence[1].excerpt,
    });
    expect(screen.queryByRole("toolbar", { name: "Transcript selection actions" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select with keyboard" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Select with keyboard" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Remove Navigation terminology code" }));
    expect(onSelectWithKeyboard).toHaveBeenCalledTimes(2);
    expect(onNextMatch).toHaveBeenCalledOnce();
    expect(onRemoveCode).toHaveBeenCalledWith("passage-1", "navigation");
  });

  it("creates an exact pointer range and keeps its toolbar beside the selected passage", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    render(
      <TranscriptReader
        blocks={evidence}
        mode="manual-selection"
        onHighlight={onHighlight}
      />,
    );

    const excerpt = screen.getByText(evidence[0].excerpt);
    const textNode = excerpt.firstChild;
    if (!textNode) throw new Error("Expected a selectable transcript text node.");
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 35);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    fireEvent.mouseUp(excerpt);

    const toolbar = screen.getByRole("toolbar", { name: "Transcript selection actions" });
    expect(toolbar).toHaveClass("absolute");
    expect(toolbar).toHaveStyle({ left: "96px" });
    expect(within(toolbar).queryByRole("button", { name: "Apply code" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Highlight" }));
    expect(onHighlight).toHaveBeenCalledWith({
      blockId: evidence[0].id,
      endOffset: 34,
      location: evidence[0].location,
      method: "pointer",
      speaker: evidence[0].speaker,
      startOffset: 2,
      text: evidence[0].excerpt.slice(2, 35).trim(),
    });
    expect(screen.queryByRole("toolbar", { name: "Transcript selection actions" })).not.toBeInTheDocument();
  });

  it("selects a whole passage on click and exposes inline Highlight actions", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    render(
      <TranscriptReader
        blocks={evidence}
        mode="manual-selection"
        onHighlight={onHighlight}
      />,
    );

    const excerpt = screen.getByText(evidence[0].excerpt);
    await user.click(excerpt);

    expect(excerpt.closest("article")).toHaveAttribute("data-state", "selection-active");
    expect(screen.getByRole("toolbar", { name: "Transcript selection actions" })).not.toHaveClass("absolute");
    await user.click(screen.getByRole("button", { name: "Highlight" }));
    expect(onHighlight).toHaveBeenCalledWith({
      blockId: evidence[0].id,
      endOffset: evidence[0].excerpt.length,
      location: evidence[0].location,
      method: "block",
      speaker: evidence[0].speaker,
      startOffset: 0,
      text: evidence[0].excerpt,
    });
  });

  it("disables duplicate Highlight creation without exposing a selection-level Apply code action", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    render(
      <TranscriptReader
        blocks={[{ ...evidence[0], highlighted: true, state: "accepted-coded" }]}
        mode="manual-selection"
        onHighlight={onHighlight}
      />,
    );

    await user.click(screen.getByText(evidence[0].excerpt));
    const highlightedButton = screen.getByRole("button", { name: "Highlighted" });
    expect(highlightedButton).toBeDisabled();
    expect(highlightedButton.querySelector(".lucide-check")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply code" })).not.toBeInTheDocument();
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("clears the selected-block indicator with Escape for pointer and keyboard selection", async () => {
    const user = userEvent.setup();

    function ReaderSelectionHarness() {
      const [activeBlockId, setActiveBlockId] = React.useState<string>();
      return (
        <TranscriptReader
          activeHighlightId={activeBlockId}
          blocks={evidence}
          mode="manual-selection"
          onClearSelection={() => setActiveBlockId(undefined)}
          onHighlight={() => undefined}
          onSelectBlock={setActiveBlockId}
          onSelectWithKeyboard={() => undefined}
        />
      );
    }

    render(<ReaderSelectionHarness />);
    const firstPassage = screen.getByText(evidence[0].excerpt).closest("article");
    if (!firstPassage) throw new Error("Expected the first Transcript passage.");

    await user.click(firstPassage);
    expect(firstPassage).toHaveAttribute("aria-current", "true");
    await user.keyboard("{Escape}");
    expect(firstPassage).not.toHaveAttribute("aria-current");

    await user.click(screen.getByRole("button", { name: "Select with keyboard" }));
    await user.keyboard("{Enter}");
    expect(firstPassage).toHaveAttribute("aria-current", "true");
    await user.keyboard("{Escape}");
    expect(firstPassage).not.toHaveAttribute("aria-current");
  });

  it("applies multiple existing codes and exposes the create-code view", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onModeChange = vi.fn();
    render(<TranscriptCodePanel availableCodes={codes} onApply={onApply} onModeChange={onModeChange} />);

    await user.click(screen.getByRole("option", { name: /Navigation terminology/ }));
    await user.click(screen.getByRole("option", { name: /Workflow confidence/ }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledWith(["navigation", "confidence"]);
    await user.click(screen.getByRole("button", { name: "Create a new code" }));
    expect(onModeChange).toHaveBeenCalledWith("create");
  });

  it("sorts selected codes first and alphabetizes both code groups", async () => {
    const user = userEvent.setup();
    render(
      <TranscriptCodePanel
        availableCodes={[
          { id: "zulu", name: "Zulu" },
          { id: "beta", name: "Beta" },
          { id: "alpha", name: "Alpha" },
          { id: "gamma", name: "Gamma" },
        ]}
      />,
    );

    const listbox = screen.getByRole("listbox", { name: "Available codes" });
    expect(within(listbox).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
      "Zulu",
    ]);

    await user.click(screen.getByRole("option", { name: "Zulu" }));
    await user.click(screen.getByRole("option", { name: "Alpha" }));

    expect(within(listbox).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Alpha",
      "Zulu",
      "Beta",
      "Gamma",
    ]);
    expect(
      within(screen.getByLabelText("Codes to apply"))
        .getAllByRole("button", { name: /Remove .* code/ })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Remove Alpha code", "Remove Zulu code"]);
  });

  it("applies match-any Code filters without duplicating status controls", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(
      <TranscriptHighlightFilters
        availableCodes={codes}
        defaultCodeIds={["navigation"]}
        onApply={onApply}
        onClear={onClear}
        resultCount={3}
        totalCount={8}
      />,
    );
    expect(screen.getByText("3 of 8 highlights")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith({ codeIds: ["navigation"] });
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("constrains accepted Code values to two lines inside the filter control", () => {
    render(
      <TranscriptHighlightFilters
        availableCodes={codes}
        defaultCodeIds={codes.map((code) => code.id)}
      />,
    );

    const acceptedCodesControl = screen.getByRole("button", { name: "Codes" });
    const selectedText = within(acceptedCodesControl).getByTitle(codes.map((code) => code.name).join(", "));
    expect(selectedText).toHaveClass("line-clamp-2");
    expect(selectedText).toHaveClass("[overflow-wrap:anywhere]");
    expect(acceptedCodesControl).toHaveClass("w-full");
  });

  it("confirms Highlight List deletion once and preserves the Highlight when canceled", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const highlight: TranscriptHighlightValue = {
      id: "highlight-uncoded",
      codes: [],
      evidence: evidence[0],
      provenance: "Researcher highlighted",
      status: "uncoded",
    };
    render(<TranscriptHighlightListItem highlight={highlight} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete highlight" }));
    let dialog = screen.getByRole("dialog", { name: "Delete highlight?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText(evidence[0].excerpt, { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete highlight" }));
    dialog = screen.getByRole("dialog", { name: "Delete highlight?" });
    await user.click(within(dialog).getByRole("button", { name: "Delete highlight" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("renders the complete filtered-list contract and coding generation states", () => {
    const highlight: TranscriptHighlightValue = {
      id: "highlight-1",
      codes: [codes[0]],
      evidence: evidence[0],
      provenance: "Researcher accepted",
      status: "accepted",
    };
    const { rerender } = render(
      <TranscriptHighlightListItem
        highlight={highlight}
        onDelete={() => undefined}
        onEditCodes={() => undefined}
        onOpenInTranscript={() => undefined}
      />,
    );
    const item = screen.getByRole("article");
    expect(within(item).getByRole("button", { name: /Open in transcript/ })).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: /Edit codes/ })).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: /Delete highlight/ })).toBeInTheDocument();

    rerender(<TranscriptCodingSummary state="processing" suggestionCount={8} />);
    expect(screen.getByText("Generating code suggestions")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Transcript codes" })).toHaveAttribute("aria-busy", "true");
  });
});
