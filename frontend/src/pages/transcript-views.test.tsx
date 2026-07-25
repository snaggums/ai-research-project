import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toTranscriptContext, toTranscriptDocumentDetail, toTranscriptSearchResult } from "@/adapters/transcripts";
import { transcriptApiFixtures, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { SessionTranscriptWorkspaceView, TranscriptContextView } from "./transcript-views";

const defaultProps = { documents: [toTranscriptDocumentDetail(transcriptApiFixtures[0])], onDelete: vi.fn(), onRetry: vi.fn(), onSearch: vi.fn(), onSetPrimary: vi.fn(), onUpload: vi.fn(), projectId: "alpha-project", sessionId: "mobile-checkout-test" };

it("resolves API-relative source downloads against the backend origin", () => {
  const document = toTranscriptDocumentDetail({
    ...transcriptApiFixtures[0],
    download_url: "/api/projects/alpha-project/sessions/mobile-checkout-test/documents/checkout-transcript/download",
  });
  expect(document.downloadUrl).toBe("http://localhost:8000/api/projects/alpha-project/sessions/mobile-checkout-test/documents/checkout-transcript/download");
});

describe("Transcript page compositions", () => {
  it("searches the transcript and provides context links", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SessionTranscriptWorkspaceView {...defaultProps} onSearch={onSearch} />);
    await user.type(screen.getByLabelText("Search this transcript"), "navigation confusion");
    await user.click(screen.getByRole("button", { name: "Search transcript" }));
    expect(onSearch).toHaveBeenCalledWith("checkout-transcript", "navigation confusion");
    rerender(<SessionTranscriptWorkspaceView {...defaultProps} searchQuery="navigation confusion" searchResults={transcriptSearchFixtures.map(toTranscriptSearchResult)} />);
    expect(screen.getAllByRole("link", { name: /Open transcript context/ })).toHaveLength(3);
  });

  it("opens and closes the inline transcript preview", async () => {
    const user = userEvent.setup();
    render(<SessionTranscriptWorkspaceView {...defaultProps} />);
    await user.click(screen.getByRole("link", { name: "View transcript" }));
    expect(screen.getByRole("heading", { name: "Extracted transcript" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to transcripts" }).querySelector("svg")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Back to transcripts" }));
    expect(screen.getByRole("heading", { name: "Transcripts" })).toBeInTheDocument();
  });

  it("surfaces a blocked Transcript dependency action", () => {
    render(
      <SessionTranscriptWorkspaceView
        {...defaultProps}
        actionError="This Transcript contains Highlights or Code Suggestions and cannot be deleted."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("cannot be deleted");
    expect(screen.getByText("Transcript action could not be completed")).toBeInTheDocument();
  });

  it("renders the focused source passage and named moderator", () => {
    const context = toTranscriptContext({ document: transcriptApiFixtures[0], result: transcriptSearchFixtures[0], passages: transcriptApiFixtures[0].blocks, focused_passage_id: "passage-2" });
    render(<TranscriptContextView context={context} projectId="alpha-project" projectName="Alpha Project" returnHref="/projects/alpha-project/sessions/mobile-checkout-test/transcript" sessionId="mobile-checkout-test" sessionTitle="Mobile checkout test" />);
    expect(screen.getByRole("heading", { level: 1, name: "Transcript context" })).toBeInTheDocument();
    expect(screen.getAllByText(/Maya Chen \(Moderator\)/)).not.toHaveLength(0);
    expect(screen.getByText(/Relevance 91%/)).toBeInTheDocument();
  });

  it("returns transcript evidence to the originating Session Report", () => {
    const context = toTranscriptContext({ document: transcriptApiFixtures[0], result: transcriptSearchFixtures[0], passages: transcriptApiFixtures[0].blocks, focused_passage_id: "passage-2" });
    render(<TranscriptContextView context={context} projectId="alpha-project" projectName="Alpha Project" returnHref="/projects/alpha-project/sessions/mobile-checkout-test/report" returnLabel="Session Report" sessionId="mobile-checkout-test" sessionTitle="Mobile checkout test" />);
    expect(screen.getByRole("link", { name: "Back to Session Report" })).toHaveAttribute("href", "/projects/alpha-project/sessions/mobile-checkout-test/report");
  });
});
