import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ParticipantForm } from "@/components/research/participant-form";
import { ParticipantListItem } from "@/components/research/participant-list-item";
import { ParticipantPicker } from "@/components/research/participant-picker";
import { SessionParticipantForm } from "@/components/research/session-participant-form";
import { jordanMoore, participantOptions, recordOptions } from "@/mocks/fixtures/participants";

const eligibleSessionParticipants = [
  { label: "Avery Chen", value: "avery-chen" },
  { label: "Jordan Moore", value: "jordan-moore" },
];

describe("ParticipantListItem", () => {
  it("derives the participant identity and exposes direct actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ParticipantListItem
        href="/projects/alpha-project/participants/jordan-moore"
        onDelete={onDelete}
        onEdit={onEdit}
        participant={jordanMoore}
      />,
    );

    expect(screen.getByRole("link", { name: "Open Jordan Moore" })).toHaveAttribute(
      "href",
      "/projects/alpha-project/participants/jordan-moore",
    );
    await user.click(screen.getByRole("button", { name: "Edit Jordan Moore" }));
    await user.click(screen.getByRole("button", { name: "Delete Jordan Moore" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe("ParticipantForm", () => {
  it("requires first and last name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ParticipantForm mode="create" onSubmit={onSubmit} recordOptions={recordOptions} />);
    await user.click(screen.getByRole("button", { name: "Add participant" }));
    expect(await screen.findByText("Enter a first name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a last name.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("normalizes the approved fields and selected Records", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ParticipantForm mode="create" onSubmit={onSubmit} recordOptions={recordOptions} />);

    await user.type(screen.getByRole("textbox", { name: /First name/ }), "  Jordan  ");
    await user.type(screen.getByRole("textbox", { name: /Last name/ }), "  Moore  ");
    await user.type(screen.getByRole("textbox", { name: /Email address/ }), "  jordan@example.com  ");
    await user.click(screen.getByRole("button", { name: "Record" }));
    await user.click(screen.getByRole("option", { name: "Record 1" }));
    await user.type(screen.getByRole("textbox", { name: /Organization/ }), "  Midwest  ");
    await user.type(screen.getByRole("textbox", { name: /Role/ }), "  Supervisor  ");
    await user.type(screen.getByRole("textbox", { name: /Researcher notes/ }), "  Mobile checkout research.  ");
    await user.click(screen.getByRole("button", { name: "Add participant" }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: "Jordan",
      lastName: "Moore",
      email: "jordan@example.com",
      recordIds: ["record-1"],
      organization: "Midwest",
      role: "Supervisor",
      researcherNotes: "Mobile checkout research.",
    }, expect.anything());
  });

  it("keeps neighboring fields aligned when Record chips increase the field height", async () => {
    const user = userEvent.setup();
    render(<ParticipantForm mode="create" onSubmit={() => undefined} recordOptions={recordOptions} />);

    const emailLabel = screen.getByText("Email address");
    const emailField = emailLabel.parentElement;
    const fieldGrid = emailField?.parentElement;
    expect(emailField).toHaveClass("content-start");
    expect(fieldGrid).toHaveClass("items-start");

    await user.click(screen.getByRole("button", { name: "Record" }));
    await user.click(screen.getByRole("option", { name: "Record 1" }));
    expect(screen.getByRole("button", { name: "Remove Record 1" })).toBeInTheDocument();
    expect(emailField).toHaveClass("content-start");
    expect(fieldGrid).toHaveClass("items-start");
  });
});

describe("ParticipantPicker", () => {
  function ControlledPicker({ initialValue = [] }: { initialValue?: string[] }) {
    const [value, setValue] = React.useState(initialValue);
    return <ParticipantPicker onValueChange={setValue} participants={participantOptions} value={value} />;
  }

  it("adds and removes participants", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    await user.click(screen.getByRole("combobox", { name: "Participants" }));
    await user.click(screen.getByRole("option", { name: /Jordan Moore/ }));
    expect(screen.getByText("1 participant selected.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Jordan Moore" }));
    expect(screen.getByText("No participants selected.")).toBeInTheDocument();
  });

  it("closes from the disclosure control", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    await user.click(screen.getByRole("combobox", { name: "Participants" }));
    expect(screen.getByRole("listbox", { name: "Participant options" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close participant options" }));
    expect(screen.queryByRole("listbox", { name: "Participant options" })).not.toBeInTheDocument();
  });

  it("shows a searchable no-results state", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    await user.type(screen.getByRole("combobox", { name: "Participants" }), "Morgan");
    expect(screen.getByRole("status")).toHaveTextContent("No participants found");
  });
});

describe("SessionParticipantForm", () => {
  it("begins with the existing-participant section without repeating the route title", () => {
    render(
      <SessionParticipantForm
        eligibleParticipants={eligibleSessionParticipants}
        onSubmitExisting={() => undefined}
        onSubmitNew={() => undefined}
        recordOptions={recordOptions}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Add participant" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Add an existing participant" })).toBeInTheDocument();
    expect(
      screen.queryByText("Add an existing Project participant to this Session, or add a new participant."),
    ).not.toBeInTheDocument();
  });

  it("assigns an eligible existing participant without validating the new-participant path", async () => {
    const user = userEvent.setup();
    const onSubmitExisting = vi.fn();
    const onSubmitNew = vi.fn();
    render(
      <SessionParticipantForm
        eligibleParticipants={eligibleSessionParticipants}
        onSubmitExisting={onSubmitExisting}
        onSubmitNew={onSubmitNew}
        recordOptions={recordOptions}
      />,
    );

    await user.type(screen.getByRole("combobox", { name: "Project participant" }), "avery");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "Avery Chen" }));
    expect(screen.getByRole("combobox", { name: "Project participant" })).toHaveValue("Avery Chen");
    expect(screen.getByRole("textbox", { name: /First name/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Add participant" }));

    expect(onSubmitExisting).toHaveBeenCalledWith("avery-chen");
    expect(onSubmitNew).not.toHaveBeenCalled();
    expect(screen.queryByText("Enter a first name.")).not.toBeInTheDocument();
  });

  it("filters eligible Project participants and reports when none match", async () => {
    const user = userEvent.setup();
    render(
      <SessionParticipantForm
        eligibleParticipants={eligibleSessionParticipants}
        onSubmitExisting={() => undefined}
        onSubmitNew={() => undefined}
        recordOptions={recordOptions}
      />,
    );

    const combobox = screen.getByRole("combobox", { name: "Project participant" });
    await user.type(combobox, "jordan");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Jordan Moore"]);
    await user.clear(combobox);
    await user.type(combobox, "missing");
    expect(screen.getByRole("status")).toHaveTextContent("No matching Project participants.");
  });

  it("creates a new Project participant when no existing participant is selected", async () => {
    const user = userEvent.setup();
    const onSubmitExisting = vi.fn();
    const onSubmitNew = vi.fn();
    render(
      <SessionParticipantForm
        eligibleParticipants={eligibleSessionParticipants}
        onSubmitExisting={onSubmitExisting}
        onSubmitNew={onSubmitNew}
        recordOptions={recordOptions}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /First name/ }), "Amina");
    await user.type(screen.getByRole("textbox", { name: /Last name/ }), "Patel");
    await user.click(screen.getByRole("button", { name: "Add participant" }));

    expect(onSubmitNew).toHaveBeenCalledWith({
      firstName: "Amina",
      lastName: "Patel",
      email: "",
      recordIds: [],
      organization: "",
      role: "",
      researcherNotes: "",
    }, expect.anything());
    expect(onSubmitExisting).not.toHaveBeenCalled();
  });

  it("keeps new participant creation available when no Project participants are eligible", () => {
    render(
      <SessionParticipantForm
        eligibleParticipants={[]}
        onSubmitExisting={() => undefined}
        onSubmitNew={() => undefined}
        recordOptions={recordOptions}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Project participant" })).toBeDisabled();
    expect(screen.getByText("All Project participants are already assigned to this Session.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: /First name/ })).toBeEnabled();
  });
});
