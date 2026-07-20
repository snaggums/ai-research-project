import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toTranscriptDocumentDetail, toTranscriptDocumentSummary, toTranscriptSearchResult } from "@/adapters/transcripts";
import { transcriptApiFixtures, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { TranscriptDocumentItem } from "./transcript-document-item";
import { TranscriptPreview } from "./transcript-preview";
import { TranscriptSearchResult } from "./transcript-search-result";
import { TranscriptUploader } from "./transcript-uploader";

describe("Transcript Research Objects", () => {
  it("selects a supported upload and exposes the specific upload action", async () => {
    const onFilesSelected = vi.fn();
    const user = userEvent.setup();
    render(<TranscriptUploader onFilesSelected={onFilesSelected} />);
    const file = new File(["text"], "interview.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Browse files"), file);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("renders lifecycle actions without hiding status meaning in color", () => {
    const onDelete = vi.fn();
    render(<TranscriptDocumentItem document={toTranscriptDocumentSummary(transcriptApiFixtures[2])} href="#view" onDelete={onDelete} onRetry={() => undefined} />);
    expect(screen.getByText("Processing failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete transcript" })).toBeInTheDocument();
  });

  it("renders semantic transcript blocks and retrieval-only source results", () => {
    const { rerender } = render(<TranscriptPreview document={toTranscriptDocumentDetail(transcriptApiFixtures[0])} />);
    expect(screen.getByRole("heading", { name: "Extracted transcript" })).toBeInTheDocument();
    expect(screen.getAllByText(/Maya Chen \(Moderator\)/)).not.toHaveLength(0);
    rerender(<TranscriptSearchResult href="#context" result={toTranscriptSearchResult(transcriptSearchFixtures[0])} />);
    expect(screen.getByRole("link", { name: /Open transcript context/ })).toBeInTheDocument();
    expect(screen.queryByText(/answer/i)).not.toBeInTheDocument();
  });
});
