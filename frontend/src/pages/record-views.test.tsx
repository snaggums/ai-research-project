import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { toSessionSummary } from "@/adapters/sessions";
import { recordCodeDetails } from "@/components/research/record-code-story-data";
import { askRecordSuggestedQuestions } from "@/mocks/fixtures/ask-record";
import { insufficientRecordScope, readyRecordScope, recordSummaries, recordSynthesis } from "@/mocks/fixtures/records";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { RecordDetailView, RecordsCollectionView, RecordSynthesisView } from "./record-views";

describe("Record page compositions", () => {
  it("renders the fixed Records collection with direct destinations", () => {
    render(<RecordsCollectionView records={recordSummaries} />);
    expect(screen.getByRole("heading", { level: 1, name: "Records" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Record 1" })).toHaveAttribute("href", "/records/record-1");
    expect(screen.getAllByText(/eligible Session/)).not.toHaveLength(0);
  });

  it("shows automatic scope, related Sessions, and the latest synthesis", () => {
    render(<RecordDetailView onGenerate={() => undefined} onOpenSynthesis={() => undefined} record={recordSummaries[0]} scope={readyRecordScope} sessions={sessionApiFixtures.slice(0, 2).map(toSessionSummary)} synthesis={recordSynthesis} />);
    expect(screen.getByRole("heading", { name: "Synthesis scope" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate synthesis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review synthesis" })).toBeInTheDocument();
  });

  it("composes the approved Knowledge view from every latest synthesis item", async () => {
    const user = userEvent.setup();
    const onOpenEvidence = vi.fn();
    const onStatusChange = vi.fn();
    const onViewChange = vi.fn();
    render(
      <RecordDetailView
        activeView="knowledge"
        onGenerate={() => undefined}
        onOpenEvidence={onOpenEvidence}
        onStatusChange={onStatusChange}
        onViewChange={onViewChange}
        record={recordSummaries[0]}
        scope={readyRecordScope}
        sessions={[]}
        synthesis={recordSynthesis}
      />,
    );
    expect(screen.getByRole("tab", { name: "Knowledge" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("9 items")).toBeInTheDocument();
    expect(screen.getAllByText("AI Generated")).not.toHaveLength(0);
    expect(screen.getAllByText("Superseded")).not.toHaveLength(0);
    await user.click(screen.getByRole("button", { name: /Review evidence links for approved items/ }));
    await user.click(screen.getByRole("button", { name: "Open evidence" }));
    expect(onOpenEvidence).toHaveBeenCalledWith("record-action-evidence-links");
    await user.click(screen.getByRole("button", { name: "Approve item" }));
    expect(onStatusChange).toHaveBeenCalledWith("record-action-evidence-links", "approved");
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    expect(onViewChange).toHaveBeenCalledWith("overview");
  });

  it("integrates Ask Record as a Record Detail view without synthesis actions", () => {
    render(
      <RecordDetailView
        activeView="ask-record"
        askRecordProps={{
          onAsk: () => undefined,
          suggestedQuestions: askRecordSuggestedQuestions,
        }}
        record={recordSummaries[0]}
        scope={readyRecordScope}
        sessions={[]}
        synthesis={recordSynthesis}
      />,
    );

    expect(screen.getByRole("tab", { name: "Ask Record" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Ask Record 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Ask Record 1" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Ready to synthesize" }),
    ).not.toBeInTheDocument();
  });

  it("integrates the approved Transcript codes workspace with local exploration state", async () => {
    const user = userEvent.setup();
    const onOpenInTranscriptCoding = vi.fn();
    const onViewChange = vi.fn();
    render(
      <RecordDetailView
        activeView="transcript-codes"
        onOpenInTranscriptCoding={onOpenInTranscriptCoding}
        onViewChange={onViewChange}
        record={recordSummaries[0]}
        recordCodeEligibleSessionCount={5}
        recordCodes={recordCodeDetails}
        scope={readyRecordScope}
        sessions={[]}
      />,
    );

    expect(screen.getByRole("tab", { name: "Transcript codes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Transcript codes" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const codeList = screen.getByRole("list", { name: "Accepted Record Codes" });
    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { name: "Name Z–A" }));
    expect(within(codeList).getAllByRole("button")[0]).toHaveTextContent(
      "Table navigation",
    );

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "focus feedback");
    expect(within(codeList).getAllByRole("button")).toHaveLength(1);
    await user.click(within(codeList).getByRole("button"));
    expect(
      screen.getByRole("heading", { name: "Focus feedback" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open in Transcript Coding" }));
    expect(onOpenInTranscriptCoding).toHaveBeenCalledWith(
      recordCodeDetails[1].evidenceGroups[0].highlights[0],
    );

    await user.click(screen.getByRole("tab", { name: "Overview" }));
    expect(onViewChange).toHaveBeenCalledWith("overview");
  });

  it("prevents synthesis when fewer than two Session Reports are eligible", () => {
    render(<RecordSynthesisView onGenerate={() => undefined} record={recordSummaries[1]} scope={insufficientRecordScope} state="insufficient" />);
    expect(screen.getByText("More research is required")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Generate synthesis" })).not.toBeInTheDocument();
  });

  it("generates and opens evidence using keyboard-operable actions", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    const onOpenEvidence = vi.fn();
    const { rerender } = render(<RecordSynthesisView onGenerate={onGenerate} record={recordSummaries[0]} scope={readyRecordScope} state="empty" />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Records" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Generate synthesis" }));
    expect(onGenerate).toHaveBeenCalledOnce();
    rerender(<RecordSynthesisView onGenerate={onGenerate} onOpenEvidence={onOpenEvidence} record={recordSummaries[0]} scope={readyRecordScope} state="results" synthesis={recordSynthesis} />);
    await user.click(screen.getAllByRole("button", { name: /Open evidence/ })[0]);
    expect(onOpenEvidence).toHaveBeenCalledWith(recordSynthesis.items[0].id);
  });
});
