import axe from "axe-core";
import { render } from "@testing-library/react";

import { toTranscriptContext, toTranscriptDocumentDetail, toTranscriptSearchResult } from "@/adapters/transcripts";
import { transcriptApiFixtures, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { SessionTranscriptWorkspaceView, TranscriptContextView } from "./transcript-views";

const axeOptions = { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } };

describe("Transcript workspace accessibility", () => {
  it("has no automated violations in ready and search-result states", async () => {
    const props = { documents: [toTranscriptDocumentDetail(transcriptApiFixtures[0])], onDelete: () => undefined, onRetry: () => undefined, onSearch: () => undefined, onUpload: () => undefined, projectId: "alpha-project", sessionId: "mobile-checkout-test" };
    const { container, rerender } = render(<SessionTranscriptWorkspaceView {...props} />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
    rerender(<SessionTranscriptWorkspaceView {...props} searchQuery="navigation confusion" searchResults={transcriptSearchFixtures.map(toTranscriptSearchResult)} />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });

  it("has no automated violations in Transcript Context", async () => {
    const context = toTranscriptContext({ document: transcriptApiFixtures[0], result: transcriptSearchFixtures[0], passages: transcriptApiFixtures[0].blocks, focused_passage_id: "passage-2" });
    const { container } = render(<TranscriptContextView context={context} projectId="alpha-project" projectName="Alpha Project" returnHref="/projects/alpha-project/sessions/mobile-checkout-test/transcript" sessionId="mobile-checkout-test" sessionTitle="Mobile checkout test" />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });
});
