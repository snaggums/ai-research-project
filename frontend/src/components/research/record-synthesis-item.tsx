import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LifecycleStatus, RecordSynthesisItem as RecordSynthesisItemValue } from "@/domain/types";
import { cn } from "@/lib/utils";
import {
  lifecycleStatusLabels,
  lifecycleStatusTone,
  recordItemTypeTone,
  recordSynthesisItemLabels,
} from "./record-presentation";

export interface RecordSynthesisItemProps extends React.HTMLAttributes<HTMLElement> {
  item: RecordSynthesisItemValue;
  layout?: "default" | "compact";
  onOpenEvidence?: () => void;
  onStatusChange?: (status: LifecycleStatus) => void;
  showAction?: boolean;
  statusUpdating?: boolean;
}

export function RecordSynthesisItem({ className, item, layout = "default", onOpenEvidence, onStatusChange, showAction = true, statusUpdating = false, ...props }: RecordSynthesisItemProps) {
  const compact = layout === "compact";
  const nextStatus = item.status === "ai-generated" ? "researcher-reviewed" : item.status === "researcher-reviewed" ? "approved" : undefined;
  const statusActionLabel = item.status === "ai-generated" ? "Mark reviewed" : "Approve item";
  return (
    <article className={cn("grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5", className)} {...props}>
      <header className={cn("flex gap-3", compact ? "flex-col" : "flex-wrap items-start justify-between")}>
        <div className="min-w-0 flex-1"><h3 className="text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)]">{item.summary}</p></div>
        <div className="flex flex-wrap gap-2"><Badge showIcon={false} tone={recordItemTypeTone(item.type)}>{recordSynthesisItemLabels[item.type]}</Badge><Badge showIcon={false} tone={lifecycleStatusTone(item.status)}>{lifecycleStatusLabels[item.status]}</Badge></div>
      </header>
      <blockquote className="border-l-4 border-[var(--air-color-interaction-progress)] bg-[var(--air-color-bg-subtle)] p-4 text-sm leading-6">“{item.evidencePreview}”</blockquote>
      <div className="text-xs text-[var(--air-color-text-secondary)]">{item.sourceSessionCount} source Sessions · {item.sourceReportItemCount} source Report items</div>
      <div className="text-xs text-[var(--air-color-text-secondary)]">{item.provenance}</div>
      {showAction ? <footer className="flex flex-wrap gap-2"><Button onClick={onOpenEvidence} size="small" variant="gray-subtle">Open evidence <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button>{nextStatus && onStatusChange ? <Button disabled={statusUpdating} onClick={() => onStatusChange(nextStatus)} size="small">{statusUpdating ? "Saving..." : statusActionLabel}</Button> : null}</footer> : null}
    </article>
  );
}
