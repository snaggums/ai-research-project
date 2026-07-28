import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { insufficientRecordScope, readyRecordScope, recordSummaries, recordSynthesis, recordSynthesisItems } from "@/mocks/fixtures/records";
import { RecordField } from "./record-field";
import { RecordListItem } from "./record-list-item";
import { RecordSummary } from "./record-summary";
import { RecordSynthesisItem } from "./record-synthesis-item";
import { RecordSynthesisResults } from "./record-synthesis-results";
import { RecordSynthesisScopeSummary } from "./record-synthesis-scope-summary";

describe("Record Research Objects", () => {
  it("exposes the Record card as one descriptive link", () => {
    render(<RecordListItem href="/records/record-1" record={recordSummaries[0]} />);
    expect(screen.getByRole("link", { name: "Open Medicare Fraud Documenter" })).toHaveAttribute("href", "/records/record-1");
    expect(screen.getByText("Ready to synthesize")).toBeInTheDocument();
  });

  it("supports the three fixed MVP Records plus an unassigned option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RecordField onValueChange={onValueChange} value="record-1" />);
    await user.click(screen.getByRole("combobox", { name: /Record/ }));
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(screen.getByRole("option", { name: "Select a record" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Medicare Fraud Finder" }));
    expect(onValueChange).toHaveBeenCalledWith("record-3");
  });

  it("presents readiness and automatic synthesis eligibility", () => {
    render(<main><RecordSummary record={recordSummaries[1]} /><RecordSynthesisScopeSummary scope={insufficientRecordScope} /></main>);
    expect(screen.getByText("Needs more data")).toBeInTheDocument();
    expect(screen.getByText("More eligible Sessions required")).toBeInTheDocument();
    expect(screen.getByText(/included automatically/)).toBeInTheDocument();
  });

  it("delegates evidence review from a synthesis item", async () => {
    const user = userEvent.setup();
    const onOpenEvidence = vi.fn();
    const onStatusChange = vi.fn();
    render(<RecordSynthesisItem item={recordSynthesisItems[0]} onOpenEvidence={onOpenEvidence} onStatusChange={onStatusChange} />);
    await user.click(screen.getByRole("button", { name: /Open evidence/ }));
    expect(onOpenEvidence).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Mark reviewed" }));
    expect(onStatusChange).toHaveBeenCalledWith("researcher-reviewed");
  });

  it("renders canonical requirement, decision, and action-item result sections", () => {
    render(<RecordSynthesisResults synthesis={recordSynthesis} />);
    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings.indexOf("Requirements")).toBeLessThan(headings.indexOf("Decisions"));
    expect(headings.indexOf("Decisions")).toBeLessThan(headings.indexOf("Action Items"));
    expect(screen.getByText("2 included Sessions · 3 Session Report revisions")).toBeInTheDocument();
  });

  it("shows the included and excluded source snapshot", () => {
    render(<RecordSynthesisScopeSummary scope={readyRecordScope} />);
    expect(screen.getByText("Checkout usability test")).toBeInTheDocument();
    expect(screen.getByText("Stakeholder review")).toBeInTheDocument();
    expect(screen.getByText("Session Report is AI Generated")).toBeInTheDocument();
  });
});
