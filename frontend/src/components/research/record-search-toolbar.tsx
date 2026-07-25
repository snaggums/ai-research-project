import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";

export interface RecordSearchToolbarProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  disabled?: boolean;
  onClear: () => void;
  onQueryChange: (value: string) => void;
  query: string;
  resultContext: string;
  resultCount: number;
}

export const RecordSearchToolbar = React.forwardRef<HTMLInputElement, RecordSearchToolbarProps>(
  (
    {
      className,
      disabled = false,
      onClear,
      onQueryChange,
      query,
      resultContext,
      resultCount,
      ...props
    },
    forwardedRef,
  ) => {
    const localRef = React.useRef<HTMLInputElement | null>(null);

    function setRef(node: HTMLInputElement | null) {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }

    function clearSearch() {
      onClear();
      requestAnimationFrame(() => localRef.current?.focus());
    }

    return (
      <form
        className={cn(
          "grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
          className,
        )}
        onSubmit={(event) => event.preventDefault()}
        role="search"
        {...props}
      >
        <div className="max-w-[34rem]">
          <SearchField
            ref={setRef}
            disabled={disabled}
            hint="Filters titles and summaries in the latest synthesis using literal keywords."
            label="Search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search titles and summaries"
            rightAction={query ? (
              <Button
                aria-label="Clear search"
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
        </div>
        <div aria-atomic="true" aria-live="polite" className="text-left md:min-w-48 md:text-right" role="status">
          <div className="text-sm font-semibold">{resultCount} {resultCount === 1 ? "item" : "items"}</div>
          <div className="mt-1 text-xs text-[var(--air-color-text-secondary)]">{resultContext}</div>
        </div>
      </form>
    );
  },
);
RecordSearchToolbar.displayName = "RecordSearchToolbar";
