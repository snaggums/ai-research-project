import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { LifecycleStatus, RecordSynthesisItem } from "@/domain/types";
import { cn } from "@/lib/utils";
import { lifecycleStatusLabels, lifecycleStatusTone } from "./record-presentation";
import { RecordKnowledgeDetails } from "./record-knowledge-details";

export interface RecordKnowledgeRowProps extends React.HTMLAttributes<HTMLElement> {
  expanded: boolean;
  item: RecordSynthesisItem;
  onOpenEvidence?: () => void;
  onStatusChange?: (status: LifecycleStatus) => void;
  onToggle: () => void;
  showActions?: boolean;
  statusUpdating?: boolean;
}

export function RecordKnowledgeRow({
  className,
  expanded,
  item,
  onOpenEvidence,
  onStatusChange,
  onToggle,
  showActions = true,
  statusUpdating = false,
  ...props
}: RecordKnowledgeRowProps) {
  const disclosureId = React.useId();
  const detailsId = `${disclosureId}-details`;
  const sourceSummary = `${item.sourceSessionCount} ${item.sourceSessionCount === 1 ? "Session" : "Sessions"} · ${item.sourceReportItemCount} Report ${item.sourceReportItemCount === 1 ? "item" : "items"}`;
  const DisclosureIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)]",
        className,
      )}
      {...props}
    >
      <button
        aria-controls={detailsId}
        aria-expanded={expanded}
        className={cn(
          "grid min-h-[104px] w-full grid-cols-1 items-center gap-4 rounded-[var(--air-radius-lg)] px-5 py-4 text-left outline-none md:grid-cols-[minmax(0,1fr)_auto]",
          "hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--air-color-interaction-focus)]",
        )}
        id={disclosureId}
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0">
          <span className="block text-lg font-semibold leading-7">{item.title}</span>
          <span className="mt-2 block text-sm leading-6 text-[var(--air-color-text-secondary)]">
            {item.summary}
          </span>
        </span>
        <span className="flex max-w-full flex-wrap items-center gap-3 md:flex-nowrap md:justify-self-end">
          <Badge showIcon={false} tone={lifecycleStatusTone(item.status)}>
            {lifecycleStatusLabels[item.status]}
          </Badge>
          <span className="whitespace-nowrap text-xs text-[var(--air-color-text-secondary)]">{sourceSummary}</span>
          <DisclosureIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
        </span>
      </button>
      {expanded ? (
        <RecordKnowledgeDetails
          aria-labelledby={disclosureId}
          id={detailsId}
          item={item}
          onOpenEvidence={onOpenEvidence}
          onStatusChange={onStatusChange}
          role="region"
          showActions={showActions}
          statusUpdating={statusUpdating}
        />
      ) : null}
    </article>
  );
}
