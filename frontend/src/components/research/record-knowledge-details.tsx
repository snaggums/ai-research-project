import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LifecycleStatus, RecordSynthesisItem } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface RecordKnowledgeDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  item: RecordSynthesisItem;
  onOpenEvidence?: () => void;
  onStatusChange?: (status: LifecycleStatus) => void;
  showActions?: boolean;
  statusUpdating?: boolean;
}

export function RecordKnowledgeDetails({
  className,
  item,
  onOpenEvidence,
  onStatusChange,
  showActions = true,
  statusUpdating = false,
  ...props
}: RecordKnowledgeDetailsProps) {
  const nextStatus = item.status === "ai-generated"
    ? "researcher-reviewed"
    : item.status === "researcher-reviewed"
      ? "approved"
      : undefined;
  const statusActionLabel = item.status === "ai-generated" ? "Mark reviewed" : "Approve item";

  return (
    <div
      className={cn(
        "grid gap-4 border-t border-[var(--air-color-border-default)] px-5 pb-5 pt-4",
        className,
      )}
      {...props}
    >
      <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4">
        <h4 className="text-sm font-medium">Evidence preview</h4>
        <blockquote className="mt-3 text-sm leading-6 text-[var(--air-color-text-secondary)]">
          “{item.evidencePreview}”
        </blockquote>
      </div>
      <div className="flex flex-col gap-4 text-xs text-[var(--air-color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
        <span>{item.provenance}</span>
        {showActions ? (
          <div className="flex flex-wrap gap-2">
            {onOpenEvidence ? (
              <Button onClick={onOpenEvidence} size="small" variant="gray-subtle">
                Open evidence
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            ) : null}
            {nextStatus && onStatusChange ? (
              <Button
                disabled={statusUpdating}
                onClick={() => onStatusChange(nextStatus)}
                size="small"
                variant="gray-subtle"
              >
                {statusUpdating ? "Saving…" : statusActionLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
