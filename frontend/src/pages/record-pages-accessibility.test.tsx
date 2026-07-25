import axe from "axe-core";
import { render } from "@testing-library/react";

import { readyRecordScope, recordSummaries, recordSynthesis } from "@/mocks/fixtures/records";
import { RecordDetailView, RecordsCollectionView, RecordSynthesisView } from "./record-views";

describe("Record page accessibility", () => {
  const options = { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } };
  it("has no automated violations in the Records Collection", async () => {
    const { container } = render(<RecordsCollectionView records={recordSummaries} />);
    expect((await axe.run(container, options)).violations).toEqual([]);
  });
  it("has no automated violations in Record synthesis results", async () => {
    const { container } = render(<RecordSynthesisView onGenerate={() => undefined} record={recordSummaries[0]} scope={readyRecordScope} state="results" synthesis={recordSynthesis} />);
    expect((await axe.run(container, options)).violations).toEqual([]);
  });
  it("has no automated violations in the Record Knowledge workspace", async () => {
    const { container } = render(
      <RecordDetailView
        activeView="knowledge"
        onGenerate={() => undefined}
        record={recordSummaries[0]}
        scope={readyRecordScope}
        sessions={[]}
        synthesis={recordSynthesis}
      />,
    );
    expect((await axe.run(container, options)).violations).toEqual([]);
  });
});
