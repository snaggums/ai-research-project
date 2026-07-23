import axe from "axe-core";
import { render } from "@testing-library/react";

import {
  transcriptCodingCodes,
  transcriptCodingHighlights,
  transcriptCodingSuggestions,
  transcriptReaderBlocks,
} from "@/mocks/fixtures/transcript-coding";
import { TranscriptCodingWorkspaceView } from "./transcript-coding-views";

const axeOptions = { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } };
const props = {
  acceptedHighlights: transcriptCodingHighlights,
  availableCodes: transcriptCodingCodes,
  blocks: transcriptReaderBlocks,
  suggestions: transcriptCodingSuggestions.map((suggestion) => ({ ...suggestion, evidence: [...suggestion.evidence] })),
};

describe("Transcript coding workspace accessibility", () => {
  it("has no automated violations in review, selection, filter, and list states", async () => {
    const { container, rerender } = render(<TranscriptCodingWorkspaceView {...props} />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);

    rerender(<TranscriptCodingWorkspaceView {...props} state="manual-selection" />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);

    rerender(<TranscriptCodingWorkspaceView {...props} state="active-filters" />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);

    rerender(<TranscriptCodingWorkspaceView {...props} state="filtered-list" />);
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });
});
