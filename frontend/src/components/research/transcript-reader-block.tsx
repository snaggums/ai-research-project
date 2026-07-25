import * as React from "react";

import { cn } from "@/lib/utils";
import { TranscriptCodeChip } from "./transcript-code-chip";
import type { TranscriptReaderBlockState, TranscriptReaderBlockValue } from "./transcript-coding-types";

const highlightedStates = new Set<TranscriptReaderBlockState>([
  "accepted-coded",
  "filtered-match",
  "selection-active",
]);

export interface TranscriptReaderBlockProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  block: TranscriptReaderBlockValue;
  onRemoveCode?: (codeId: string) => void;
  onSelect?: (blockId: string) => void;
  selected?: boolean;
}

export const TranscriptReaderBlock = React.forwardRef<HTMLElement, TranscriptReaderBlockProps>(
  ({ block, className, onKeyDown, onRemoveCode, onSelect, selected = false, ...props }, ref) => {
    const state = block.state ?? "default";
    const highlighted = highlightedStates.has(state);
    const selectable = Boolean(onSelect);

    return (
      <article
        ref={ref}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "grid w-full gap-4 rounded-[var(--air-radius-md)] border p-6 text-left transition-colors",
          state === "default" && "border-transparent bg-[var(--air-color-bg-surface)]",
          state === "accepted-coded" &&
            "border-[var(--air-color-interaction-progress)] bg-[var(--air-color-interaction-accent-subtle)]",
          state === "filtered-match" &&
            "border-[var(--air-color-interaction-progress)] bg-[var(--air-color-interaction-accent-subtle)]",
          state === "selection-active" &&
            "border-[var(--air-color-interaction-focus)] bg-[var(--air-color-interaction-accent-subtle)]",
          state === "uncoded" &&
            "border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)]",
          state === "dimmed" &&
            "border-transparent bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-secondary)]",
          selected && "shadow-[inset_4px_0_0_var(--air-color-interaction-progress)]",
          selectable &&
            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
          className,
        )}
        data-transcript-block="true"
        data-state={state}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
          if (!window.getSelection()?.isCollapsed) return;
          onSelect?.(block.id);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (selectable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelect?.(block.id);
          }
        }}
        tabIndex={selectable ? 0 : undefined}
        {...props}
      >
        <p className="text-sm font-medium text-[var(--air-color-text-primary)]">
          {[block.speaker, block.location].filter(Boolean).join(" • ")}
        </p>
        <p
          className="select-text text-base leading-6 text-[var(--air-color-text-secondary)]"
          data-block-id={block.id}
          data-transcript-excerpt="true"
        >
          {block.excerpt}
        </p>
        {block.codes && block.codes.length > 0 ? (
          <div className="flex flex-wrap gap-2 bg-transparent" aria-label="Applied codes">
            {block.codes.map((code) => (
              <TranscriptCodeChip
                key={code.id}
                codeName={code.name}
                onRemove={onRemoveCode ? () => onRemoveCode(code.id) : undefined}
                presentation={highlighted ? "highlighted" : "surface"}
                removable={Boolean(onRemoveCode)}
              />
            ))}
          </div>
        ) : state === "uncoded" ? (
          <span className="w-fit rounded-full bg-[var(--air-color-bg-subtle)] px-2 py-1 text-xs font-semibold text-[var(--air-color-text-secondary)]">
            Uncoded
          </span>
        ) : null}
      </article>
    );
  },
);
TranscriptReaderBlock.displayName = "TranscriptReaderBlock";
