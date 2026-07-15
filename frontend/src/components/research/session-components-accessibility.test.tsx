import axe from "axe-core";
import { render } from "@testing-library/react";

import { SessionCollectionItem } from "./session-collection-item";
import { SessionForm } from "./session-form";
import { SessionListItem } from "./session-list-item";
import { SessionParticipantGroup } from "./session-participant-group";
import { SessionSummary } from "./session-summary";
import { participants, sessions } from "@/mocks/fixtures/domain";

describe("Session components accessibility", () => {
  it("has no automated semantic violations in representative states", async () => {
    const participantOptions = participants.map(({ id, firstName, lastName, referenceId }) => ({ id, firstName, lastName, referenceId }));
    const { container } = render(<main className="grid gap-8">
      <SessionListItem href="#one" onEdit={() => undefined} session={sessions[0]} />
      <SessionCollectionItem href="#two" session={sessions[1]} />
      <SessionForm mode="create" onSubmit={() => undefined} participants={participantOptions} />
      <SessionParticipantGroup onEditParticipants={() => undefined} participants={participants} />
      <SessionSummary session={sessions[0]} />
    </main>);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
