import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ParticipantForm } from "@/components/research/participant-form";
import { ParticipantListItem } from "@/components/research/participant-list-item";
import { ParticipantPicker } from "@/components/research/participant-picker";
import { jordanMoore, participantOptions, recordOptions } from "@/mocks/fixtures/participants";

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
