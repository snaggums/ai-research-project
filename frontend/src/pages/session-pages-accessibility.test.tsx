import axe from "axe-core";
import { render } from "@testing-library/react";

import { toSessionSummary } from "@/adapters/sessions";
import { sessionApiFixtures, sessionRecordOptions } from "@/mocks/fixtures/sessions";
import { emptySessionFilters } from "./session-view-data";
import { SessionDetailView, SessionsCollectionView } from "./session-views";

describe("Session page accessibility", () => {
  it("has no automated violations in the Sessions Collection", async () => {
    const { container } = render(<SessionsCollectionView filters={emptySessionFilters} onFiltersChange={() => undefined} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={sessionApiFixtures.map(toSessionSummary)} />);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
  it("has no automated violations in Session Overview and Participants", async () => {
    const session = toSessionSummary(sessionApiFixtures[0]);
    const { container, rerender } = render(<SessionDetailView activeTab="overview" projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } })).violations).toEqual([]);
    rerender(<SessionDetailView activeTab="participants" projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } })).violations).toEqual([]);
  });
});
