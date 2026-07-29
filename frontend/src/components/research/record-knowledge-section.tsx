import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type {
  RecordKnowledgeItem,
  RecordKnowledgeItemType,
  LifecycleStatus,
  RecordSynthesisItem,
} from "@/domain/types";
import { cn } from "@/lib/utils";
import { RecordKnowledgeRow } from "./record-knowledge-row";

export type RecordKnowledgeSectionState = "populated" | "empty" | "loading" | "error";

export interface RecordKnowledgeSectionProps extends React.HTMLAttributes<HTMLElement> {
  expandedItemIds?: ReadonlySet<string>;
  items: Array<RecordKnowledgeItem | RecordSynthesisItem>;
  label: string;
  onOpenEvidence?: (itemId: string) => void;
  onRetry?: () => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  onToggleItem?: (itemId: string) => void;
  state?: RecordKnowledgeSectionState;
  statusUpdatingItemId?: string;
  type: RecordKnowledgeItemType;
}

const emptyDescriptions: Record<RecordKnowledgeItemType, string> = {
  requirement: "No approved Session Report Requirements are available.",
  decision: "No approved Session Report Decisions are available.",
  "action-item": "No approved Session Report Action Items are available.",
};

export function RecordKnowledgeSection({
  className,
  expandedItemIds = new Set<string>(),
  items,
  label,
  onOpenEvidence,
  onRetry,
  onToggleItem,
  state = items.length ? "populated" : "empty",
  type,
  ...props
}: RecordKnowledgeSectionProps) {
  const headingId = React.useId();
  const countLabel = state === "loading" ? "Loading" : `${items.length} ${items.length === 1 ? "item" : "items"}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5",
        className,
      )}
      {...props}
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold" id={headingId}>{label}</h2>
        <span className="text-xs text-[var(--air-color-text-secondary)]">{countLabel}</span>
      </header>

      {state === "loading" ? (
        <div aria-live="polite" className="grid min-h-32 place-items-center" role="status">
          <div className="grid justify-items-center gap-3 text-sm text-[var(--air-color-text-secondary)]">
            <Spinner aria-hidden="true" label={`Loading ${label}`} />
            <span>Loading {label}</span>
          </div>
        </div>
      ) : null}

      {state === "empty" ? (
        <div className="mt-4 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-5 text-sm text-[var(--air-color-text-secondary)]">
          {emptyDescriptions[type]}
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-4 grid gap-3">
          <Alert
            message={`${label} could not be loaded. Approved Session Reports have not been changed.`}
            title={`${label} could not be loaded`}
            tone="error"
          />
          {onRetry ? (
            <Button className="justify-self-start" onClick={onRetry} size="small" variant="gray-subtle">
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {state === "populated" ? (
        <ul className="mt-4 grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <RecordKnowledgeRow
                expanded={expandedItemIds.has(item.id)}
                item={item}
                onOpenEvidence={onOpenEvidence ? () => onOpenEvidence(item.id) : undefined}
                onToggle={() => onToggleItem?.(item.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
