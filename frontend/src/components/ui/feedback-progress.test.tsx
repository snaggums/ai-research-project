import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Tabs } from "@/components/ui/tabs";

describe("Alert", () => {
  it("announces errors and supports an accessible dismiss action", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert dismissible message="Try again." onDismiss={onDismiss} size="large" title="Upload failed" tone="error" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again.");
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Spinner", () => {
  it("exposes its loading label", () => {
    render(<Spinner label="Loading sessions" size="medium" />);
    expect(screen.getByRole("status", { name: "Loading sessions" })).toBeInTheDocument();
  });
});

describe("Progress", () => {
  it("clamps values and exposes progress semantics", () => {
    render(<Progress label="Upload progress" value={120} />);
    const progressbar = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(progressbar).toHaveAttribute("aria-valuenow", "100");
    expect(progressbar).toHaveAttribute("aria-valuetext", "100%");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("sizes the indicator to the supplied percentage", () => {
    const { container, rerender } = render(<Progress value={25} />);
    const progressbar = container.querySelector("[role='progressbar']");
    expect(progressbar).toHaveAttribute("data-progress-value", "25");
    expect(progressbar?.getAttribute("style")).toContain("25%");

    rerender(<Progress value={75} />);
    expect(progressbar).toHaveAttribute("data-progress-value", "75");
    expect(progressbar?.getAttribute("style")).toContain("75%");
  });
});

describe("Tabs", () => {
  const items = [
    { content: "Overview content", label: "Overview", value: "overview" },
    { content: "Sessions content", disabled: true, label: "Sessions", value: "sessions" },
    { content: "Insights content", label: "Insights", value: "insights" },
  ];

  it("uses arrow keys to select the next enabled tab", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs aria-label="Study sections" items={items} onValueChange={onValueChange} />);

    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Insights" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Insights content");
    expect(onValueChange).toHaveBeenCalledWith("insights");
  });
});
