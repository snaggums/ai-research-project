import * as React from "react";
import axe from "axe-core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { recordKnowledge } from "@/mocks/fixtures/records";
import { RecordKnowledgeRow } from "./record-knowledge-row";
import {
  RecordKnowledgeWorkspace,
  type RecordKnowledgeWorkspaceProps,
} from "./record-knowledge-workspace";

function WorkspaceHarness({
  initialQuery = "",
  ...props
}: Omit<
  RecordKnowledgeWorkspaceProps,
  "expandedItemIds" | "onQueryChange" | "onToggleItem" | "query"
> & { initialQuery?: string }) {
  const [query, setQuery] = React.useState(initialQuery);
  const [expandedItemIds, setExpandedItemIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  return (
    <RecordKnowledgeWorkspace
      {...props}
      expandedItemIds={expandedItemIds}
      onQueryChange={setQuery}
      onToggleItem={(itemId) => {
        setExpandedItemIds((current) => {
          const next = new Set(current);
          if (next.has(itemId)) next.delete(itemId);
          else next.add(itemId);
          return next;
        });
      }}
      query={query}
    />
  );
}

describe("Record Knowledge components", () => {
  it("keeps focus on the disclosure while toggling expanded content", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <RecordKnowledgeRow expanded={false} item={recordKnowledge.items[0]} onToggle={onToggle} />,
    );
    const disclosure = screen.getByRole("button", { name: /Checkout must confirm payment success/ });
    disclosure.focus();
    await user.click(disclosure);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(<RecordKnowledgeRow expanded item={recordKnowledge.items[0]} onToggle={onToggle} />);
    expect(disclosure).toHaveFocus();
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: /Checkout must confirm payment success/ })).toBeInTheDocument();
  });

  it("shows the exact source Session and supporting passage count", () => {
    render(
      <RecordKnowledgeRow expanded={false} item={recordKnowledge.items[0]} onToggle={() => undefined} />,
    );
    expect(screen.getByText("Checkout usability test · 2 supporting passages")).toBeInTheDocument();
  });

  it("allows multiple knowledge rows to remain expanded", async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness items={recordKnowledge.items} />);
    const requirement = screen.getByRole("button", { name: /Checkout must confirm payment success/ });
    const decision = screen.getByRole("button", { name: /Keep Knowledge separate from Ask Record/ });
    await user.click(requirement);
    await user.click(decision);
    expect(requirement).toHaveAttribute("aria-expanded", "true");
    expect(decision).toHaveAttribute("aria-expanded", "true");
  });

  it("filters titles and summaries with case-insensitive literal matching", async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness items={recordKnowledge.items} />);
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "KNOWLEDGE");
    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Requirements" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Decision Log" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Action items" })).toBeInTheDocument();
  });

  it("clears a no-results query, restores all items, and returns focus to Search", async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness initialQuery="chargeback" items={recordKnowledge.items} />);
    const noResults = screen.getByRole("heading", { name: "No knowledge matches “chargeback”" }).closest("[role='status']");
    expect(noResults).not.toBeNull();
    await user.click(within(noResults as HTMLElement).getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(screen.getByRole("searchbox", { name: "Search" })).toHaveFocus());
    expect(screen.getByText("9 items")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Decision Log" })).toBeInTheDocument();
  });

  it("exposes retry actions for each failed category without stale rows", () => {
    const onRetry = vi.fn();
    render(<WorkspaceHarness items={recordKnowledge.items} onRetry={onRetry} state="error" />);
    expect(screen.queryByText("Checkout must confirm payment success")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(3);
  });

  it("has no automated semantic violations in ready and no-results states", async () => {
    const ready = render(<WorkspaceHarness items={recordKnowledge.items} />);
    expect((await axe.run(ready.container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    })).violations).toEqual([]);
    ready.unmount();
    const noResults = render(<WorkspaceHarness initialQuery="chargeback" items={recordKnowledge.items} />);
    expect((await axe.run(noResults.container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    })).violations).toEqual([]);
  });
});
