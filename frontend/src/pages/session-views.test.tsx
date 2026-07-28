import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { toSessionSummary } from "@/adapters/sessions";
import { SESSION_RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION } from "@/components/research/record-synthesis-requirements-note";
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
    const summary = screen.getByRole("region", { name: "Session summary" });
    expect(within(summary).getByRole("button", { name: "Edit session" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Session sections" });
    expect(within(navigation).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getAllByRole("link")).toHaveLength(6);
    expect(screen.getByText("Record synthesis requirements")).toBeInTheDocument();
    expect(screen.getByText(SESSION_RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION)).toBeInTheDocument();
  });

  it("uses the canonical Participant, Role, Organization, and Notes columns", () => {
    render(<SessionDetailView activeTab="participants" projectId="alpha-project" projectName="Alpha Project" session={session} />);
    expect(screen.getByRole("columnheader", { name: "Participant" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Organization" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Persona" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("img")
        .map((avatar) => avatar.getAttribute("aria-label")),
    ).toEqual([
      "Riley Chen",
      "Samir Kaur",
      "Jordan Lee",
      "Alex Morgan",
    ]);
  });

  it("delegates participant creation, editing, and confirmed Session removal independently", async () => {
    const user = userEvent.setup();
    const onAddParticipant = vi.fn();
    const onEditParticipant = vi.fn();
    const onRemoveParticipant = vi.fn();
    render(<SessionDetailView activeTab="participants" onAddParticipant={onAddParticipant} onEditParticipant={onEditParticipant} onRemoveParticipant={onRemoveParticipant} projectId="alpha-project" projectName="Alpha Project" session={session} />);
    await user.click(screen.getByRole("button", { name: "Add participant" }));
    expect(onAddParticipant).toHaveBeenCalledOnce();
    await user.click(screen.getAllByRole("button", { name: `Edit participant: ${session.participants[0].firstName} ${session.participants[0].lastName}` })[0]);
    expect(onEditParticipant).toHaveBeenCalledWith(session.participants[0].id);
    await user.click(screen.getAllByRole("button", { name: `Remove participant from Session: ${session.participants[0].firstName} ${session.participants[0].lastName}` })[0]);
    const dialog = screen.getByRole("dialog", { name: "Remove participant from Session?" });
    expect(within(dialog).getByText(/remain in Project participants and can be added again/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Remove participant" }));
    expect(onRemoveParticipant).toHaveBeenCalledWith(session.participants[0].id);
  });

  it("positions the first participant action tooltip downward and inward from the table boundary", async () => {
    const user = userEvent.setup();
    render(<SessionDetailView activeTab="participants" onRemoveParticipant={() => undefined} projectId="alpha-project" projectName="Alpha Project" session={session} />);
    await user.hover(screen.getAllByRole("button", { name: `Remove participant from Session: ${session.participants[0].firstName} ${session.participants[0].lastName}` })[0]);
    expect(await screen.findByRole("tooltip")).toHaveClass("right-0", "top-full");
  });

  it("shows removal failure feedback without removing participant actions", () => {
    render(<SessionDetailView activeTab="participants" onRemoveParticipant={() => undefined} participantActionError="The Session could not be updated." projectId="alpha-project" projectName="Alpha Project" session={session} />);
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Participant could not be removed")).toBeInTheDocument();
    expect(within(alert).getByText("The Session could not be updated.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Remove participant from Session:/ })).not.toHaveLength(0);
  });
});
