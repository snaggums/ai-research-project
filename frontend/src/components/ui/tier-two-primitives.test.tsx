import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Accordion } from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonSet } from "@/components/ui/button-set";

describe("Avatar", () => {
  it("announces initials and optional status", () => {
    render(<Avatar alt="Alex Brown" initials="AB" showStatus size="large" />);
    expect(screen.getByRole("img", { name: "Alex Brown" })).toBeInTheDocument();
    expect(screen.getByLabelText("Online")).toBeInTheDocument();
  });
});

describe("Accordion", () => {
  it("toggles content and reports its expanded state", async () => {
    const user = userEvent.setup();
    render(<Accordion content="Expanded content" title="Details" />);
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Expanded content")).toBeInTheDocument();
  });
});

describe("Breadcrumbs", () => {
  it("marks the final item as the current page", () => {
    render(<Breadcrumbs items={[{ href: "/studies", label: "Studies" }, { label: "Study details" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByText("Study details")).toHaveAttribute("aria-current", "page");
  });
});

describe("ButtonSet", () => {
  it("renders actions in Cancel, secondary, primary order", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<ButtonSet onPrimary={onPrimary} secondaryLabel="Save and close" />);
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Cancel", "Save and close", "Continue"]);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onPrimary).toHaveBeenCalledOnce();
  });
});
