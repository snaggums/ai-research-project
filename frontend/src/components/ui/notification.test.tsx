import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotificationItem, NotificationPanel, type NotificationData } from "@/components/ui/notification";

const items: NotificationData[] = [
  { actorName: "Jordan Lee", id: "one", time: "Today", title: "mentioned you", unread: true },
  { actorName: "Maya Chen", id: "two", time: "Yesterday", title: "shared a study", unread: false },
];

describe("NotificationItem", () => {
  it("announces unread state and supports selection", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <NotificationItem actorName="Jordan Lee" onSelectedChange={onSelectedChange} time="Today" title="mentioned you" />,
    );

    const item = screen.getByRole("button", { name: /Jordan Lee mentioned you Today Unread/ });
    expect(item).toHaveAttribute("aria-pressed", "false");
    expect(item).toHaveClass("focus-visible:outline-[var(--air-color-interaction-focus)]");
    await user.click(item);
    expect(item).toHaveAttribute("aria-pressed", "true");
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it("preserves the approved disabled avatar opacity", () => {
    const { container } = render(
      <NotificationItem actorName="Jordan Lee" disabled time="Today" title="mentioned you" />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(container.querySelector(".opacity-50")).toBeInTheDocument();
  });

  it("vertically centers the headline content to match Figma", () => {
    render(<NotificationItem actorName="Jordan Lee" time="Today" title="mentioned you" />);

    expect(screen.getByText("Jordan Lee").parentElement).toHaveClass("items-center");
  });
});

describe("NotificationPanel", () => {
  it("updates selected item ids and opens settings", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();
    const onSettings = vi.fn();
    render(
      <NotificationPanel items={items} onSelectedIdsChange={onSelectedIdsChange} onSettings={onSettings} />,
    );

    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Jordan Lee mentioned you Today Unread/ }));
    expect(onSelectedIdsChange).toHaveBeenCalledWith(["one"]);
    await user.click(screen.getByRole("button", { name: "Notification settings" }));
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it("supports an empty notification state", () => {
    render(<NotificationPanel items={[]} />);
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });
});
