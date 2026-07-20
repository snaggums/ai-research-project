import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { toSessionSummary } from "@/adapters/sessions";
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
    expect(screen.getByRole("button", { name: "Regenerate synthesis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review synthesis" })).toBeInTheDocument();
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
