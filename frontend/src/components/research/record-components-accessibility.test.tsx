import axe from "axe-core";
import { render } from "@testing-library/react";

import { readyRecordScope, recordSummaries, recordSynthesis, recordSynthesisItems } from "@/mocks/fixtures/records";
import { RecordField } from "./record-field";
import { RecordListItem } from "./record-list-item";
import { RecordSummary } from "./record-summary";
import { RecordSynthesisItem } from "./record-synthesis-item";
import { RecordSynthesisResults } from "./record-synthesis-results";
import { RecordSynthesisScopeSummary } from "./record-synthesis-scope-summary";

describe("Record components accessibility", () => {
  it("has no automated semantic violations in representative states", async () => {
    const { container } = render(<main className="grid gap-8">
      <RecordListItem href="#record" record={recordSummaries[0]} />
      <RecordField defaultValue="record-1" />
      <RecordSummary record={recordSummaries[0]} />
      <RecordSynthesisScopeSummary scope={readyRecordScope} />
      <RecordSynthesisItem item={recordSynthesisItems[0]} />
      <RecordSynthesisResults synthesis={recordSynthesis} />
    </main>);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
