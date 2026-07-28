import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SessionCollectionItem } from "./session-collection-item";
import { SessionForm } from "./session-form";
import { SessionListItem } from "./session-list-item";
import { SessionParticipantGroup } from "./session-participant-group";
import { SessionSummary } from "./session-summary";
import { participants, sessions } from "@/mocks/fixtures/domain";

const participantOptions = participants.map(({ id, firstName, lastName, referenceId }) => ({ id, firstName, lastName, referenceId }));

describe("SessionListItem", () => {
  it("exposes one primary link and separate actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<SessionListItem href="/projects/alpha/sessions/checkout" onEdit={onEdit} session={sessions[0]} />);
    expect(screen.getByRole("link", { name: `Open ${sessions[0].title}` })).toHaveAttribute("href", "/projects/alpha/sessions/checkout");
    await user.click(screen.getByRole("button", { name: `Actions for ${sessions[0].title}` }));
    await user.click(screen.getByRole("menuitem", { name: "Edit session" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});

describe("SessionCollectionItem", () => {
  it("shows normalized workflow and relationship metadata", () => {
    render(<SessionCollectionItem href="#session" session={sessions[0]} />);
    expect(screen.getByText("Researcher reviewed")).toBeInTheDocument();
    expect(screen.getByText("Medicare Fraud Documenter")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open session" })).toHaveAttribute("href", "#session");
  });

  it("delegates the separate Delete session action", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<SessionCollectionItem href="#session" onDelete={onDelete} session={sessions[0]} />);
    await user.click(screen.getByRole("button", { name: "Delete session" }));
    expect(onDelete).toHaveBeenCalledWith(sessions[0]);
  });

  it("places a separate Edit session action before Delete session", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<SessionCollectionItem href="#session" onDelete={onDelete} onEdit={onEdit} session={sessions[0]} />);
    const edit = screen.getByRole("button", { name: "Edit session" });
    const remove = screen.getByRole("button", { name: "Delete session" });
    expect(edit.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(edit);
    expect(onEdit).toHaveBeenCalledWith(sessions[0]);
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("SessionForm", () => {
  it("validates title and type before submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SessionForm mode="create" onSubmit={onSubmit} participants={participantOptions} />);
    await user.click(screen.getByRole("button", { name: "Create session" }));
    expect(await screen.findByText("Enter a session title.")).toBeInTheDocument();
    expect(screen.getByText("Select a session type.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits normalized fields and selected participants", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SessionForm mode="create" onSubmit={onSubmit} participants={participantOptions} />);
    expect(screen.getByRole("combobox", { name: /Record/ })).toHaveTextContent("Select a record");
    await user.type(screen.getByRole("textbox", { name: /Session title/ }), "  Checkout interview  ");
    await user.click(screen.getByRole("combobox", { name: /Session type/ }));
    await user.click(screen.getByRole("option", { name: "Interview" }));
    await user.click(screen.getByRole("combobox", { name: "Participants" }));
    await user.click(screen.getByRole("option", { name: /Alex Morgan/ }));
    await user.click(screen.getByRole("button", { name: "Create session" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Checkout interview", type: "interview", recordId: "", participantIds: [participants[0].id] }), expect.anything());
  });

  it("allows a Session to be assigned to one fixed Record", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SessionForm mode="create" onSubmit={onSubmit} participants={participantOptions} />);
    await user.type(screen.getByRole("textbox", { name: /Session title/ }), "Navigation interview");
    await user.click(screen.getByRole("combobox", { name: /Session type/ }));
    await user.click(screen.getByRole("option", { name: "Interview" }));
    await user.click(screen.getByRole("combobox", { name: /Record/ }));
    await user.click(screen.getByRole("option", { name: "Medicaid Fraud Documenter" }));
    await user.click(screen.getByRole("button", { name: "Create session" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ recordId: "record-2" }), expect.anything());
  });

  it("allows an assigned Record to be cleared", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SessionForm mode="create" onSubmit={onSubmit} participants={participantOptions} />);
    await user.type(screen.getByRole("textbox", { name: /Session title/ }), "Unassigned interview");
    await user.click(screen.getByRole("combobox", { name: /Session type/ }));
    await user.click(screen.getByRole("option", { name: "Interview" }));
    await user.click(screen.getByRole("combobox", { name: /Record/ }));
    await user.click(screen.getByRole("option", { name: "Medicaid Fraud Documenter" }));
    await user.click(screen.getByRole("combobox", { name: /Record/ }));
    await user.click(screen.getByRole("option", { name: "Select a record" }));
    await user.click(screen.getByRole("button", { name: "Create session" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ recordId: "" }), expect.anything());
  });
});

describe("SessionParticipantGroup", () => {
  it("keeps the approved compact behavior and delegates adding", async () => {
    const user = userEvent.setup();
    const onAddParticipant = vi.fn();
    render(<SessionParticipantGroup onAddParticipant={onAddParticipant} participants={participants} />);
    expect(screen.getByText("Alex Morgan, Jordan Lee, plus 1 more")).toBeInTheDocument();
    expect(screen.getByText("Roles and organizations available on Participants tab.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add participant" }));
    expect(onAddParticipant).toHaveBeenCalledOnce();
  });
});

describe("SessionSummary", () => {
  it("renders one summary surface without the legacy cards", () => {
    render(<SessionSummary session={sessions[0]} />);
    expect(screen.getByRole("region", { name: "Session summary" })).toBeInTheDocument();
    expect(screen.getByText("45 minutes")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Session details" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Relationships" })).not.toBeInTheDocument();
    expect(screen.queryByText("Moderator")).not.toBeInTheDocument();
  });

  it("renders the responsive summary contract and delegates editing", async () => {
    const user = userEvent.setup();
    const onEditSession = vi.fn();
    render(<SessionSummary onEditSession={onEditSession} session={sessions[1]} />);
    const summary = screen.getByRole("region", { name: "Session summary" });
    expect(summary.querySelector("dl")).toHaveClass("flex", "flex-wrap");
    expect(summary.querySelectorAll("dl > div")).toHaveLength(5);
    expect(within(summary).getByText("Usability test")).toBeInTheDocument();
    expect(within(summary).getByText("July 10, 2026")).toBeInTheDocument();
    expect(within(summary).getByText("1 hr")).toBeInTheDocument();
    expect(within(summary).getByText("Alex Morgan +2 more")).toBeInTheDocument();
    expect(within(summary).getByText("Medicare Fraud Documenter")).toBeInTheDocument();
    await user.click(within(summary).getByRole("button", { name: "Edit session" }));
    expect(onEditSession).toHaveBeenCalledOnce();
  });

  it("exposes full shortened values and documented empty fallbacks", () => {
    const { rerender } = render(<SessionSummary session={sessions[1]} />);
    expect(screen.getByLabelText("Alex Morgan, Jordan Lee, Sam Rivera")).toHaveTextContent("Alex Morgan +2 more");
    rerender(<SessionSummary session={{ ...sessions[1], durationMinutes: undefined, participants: [], relatedRecords: [], startsAt: undefined }} />);
    expect(screen.getByText("Not scheduled")).toBeInTheDocument();
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
    expect(screen.getByText("No participants")).toBeInTheDocument();
    expect(screen.getByText("No related Record")).toBeInTheDocument();
  });
});
