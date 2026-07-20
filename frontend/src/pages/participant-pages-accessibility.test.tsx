import axe from "axe-core";
import { render } from "@testing-library/react";

import { ApplicationShell } from "@/components/application";
import { participantSummaries, recordOptions } from "@/mocks/fixtures/participants";
import { ParticipantDetailView, ParticipantsCollectionView } from "@/pages/participant-views";

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
});
