import axe from "axe-core";
import { render } from "@testing-library/react";

import { ApplicationShell } from "@/components/application";
import { participantSummaries, recordOptions } from "@/mocks/fixtures/participants";
import {
  ParticipantDetailView,
  ParticipantsCollectionView,
} from "@/pages/participant-views";
import { toSessionSummary } from "@/adapters/sessions";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { SessionParticipantCreateView } from "@/pages/session-views";

const shellProject = { id: "alpha-project", name: "Alpha Project" };

describe("Participant page accessibility", () => {
  it("has no automated semantic violations in the populated collection", async () => {
    const { container } = render(
      <ApplicationShell activeProjectItem="participants" context="project" project={shellProject}>
        <ParticipantsCollectionView
          onSearchChange={() => undefined}
          participants={participantSummaries}
          projectId="alpha-project"
          projectName="Alpha Project"
          search=""
        />
      </ApplicationShell>,
    );
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });

  it("has no automated semantic violations in Participant Detail", async () => {
    const alex = participantSummaries[0];
    const { container } = render(
      <ApplicationShell activeProjectItem="participants" context="project" project={shellProject}>
        <ParticipantDetailView
          defaultValues={{
            firstName: alex.firstName,
            lastName: alex.lastName,
            email: alex.email ?? "",
            organization: alex.organization ?? "",
            role: alex.role ?? "",
            recordIds: alex.recordIds,
            researcherNotes: alex.researcherNotes ?? "",
          }}
          mode="edit"
          onSubmit={() => undefined}
          participant={alex}
          projectId="alpha-project"
          projectName="Alpha Project"
          recordOptions={recordOptions}
        />
      </ApplicationShell>,
    );
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });

  it("has no automated semantic violations in the Session participant create route", async () => {
    const { container } = render(
      <ApplicationShell activeProjectItem="sessions" context="project" project={shellProject}>
        <SessionParticipantCreateView
          eligibleParticipants={[
            { label: "Avery Chen", value: "avery-chen" },
            { label: "Jordan Moore", value: "jordan-moore" },
          ]}
          onSubmitExisting={() => undefined}
          onSubmitNew={() => undefined}
          projectId="alpha-project"
          projectName="Alpha Project"
          recordOptions={recordOptions}
          session={toSessionSummary(sessionApiFixtures[0])}
        />
      </ApplicationShell>,
    );
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });
});
