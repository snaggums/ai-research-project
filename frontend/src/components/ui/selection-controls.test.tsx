import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Toggle } from "@/components/ui/toggle";

describe("selection controls", () => {
  it("toggles an uncontrolled checkbox", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Include archived sessions" />);

    const checkbox = screen.getByRole("checkbox", { name: "Include archived sessions" });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("exposes and clears the indeterminate checkbox state", async () => {
    const user = userEvent.setup();
    render(<Checkbox defaultIndeterminate label="Partially selected studies" />);

    const checkbox = screen.getByRole("checkbox", { name: "Partially selected studies" });
    expect(checkbox).toBePartiallyChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBePartiallyChecked();
    expect(checkbox).toBeChecked();
  });

  it("selects an uncontrolled radio", async () => {
    const user = userEvent.setup();
    render(<Radio label="Moderated" name="format" value="moderated" />);

    const radio = screen.getByRole("radio", { name: "Moderated" });
    expect(radio).not.toBeChecked();
    await user.click(radio);
    expect(radio).toBeChecked();
  });

  it("exposes toggle state with switch semantics", async () => {
    const user = userEvent.setup();
    render(<Toggle label="Synthesis notifications" />);

    const toggle = screen.getByRole("switch", { name: "Synthesis notifications" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("keeps disabled selected controls visibly defined", () => {
    render(<Checkbox checked disabled label="Selected checkbox" />);

    const checkbox = screen.getByRole("checkbox", { name: "Selected checkbox" });
    expect(checkbox).toBeDisabled();
    expect(checkbox.nextElementSibling).toHaveClass("bg-[var(--air-color-control-disabled)]");
  });

  it("matches the Figma selected radio geometry", () => {
    render(<Radio checked label="Selected radio" />);

    const radio = screen.getByRole("radio", { name: "Selected radio" });
    expect(radio.nextElementSibling).toHaveClass(
      "border-2",
      "border-[var(--air-color-bg-brand)]",
      "bg-[var(--air-color-bg-surface)]",
    );
  });

  it("keeps keyboard focus styling on controls rather than label text", () => {
    const { rerender } = render(<Checkbox label="Checkbox focus" />);
    const checkbox = screen.getByRole("checkbox", { name: "Checkbox focus" });
    expect(checkbox.nextElementSibling).toHaveClass("peer-focus-visible:ring-2");

    rerender(<Radio label="Radio focus" />);
    const radio = screen.getByRole("radio", { name: "Radio focus" });
    expect(radio.nextElementSibling).toHaveClass("peer-focus-visible:ring-2");

    rerender(<Toggle label="Toggle focus" />);
    const toggle = screen.getByRole("switch", { name: "Toggle focus" });
    expect(toggle).not.toHaveClass("focus-visible:ring-2");
    expect(toggle.firstElementChild).toHaveClass("group-focus-visible:ring-2");
  });

  it("uses the accessible control-border token for unselected boundaries", () => {
    const { rerender } = render(<Checkbox label="Checkbox boundary" />);
    expect(screen.getByRole("checkbox").nextElementSibling).toHaveClass(
      "border-[var(--air-color-border-control)]",
    );

    rerender(<Radio label="Radio boundary" />);
    expect(screen.getByRole("radio").nextElementSibling).toHaveClass(
      "border-[var(--air-color-border-control)]",
    );

    rerender(<Toggle label="Toggle boundary" />);
    expect(screen.getByRole("switch").firstElementChild).toHaveClass(
      "border-[var(--air-color-border-control)]",
    );
  });
});
