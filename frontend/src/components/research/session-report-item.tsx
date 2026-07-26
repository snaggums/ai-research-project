import * as React from "react";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SessionReportItem as SessionReportItemValue,
  SessionReportOwnershipStatus,
} from "@/domain/types";
import { cn } from "@/lib/utils";

const ownershipStatusPresentation: Record<
  SessionReportOwnershipStatus,
  { label: string; tone: NonNullable<BadgeProps["tone"]> }
> = {
  "ai-suggested": { label: "AI suggested", tone: "brand" },
  confirmed: { label: "Confirmed", tone: "success" },
  "confirmed-empty": { label: "Confirmed", tone: "success" },
  "needs-review": { label: "Needs review", tone: "warning" },
};

export interface SessionReportItemProps {
  defaultExpanded?: boolean;
  disclosureId?: string;
  expanded?: boolean;
  item: SessionReportItemValue;
  layout?: "default" | "compact";
  onEdit?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  onOpenContext?: () => void;
  showActions?: boolean;
  showEvidence?: boolean;
}

export function SessionReportItem({
  defaultExpanded = false,
  disclosureId,
  expanded: controlledExpanded,
  item,
  layout = "default",
  onEdit,
  onExpandedChange,
  onOpenContext,
  showActions = true,
  showEvidence = true,
}: SessionReportItemProps) {
  const generatedId = React.useId();
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
  const expanded = controlledExpanded ?? internalExpanded;
  const buttonId = disclosureId ?? `session-report-item-${generatedId}-disclosure`;
  const contentId = `${buttonId}-content`;
  const hasOwnership = item.type === "decision" || item.type === "action-item";
  const ownership = hasOwnership
    ? item.ownership ?? {
      role: item.type === "decision" ? "decision-maker" as const : "assignee" as const,
      status: "needs-review" as const,
    }
    : undefined;
  const ownershipStatus = ownership
    ? ownershipStatusPresentation[ownership.status]
    : undefined;
  const ownershipLabel = item.type === "decision" ? "Decision maker" : "Assignee";
  const ownershipValue = ownership?.status === "confirmed-empty"
    ? "None"
    : ownership?.value || "Not identified";
  const evidence = item.evidence[0];

  function setExpanded(nextExpanded: boolean) {
    if (controlledExpanded === undefined) setInternalExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  }

  return (
    <article className="grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4">
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        aria-label={item.title}
        className={cn(
          "grid min-h-10 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-[var(--air-radius-sm)] text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
          hasOwnership && "sm:grid-cols-[minmax(0,1fr)_auto_auto]",
        )}
        id={buttonId}
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span className="min-w-0 truncate font-semibold leading-6 text-[var(--air-color-text-primary)]">
          {item.title}
        </span>
        {ownership && ownershipStatus ? (
          <span className="col-start-1 row-start-2 flex min-w-0 items-center gap-2 sm:col-auto sm:row-auto">
            <span className="shrink-0 text-xs leading-4 text-[var(--air-color-text-muted)]">
              {ownershipLabel}
            </span>
            <span
              className="min-w-0 truncate text-sm font-medium leading-5 text-[var(--air-color-text-secondary)]"
              title={ownershipValue}
            >
              {ownershipValue}
            </span>
            <Badge className="shrink-0" showIcon={false} tone={ownershipStatus.tone}>
              {ownershipStatus.label}
            </Badge>
          </span>
        ) : null}
        {expanded
          ? <ChevronUp aria-hidden="true" className="col-start-2 row-start-1 h-5 w-5 shrink-0 sm:col-start-auto sm:row-auto" />
          : <ChevronDown aria-hidden="true" className="col-start-2 row-start-1 h-5 w-5 shrink-0 sm:col-start-auto sm:row-auto" />}
      </button>

      {expanded ? (
        <div className="grid gap-4" id={contentId}>
          <p className="leading-6 text-[var(--air-color-text-secondary)]">{item.summary}</p>
          {ownership?.rationale ? (
            <p className="rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-subtle)] p-3 text-sm leading-5 text-[var(--air-color-text-muted)]">
              {ownership.rationale}
            </p>
          ) : null}
          {showEvidence && evidence ? (
            <div className="grid gap-2 rounded-[var(--air-radius-sm)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4 text-sm">
              <h4 className="font-medium leading-5 tracking-[0.1px]">Supporting evidence</h4>
              <p className={cn(
                "leading-5 text-[var(--air-color-text-secondary)]",
                layout === "compact" && "line-clamp-2",
              )}>
                “{evidence.excerpt}”
              </p>
            </div>
          ) : null}
          {showActions && (onOpenContext || onEdit) ? (
            <footer className="flex flex-wrap gap-2">
              {onOpenContext ? (
                <Button onClick={onOpenContext} size="small" variant="gray-subtle">
                  Open evidence
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
              {onEdit ? (
                <Button onClick={onEdit} size="small" variant="text">
                  Edit
                </Button>
              ) : null}
            </footer>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
