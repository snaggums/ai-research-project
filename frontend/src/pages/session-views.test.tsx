import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { toSessionSummary } from "@/adapters/sessions";
import { sessionApiFixtures, sessionRecordOptions } from "@/mocks/fixtures/sessions";
import { emptySessionFilters } from "./session-view-data";
import { SessionDetailView, SessionsCollectionView } from "./session-views";

describe("SessionsCollectionView", () => {
  it("updates route-specific search and filters and clears them", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [filters, setFilters] = React.useState(emptySessionFilters);
      return <SessionsCollectionView filters={filters} onFiltersChange={setFilters} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={sessionApiFixtures.map(toSessionSummary)} />;
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
    render(<SessionsCollectionView filters={{ ...emptySessionFilters, search: "missing" }} onFiltersChange={() => undefined} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={[]} state="no-results" />);
    expect(screen.getByRole("heading", { name: "No matching sessions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("confirms destructive Session deletion before delegating it", async () => {
    const user = userEvent.setup();
    const onDeleteSession = vi.fn();
    const sessions = sessionApiFixtures.map(toSessionSummary);
    render(<SessionsCollectionView filters={emptySessionFilters} onDeleteSession={onDeleteSession} onFiltersChange={() => undefined} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={sessions} />);
    await user.click(screen.getAllByRole("button", { name: "Delete session" })[0]);
    expect(screen.getByRole("dialog", { name: "Delete session?" })).toBeInTheDocument();
    expect(screen.getByText(/transcript, themes, and Session Report/)).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Delete session?" })).getByRole("button", { name: "Delete session" }));
    expect(onDeleteSession).toHaveBeenCalledWith(sessions[0].id);
  });

  it("delegates Session editing independently of deletion", async () => {
    const user = userEvent.setup();
    const onEditSession = vi.fn();
    const sessions = sessionApiFixtures.map(toSessionSummary);
    render(<SessionsCollectionView filters={emptySessionFilters} onEditSession={onEditSession} onFiltersChange={() => undefined} projectId="alpha-project" projectName="Alpha Project" recordOptions={sessionRecordOptions} sessions={sessions} />);
    await user.click(screen.getAllByRole("button", { name: "Edit session" })[0]);
    expect(onEditSession).toHaveBeenCalledWith(sessions[0].id);
  });
});

describe("SessionDetailView", () => {
  const session = toSessionSummary(sessionApiFixtures[0]);
  it("shows the Overview contract and all Session destinations", () => {
    const onEditSession = vi.fn();
    render(<SessionDetailView activeTab="overview" onEditSession={onEditSession} projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect(screen.getByRole("heading", { level: 1, name: session.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Relationships" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Session sections" });
    expect(within(navigation).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Edit session" })).toBeInTheDocument();
  });

  it("uses the canonical Participant, Role, Organization, and Notes columns", () => {
    render(<SessionDetailView activeTab="participants" projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect(screen.getByRole("columnheader", { name: "Participant" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Organization" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Persona" })).not.toBeInTheDocument();
  });

  it("delegates participant creation and row editing independently", async () => {
    const user = userEvent.setup();
    const onAddParticipant = vi.fn();
    const onEditParticipant = vi.fn();
    render(<SessionDetailView activeTab="participants" onAddParticipant={onAddParticipant} onEditParticipant={onEditParticipant} projectId="alpha-project" projectName="Alpha Project" session={session} />);
    await user.click(screen.getByRole("button", { name: "Add participant" }));
    expect(onAddParticipant).toHaveBeenCalledOnce();
    await user.click(screen.getAllByRole("button", { name: `Edit participant: ${session.participants[0].firstName} ${session.participants[0].lastName}` })[0]);
    expect(onEditParticipant).toHaveBeenCalledWith(session.participants[0].id);
  });
});
