import * as React from "react";

import { cn } from "@/lib/utils";
import type { RecordCodeSummaryValue } from "./record-code-types";

export interface RecordCodeListItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  code: RecordCodeSummaryValue;
  onSelect?: (codeId: string) => void;
  selected?: boolean;
}

export function RecordCodeListItem({
  className,
  code,
  onSelect,
  selected = false,
  ...props
}: RecordCodeListItemProps) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "grid w-full gap-4 rounded-[var(--air-radius-lg)] border p-6 text-left outline-none transition-colors",
        "border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)]",
        "hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
        selected
          && "border-[var(--air-color-interaction-accent)] bg-[var(--air-color-interaction-accent-subtle)] hover:bg-[var(--air-color-interaction-accent-subtle)]",
        className,
      )}
      data-selected={selected || undefined}
      onClick={() => onSelect?.(code.id)}
      type="button"
      {...props}
    >
      <span className="flex min-w-0 items-start justify-between gap-4">
        <span className="min-w-0 flex-1 break-words text-base font-semibold">
          {code.name}
        </span>
        <span className="grid w-32 shrink-0 grid-cols-2 gap-4 text-right">
          <span>
            <span className="block text-sm font-semibold">{code.acceptedHighlightCount}</span>
            <span className="mt-1 block text-[11px] text-[var(--air-color-text-secondary)]">
              Highlights
            </span>
          </span>
          <span>
            <span className="block text-sm font-semibold">{code.sessionCount}</span>
            <span className="mt-1 block text-[11px] text-[var(--air-color-text-secondary)]">
              Sessions
            </span>
          </span>
        </span>
      </span>
      <span className="text-[13px] leading-5 text-[var(--air-color-text-secondary)]">
        {code.description}
      </span>
      <span className="flex justify-between gap-4 text-xs text-[var(--air-color-text-secondary)]">
        <span>Latest evidence</span>
        <span className="text-right">{code.latestEvidenceLabel}</span>
      </span>
    </button>
  );
}
