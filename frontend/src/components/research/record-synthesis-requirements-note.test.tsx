import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SESSION_RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION,
  RecordSynthesisRequirementsNote,
} from "./record-synthesis-requirements-note";

describe("RecordSynthesisRequirementsNote", () => {
  it("presents the Session eligibility contract as informational status", () => {
    render(<RecordSynthesisRequirementsNote />);

    expect(screen.getByRole("status")).toHaveTextContent("Record synthesis requirements");
    expect(screen.getByRole("status")).toHaveTextContent(
      SESSION_RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION,
    );
  });
});
