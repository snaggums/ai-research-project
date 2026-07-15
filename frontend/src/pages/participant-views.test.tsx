import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { participantSummaries, recordOptions } from "@/mocks/fixtures/participants";
import { ParticipantDetailView, ParticipantsCollectionView } from "@/pages/participant-views";

describe("ParticipantsCollectionView", () => {
  it("filters by name or email and exposes direct row actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    function Example() {
      const [search, setSearch] = React.useState("");
      return (
        <ParticipantsCollectionView
          onEditParticipant={onEdit}
          onSearchChange={setSearch}
          participants={participantSummaries}
          projectId="alpha-project"
          projectName="Alpha Project"
          search={search}
        />
      );
    }

    render(<Example />);
    expect(screen.getAllByRole("article")).toHaveLength(4);
    await user.type(screen.getByRole("searchbox", { name: "Search participants" }), "Alex");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Edit Alex Morgan" }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "alex-morgan" }));
  });

  it("distinguishes empty, no-results, and not-found outcomes", () => {
    const common = {
      onSearchChange: () => undefined,
      participants: [],
      projectId: "alpha-project",
      projectName: "Alpha Project",
    };
    const { rerender } = render(<ParticipantsCollectionView {...common} search="" state="empty" />);
    expect(screen.getByRole("heading", { name: "No participants yet" })).toBeInTheDocument();
    rerender(<ParticipantsCollectionView {...common} search="nobody" />);
    expect(screen.getByRole("heading", { name: "No matching results" })).toBeInTheDocument();
    rerender(<ParticipantsCollectionView {...common} search="" state="not-found" />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("ParticipantDetailView", () => {
  it("uses the approved edit form and Participant identity", () => {
    const alex = participantSummaries[0];
    render(
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
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Participant Details" })).toBeInTheDocument();
    expect(screen.getByText("View and update Alex Morgan's participant profile.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /First name/ })).toHaveValue("Alex");
  });
});
