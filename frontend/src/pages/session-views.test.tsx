import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { toSessionSummary } from "@/adapters/sessions";
import { sessionApiFixtures, sessionCommonComponentOptions, sessionRecordOptions } from "@/mocks/fixtures/sessions";
import { emptySessionFilters } from "./session-view-data";
import { SessionDetailView, SessionsCollectionView } from "./session-views";

describe("SessionsCollectionView", () => {
  it("updates route-specific search and filters and clears them", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [filters, setFilters] = React.useState(emptySessionFilters);
      return <SessionsCollectionView commonComponentOptions={sessionCommonComponentOptions} filters={filters} onFiltersChange={setFilters} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={sessionApiFixtures.map(toSessionSummary)} />;
    }
    render(<Harness />);
    await user.type(screen.getByRole("searchbox", { name: "Search sessions and transcripts" }), "checkout");
    expect(screen.getByRole("searchbox", { name: "Search sessions and transcripts" })).toHaveValue("checkout");
    await user.click(screen.getByRole("combobox", { name: "Session type" }));
    await user.click(screen.getByRole("option", { name: "Interview" }));
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("searchbox", { name: "Search sessions and transcripts" })).toHaveValue("");
  });

  it("shows the no-results recovery action", () => {
    render(<SessionsCollectionView commonComponentOptions={sessionCommonComponentOptions} filters={{ ...emptySessionFilters, search: "missing" }} onFiltersChange={() => undefined} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={[]} state="no-results" />);
    expect(screen.getByRole("heading", { name: "No matching sessions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});

describe("SessionDetailView", () => {
  const session = toSessionSummary(sessionApiFixtures[0]);
  it("shows the Overview contract and all Session destinations", () => {
    render(<SessionDetailView activeTab="overview" projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect(screen.getByRole("heading", { level: 1, name: session.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Relationships" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Session sections" });
    expect(within(navigation).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getAllByRole("link")).toHaveLength(6);
  });

  it("uses the canonical Participant, Role, Organization, and Notes columns", () => {
    render(<SessionDetailView activeTab="participants" projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect(screen.getByRole("columnheader", { name: "Participant" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Organization" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Persona" })).not.toBeInTheDocument();
  });

  it("delegates participant membership editing", async () => {
    const user = userEvent.setup();
    const onEditParticipants = vi.fn();
    render(<SessionDetailView activeTab="participants" onEditParticipants={onEditParticipants} projectId="alpha-project" projectName="Alpha Project" session={session} />);
    await user.click(screen.getByRole("button", { name: "Edit participants" }));
    expect(onEditParticipants).toHaveBeenCalledOnce();
  });
});
