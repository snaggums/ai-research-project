import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SelectField } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { RecordCodeListItem } from "./record-code-list-item";
import {
  recordCodeSortOptions,
  type RecordCodeSortValue,
  type RecordCodeSummaryValue,
} from "./record-code-types";

export type RecordCodeCollectionState = "ready" | "loading" | "empty" | "error";

export interface RecordCodeCollectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  codes: RecordCodeSummaryValue[];
  defaultSortOpen?: boolean;
  onClearSearch: () => void;
  onQueryChange: (query: string) => void;
  onRetry?: () => void;
  onSelectCode?: (codeId: string) => void;
  onSortChange: (sort: RecordCodeSortValue) => void;
  onViewRelatedSessions?: () => void;
  query: string;
  selectedCodeId?: string;
  sessionCount: number;
  sort: RecordCodeSortValue;
  state?: RecordCodeCollectionState;
  totalCodeCount: number;
}

export function RecordCodeCollection({
  className,
  codes,
  defaultSortOpen = false,
  onClearSearch,
  onQueryChange,
  onRetry,
  onSelectCode,
  onSortChange,
  onViewRelatedSessions,
  query,
  selectedCodeId,
  sessionCount,
  sort,
  state = "ready",
  totalCodeCount,
  ...props
}: RecordCodeCollectionProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const disabled = state !== "ready";
  const noResults = state === "ready" && Boolean(query.trim()) && codes.length === 0;

  function clearSearch() {
    onClearSearch();
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <section
      aria-label="Accepted codes"
      className={cn(
        "grid w-[416px] gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6",
        className,
      )}
      {...props}
    >
      <header className="grid gap-2">
        <h2 className="text-xl font-semibold">Accepted codes</h2>
        <p className="text-[13px] text-[var(--air-color-text-secondary)]">
          {totalCodeCount} {totalCodeCount === 1 ? "Code" : "Codes"} from{" "}
          {sessionCount} {sessionCount === 1 ? "Session" : "Sessions"}
        </p>
      </header>

      <div className="grid gap-2">
        <SearchField
          ref={searchInputRef}
          disabled={disabled}
          label="Search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by code name"
          rightAction={query ? (
            <Button
              aria-label="Clear code search"
              disabled={disabled}
              onClick={clearSearch}
              size="icon-small"
              type="button"
              variant="text"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          ) : undefined}
          value={query}
        />
        <SelectField
          defaultOpen={defaultSortOpen}
          disabled={disabled}
          label="Sort by"
          onValueChange={(value) => onSortChange(value as RecordCodeSortValue)}
          options={recordCodeSortOptions}
          value={sort}
        />
      </div>

      {state === "loading" ? (
        <div
          aria-live="polite"
          className="flex min-h-28 items-center justify-center gap-3"
          role="status"
        >
          <Spinner label="Loading accepted Codes" size="small" />
          <span className="text-sm text-[var(--air-color-text-secondary)]">
            Loading accepted Codes...
          </span>
        </div>
      ) : state === "empty" ? (
        <div className="grid gap-2" role="status">
          <h3 className="text-lg font-semibold">No accepted Codes yet</h3>
          <p className="text-sm text-[var(--air-color-text-secondary)]">
            Accepted Codes appear after researchers apply or accept Codes in Session Transcript
            Coding.
          </p>
          {onViewRelatedSessions ? (
            <div className="pt-1">
              <Button onClick={onViewRelatedSessions} size="small" variant="gray-subtle">
                View related Sessions
              </Button>
            </div>
          ) : null}
        </div>
      ) : state === "error" ? (
        <div className="grid gap-2" role="alert">
          <h3 className="text-lg font-semibold">Codes could not be loaded</h3>
          <p className="text-sm text-[var(--air-color-text-secondary)]">
            Check your connection and try again. Existing source coding has not changed.
          </p>
          {onRetry ? (
            <div className="pt-1">
              <Button onClick={onRetry} size="small" variant="gray-subtle">
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      ) : noResults ? (
        <div aria-live="polite" className="grid gap-2" role="status">
          <h3 className="text-lg font-semibold">No Codes match “{query.trim()}”</h3>
          <p className="text-sm text-[var(--air-color-text-secondary)]">
            Try a different code name or clear search to show all accepted Codes.
          </p>
          <div className="pt-1">
            <Button onClick={clearSearch} size="small" variant="gray-subtle">
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <ul aria-label="Accepted Record Codes" className="grid gap-2">
          {codes.map((code) => (
            <li key={code.id}>
              <RecordCodeListItem
                code={code}
                onSelect={onSelectCode}
                selected={code.id === selectedCodeId}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[var(--air-color-text-secondary)]">
        Counts include accepted Highlights from Sessions assigned to this Record.
      </p>
    </section>
  );
}
