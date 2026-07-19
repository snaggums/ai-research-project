import * as React from "react";

import type { LifecycleStatus, RecordSynthesis, RecordSynthesisItemType } from "@/domain/types";
import { cn } from "@/lib/utils";
import { formatRecordSynthesisDate } from "./record-presentation";
import { RecordSynthesisItem } from "./record-synthesis-item";

export interface RecordSynthesisResultsProps extends React.HTMLAttributes<HTMLElement> {
  layout?: "default" | "compact";
  onOpenEvidence?: (itemId: string) => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  statusUpdatingItemId?: string;
  synthesis: RecordSynthesis;
  title?: string;
}

const sectionOrder: RecordSynthesisItemType[] = ["requirement", "decision", "action-item"];
const sectionLabels: Record<RecordSynthesisItemType, string> = {
  requirement: "Requirements",
  decision: "Decisions",
  "action-item": "Action Items",
};

export function RecordSynthesisResults({ className, layout = "default", onOpenEvidence, onStatusChange, statusUpdatingItemId, synthesis, title = "Record synthesis results", ...props }: RecordSynthesisResultsProps) {
  const compact = layout === "compact";
  return (
    <section className={cn("rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6", className)} {...props}>
      <header className={cn("flex gap-4", compact ? "flex-col" : "flex-wrap items-start justify-between")}><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm text-[var(--air-color-text-secondary)]">Consolidated across all eligible Sessions related to this Record.</p></div><span className="text-sm text-[var(--air-color-text-secondary)]">{synthesis.items.length} {synthesis.items.length === 1 ? "item" : "items"}</span></header>
      <div className="mt-5 grid gap-2 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-xs text-[var(--air-color-text-secondary)] md:grid-cols-3">
        <span>Generated {formatRecordSynthesisDate(synthesis.generatedAt)}</span>
        <span>{synthesis.sourceSessionCount} included Sessions · {synthesis.sourceReportRevisionCount} Session Report revisions</span>
        <span>{[synthesis.provider, synthesis.model, synthesis.promptVersion].filter(Boolean).join(" · ")}</span>
      </div>
      {synthesis.items.length ? <div className="mt-6 grid gap-7">{sectionOrder.map((type) => { const items = synthesis.items.filter((item) => item.type === type); return items.length ? <section key={type}><h3 className="mb-3 text-xl font-semibold">{sectionLabels[type]}</h3><div className="grid gap-4">{items.map((item) => <RecordSynthesisItem item={item} key={item.id} layout={layout} onOpenEvidence={() => onOpenEvidence?.(item.id)} onStatusChange={onStatusChange ? (status) => onStatusChange(item.id, status) : undefined} statusUpdating={statusUpdatingItemId === item.id} />)}</div></section> : null; })}</div> : <div className="mt-6 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-6 text-center"><h3 className="font-semibold">No synthesis items yet</h3><p className="mt-2 text-sm text-[var(--air-color-text-secondary)]">Generate synthesis after at least two Session Reports become eligible.</p></div>}
    </section>
  );
}
