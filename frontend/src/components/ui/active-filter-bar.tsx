import * as React from "react";

import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export interface ActiveFilterValue {
  id: string;
  label: string;
}

export interface ActiveFilterBarProps extends React.HTMLAttributes<HTMLElement> {
  filters: ActiveFilterValue[];
  label?: string;
  onRemoveFilter?: (filterId: string) => void;
  resultSummary?: React.ReactNode;
}

export function ActiveFilterBar({
  className,
  filters,
  label = "Active filters:",
  onRemoveFilter,
  resultSummary,
  ...props
}: ActiveFilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <section
      aria-label="Active filters"
      className={cn(
        "grid gap-2 border-t border-[var(--air-color-border-default)] pt-4",
        className,
      )}
      {...props}
    >
      <h3 className="text-sm font-semibold leading-5">{label}</h3>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Chip
            key={filter.id}
            onRemove={onRemoveFilter ? () => onRemoveFilter(filter.id) : undefined}
            removable={Boolean(onRemoveFilter)}
            removeLabel={`Remove ${filter.label} filter`}
            selectable={false}
            selected
          >
            {filter.label}
          </Chip>
        ))}
      </div>
      {resultSummary ? (
        <p aria-live="polite" className="text-sm leading-5 text-[var(--air-color-text-secondary)]">
          {resultSummary}
        </p>
      ) : null}
    </section>
  );
}
