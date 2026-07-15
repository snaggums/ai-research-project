import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Tooltip } from "@/components/ui/tooltip";

describe("Badge", () => {
  it("renders its semantic label without an icon when requested", () => {
    render(<Badge showIcon={false} tone="success">Complete</Badge>);
    const badge = screen.getByText("Complete");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      backgroundColor: "var(--air-color-status-success-bg)",
      color: "var(--air-color-status-success-text)",
    });
    expect(badge.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("supports selection and removal independently", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove} onSelectedChange={onSelectedChange}>Research</Chip>);
    const selectButton = screen.getByRole("button", { name: "Research" });
    await user.click(selectButton);
    expect(selectButton).toHaveAttribute("aria-pressed", "true");
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Remove Research" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("Tooltip", () => {
  it("opens on keyboard focus and connects the trigger to the tooltip", async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Helpful context"><button>Details</button></Tooltip>);
    await user.tab();
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Helpful context");
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-describedby", tooltip.id);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes when the user clicks outside", async () => {
    const user = userEvent.setup();
    render(<div><Tooltip content="Helpful context" defaultOpen><button>Details</button></Tooltip><button>Outside</button></div>);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
