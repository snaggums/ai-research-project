import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { InputField } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { PasswordField } from "@/components/ui/password-field";
import { SelectField } from "@/components/ui/select";

describe("field components", () => {
  it("exposes an accessible password visibility control", async () => {
    const user = userEvent.setup();
    const onVisibleChange = vi.fn();
    render(
      <PasswordField
        label="Password"
        onVisibleChange={onVisibleChange}
        defaultValue="research"
      />,
    );

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
    expect(onVisibleChange).toHaveBeenCalledWith(true);
  });

  it("connects an input with its label and hint", () => {
    render(<InputField label="Study name" hint="Use a recognizable name." />);

    const input = screen.getByLabelText("Study name");
    const hint = screen.getByText("Use a recognizable name.");

    expect(input).toHaveAttribute("aria-describedby", hint.id);
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.parentElement).toHaveClass("border-[var(--air-color-border-control)]");
  });

  it("replaces hint text with an announced validation message", () => {
    render(
      <InputField
        label="Study name"
        hint="Use a recognizable name."
        error="Enter a study name."
      />,
    );

    const input = screen.getByLabelText("Study name");
    const error = screen.getByRole("alert");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
    expect(screen.queryByText("Use a recognizable name.")).not.toBeInTheDocument();
  });

  it("applies safe external-link behavior", () => {
    render(
      <Link external href="https://example.com">
        External resource
      </Link>,
    );

    expect(screen.getByRole("link", { name: "External resource" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "External resource" })).toHaveAttribute("rel", "noreferrer");
  });

  it("supports keyboard selection in the multi-select field", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectField
        label="Research methods"
        options={[
          { label: "Interviews", value: "interviews" },
          { label: "Survey", value: "survey" },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Research methods" });
    await user.click(trigger);
    const interviews = screen.getByRole("option", { name: "Interviews" });
    interviews.focus();
    await user.keyboard("{Enter}");

    expect(interviews).toHaveAttribute("aria-selected", "true");
    expect(trigger).toHaveTextContent("Interviews");
    const removeButton = screen.getByRole("button", { name: "Remove Interviews" });
    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton);
    expect(interviews).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("button", { name: "Remove Interviews" })).not.toBeInTheDocument();
  });

  it("closes the multi-select menu from the trigger or an outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MultiSelectField
          label="Research methods"
          options={[{ label: "Interviews", value: "interviews" }]}
        />
        <button type="button">Outside</button>
      </div>,
    );

    const trigger = screen.getByRole("button", { name: "Research methods" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects a value and closes the single-select menu", async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Study status"
        options={[
          { label: "Planning", value: "planning" },
          { label: "Active", value: "active" },
        ]}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Study status" });
    await user.click(trigger);
    const activeOption = screen.getByRole("option", { name: "Active" });
    activeOption.focus();
    await user.keyboard("{Enter}");

    expect(trigger).toHaveTextContent("Active");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation from the single-select combobox", async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Project participant"
        options={[
          { label: "Avery Chen", value: "avery-chen" },
          { label: "Marcus Reed", value: "marcus-reed" },
        ]}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Project participant" });
    trigger.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(trigger).toHaveTextContent("Marcus Reed");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
