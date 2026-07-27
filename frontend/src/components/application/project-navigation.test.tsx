import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ProjectNavigation,
  type ProjectNavigationEntry,
} from "./project-navigation";

const items: ProjectNavigationEntry[] = [
  { href: "#overview", id: "overview", label: "Overview", type: "link" },
  {
    href: "#sessions",
    id: "sessions",
    items: [
      { href: "#session-1", id: "session-1", label: "Session 1" },
      { href: "#session-2", id: "session-2", label: "Session 2" },
    ],
    label: "Sessions",
    type: "group",
  },
  {
    href: "#records",
    id: "records",
    items: [{ href: "#record-1", id: "record-1", label: "Record 1" }],
    label: "Records",
    type: "group",
  },
];

describe("ProjectNavigation", () => {
  it("uses an accessible accordion while preserving collection destinations", async () => {
    const user = userEvent.setup();
    render(<ProjectNavigation items={items} />);

    expect(screen.getByRole("link", { name: "Sessions, 2 items" })).toHaveAttribute(
      "href",
      "#sessions",
    );
    const sessionsList = document.querySelector("#project-navigation-sessions-list");
    expect(sessionsList).toHaveClass("hidden");
    expect(sessionsList).not.toHaveClass("grid");
    expect(sessionsList).not.toBeVisible();

    await user.click(screen.getByRole("button", { name: "Expand Sessions" }));
    expect(screen.getByRole("list", { name: "Sessions list" })).toHaveClass("grid");
    expect(screen.getByRole("list", { name: "Sessions list" })).not.toHaveClass("hidden");
    expect(screen.getByRole("list", { name: "Sessions list" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Expand Records" }));
    expect(document.querySelector("#project-navigation-sessions-list")).toHaveClass("hidden");
    expect(document.querySelector("#project-navigation-sessions-list")).not.toBeVisible();
    expect(screen.getByRole("list", { name: "Records list" })).toBeVisible();
  });

  it("expands the group containing the current detail and reports navigation", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <ProjectNavigation
        activeChildId="session-2"
        activeId="sessions"
        items={items}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByRole("list", { name: "Sessions list" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sessions, 2 items" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Session 2" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("link", { name: "Session 2" }));
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ href: "#session-2", id: "session-2" }),
    );
  });

  it("returns to the approved collapsed collection state after leaving a detail route", () => {
    const { rerender } = render(
      <ProjectNavigation activeChildId="session-2" activeId="sessions" items={items} />,
    );

    expect(screen.getByRole("button", { name: "Collapse Sessions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    rerender(<ProjectNavigation activeId="sessions" items={items} />);

    expect(screen.getByRole("button", { name: "Expand Sessions" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.querySelector("#project-navigation-sessions-list")).not.toBeVisible();
  });

  it("renders controlled active-collapsed and active-expanded group states", () => {
    const { rerender } = render(
      <ProjectNavigation activeId="sessions" expandedId={null} items={items} />,
    );

    const sessionsLink = screen.getByRole("link", { name: "Sessions, 2 items" });
    expect(sessionsLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Expand Sessions" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.querySelector("#project-navigation-sessions-list")).toHaveClass("hidden");
    expect(sessionsLink.parentElement).toHaveClass(
      "before:bg-[var(--air-color-interaction-accent)]",
    );

    rerender(
      <ProjectNavigation activeId="sessions" expandedId="sessions" items={items} />,
    );

    expect(screen.getByRole("button", { name: "Collapse Sessions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("list", { name: "Sessions list" })).toHaveClass("grid");
    expect(screen.getByRole("list", { name: "Sessions list" })).toBeVisible();
  });
});
