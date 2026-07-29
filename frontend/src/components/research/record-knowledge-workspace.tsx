import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  RecordKnowledgeItem,
  RecordKnowledgeItemType,
  LifecycleStatus,
  RecordSynthesisItem,
} from "@/domain/types";
import { cn } from "@/lib/utils";
import {
  RecordKnowledgeSection,
  type RecordKnowledgeSectionState,
} from "./record-knowledge-section";
import { RecordSearchToolbar } from "./record-search-toolbar";

export type RecordKnowledgeWorkspaceState = "ready" | "loading" | "empty" | "error";

export interface RecordKnowledgeWorkspaceProps extends React.HTMLAttributes<HTMLElement> {
  expandedItemIds?: ReadonlySet<string>;
  items: Array<RecordKnowledgeItem | RecordSynthesisItem>;
  onOpenEvidence?: (itemId: string) => void;
  onQueryChange: (value: string) => void;
  onRetry?: () => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  onToggleItem?: (itemId: string) => void;
  query: string;
  state?: RecordKnowledgeWorkspaceState;
  statusUpdatingItemId?: string;
}

const sectionOrder: Array<{ label: string; type: RecordKnowledgeItemType }> = [
  { label: "Requirements", type: "requirement" },
  { label: "Decision Log", type: "decision" },
  { label: "Action items", type: "action-item" },
];

export function RecordKnowledgeWorkspace({
  className,
  expandedItemIds = new Set<string>(),
  items,
  onOpenEvidence,
  onQueryChange,
  onRetry,
  onToggleItem,
  query,
  state = "ready",
  ...props
}: RecordKnowledgeWorkspaceProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => `${item.title}\n${item.summary}`.toLocaleLowerCase().includes(normalizedQuery))
    : items;
  const searchActive = Boolean(normalizedQuery);
  const hasResults = filteredItems.length > 0;
  const disabled = state !== "ready" || items.length === 0;
  const resultContext = state === "loading"
    ? "Loading Record Knowledge"
    : state === "error"
      ? "Record Knowledge unavailable"
      : searchActive
        ? hasResults
          ? `Match “${query.trim()}”`
          : `No matches for “${query.trim()}”`
        : "Approved Session Report knowledge";
  const resultCount = state === "ready" ? filteredItems.length : 0;
  const sectionState: RecordKnowledgeSectionState = state === "ready"
    ? "populated"
    : state === "loading"
      ? "loading"
      : state;

  function clearSearch() {
    onQueryChange("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <section className={cn("grid gap-5", className)} aria-label="Record Knowledge" {...props}>
      <RecordSearchToolbar
        ref={searchInputRef}
        disabled={disabled}
        onClear={clearSearch}
        onQueryChange={onQueryChange}
        query={query}
        resultContext={resultContext}
        resultCount={resultCount}
      />

      {state === "ready" && searchActive && !hasResults ? (
        <div
          aria-live="polite"
          className="grid min-h-60 place-items-center rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-8 text-center"
          role="status"
        >
          <div className="grid max-w-xl justify-items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)]">
              <Search aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold">No knowledge matches “{query.trim()}”</h2>
            <p className="text-sm text-[var(--air-color-text-secondary)]">
              Try a different keyword or clear search to show all {items.length} items.
            </p>
            <Button onClick={clearSearch} size="small" variant="gray-subtle">
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        sectionOrder.map(({ label, type }) => {
          const sectionItems = filteredItems.filter((item) => item.type === type);
          if (state === "ready" && searchActive && sectionItems.length === 0) return null;
          return (
            <RecordKnowledgeSection
              expandedItemIds={expandedItemIds}
              items={state === "ready" ? sectionItems : []}
              key={type}
              label={label}
              onOpenEvidence={onOpenEvidence}
              onRetry={onRetry}
              onToggleItem={onToggleItem}
              state={sectionState}
              type={type}
            />
          );
        })
      )}
    </section>
  );
}
