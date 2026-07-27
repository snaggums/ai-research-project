import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { readyRecordScope } from "@/mocks/fixtures/records";
import {
  RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION,
  RecordSynthesisScopeSummary,
} from "./record-synthesis-scope-summary";

describe("RecordSynthesisScopeSummary requirements guidance", () => {
  it("renders the approved guidance in the production default layout", () => {
    render(<RecordSynthesisScopeSummary scope={readyRecordScope} />);

    expect(screen.getByText(RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION)).toBeInTheDocument();
  });

  it("preserves the compact layout without the additional guidance", () => {
    render(<RecordSynthesisScopeSummary layout="compact" scope={readyRecordScope} />);

    expect(screen.queryByText(RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION)).not.toBeInTheDocument();
  });
});
