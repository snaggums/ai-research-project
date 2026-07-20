import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

describe("Dialog", () => {
  it("exposes an accessible modal title and description", () => {
    render(<Dialog defaultOpen description="Review the study settings." title="Confirm study" />);

    const dialog = screen.getByRole("dialog", { name: "Confirm study" });
    expect(dialog).toHaveTextContent("Review the study settings.");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes from the dismiss button and can be reopened", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen description="Dialog description" title="Dialog title" trigger={<Button>Open dialog</Button>} />,
    );

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeInTheDocument();
  });

  it("runs actions and closes after a selection", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<Dialog defaultOpen description="Dialog description" onPrimary={onPrimary} title="Dialog title" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prevents Escape dismissal when it is non-dismissible", async () => {
    const user = userEvent.setup();
    render(<Dialog defaultOpen description="Dialog description" dismissible={false} title="Required decision" />);

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Required decision" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close dialog" })).not.toBeInTheDocument();
  });
});
