import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LifecycleStatus, RecordKnowledgeItem, RecordSynthesisItem } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface RecordKnowledgeDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  item: RecordKnowledgeItem | RecordSynthesisItem;
  onOpenEvidence?: () => void;
  onStatusChange?: (status: LifecycleStatus) => void;
  showActions?: boolean;
  statusUpdating?: boolean;
}

export function RecordKnowledgeDetails({
  className,
  item,
  onOpenEvidence,
  ...props
}: RecordKnowledgeDetailsProps) {
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
      {"ownership" in item && item.ownership ? (
        <dl className="grid gap-2 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--air-color-text-secondary)]">
              {item.ownership.role === "assignee" ? "Assignee" : "Decision maker"}
            </dt>
            <dd className="mt-1">{item.ownership.value ?? "Not assigned"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--air-color-text-secondary)]">Ownership status</dt>
            <dd className="mt-1">{item.ownership.status.replace(/-/g, " ")}</dd>
          </div>
        </dl>
      ) : null}
      <div className="flex flex-col gap-4 text-xs text-[var(--air-color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
        <span>{item.provenance} · Approved Session Report</span>
        {onOpenEvidence && item.evidenceIds.length ? (
          <Button onClick={onOpenEvidence} size="small" variant="gray-subtle">
            Open evidence
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
