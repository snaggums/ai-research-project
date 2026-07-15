import { ArrowUpRight, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionReportItem as SessionReportItemValue } from "@/domain/types";
import { reportItemLabels, reportItemTone } from "./synthesis-presentation";

export interface SessionReportItemProps {
  item: SessionReportItemValue;
  layout?: "default" | "compact";
  onEdit?: () => void;
  onOpenContext?: () => void;
  showActions?: boolean;
  showEvidence?: boolean;
}

export function SessionReportItem({ item, layout = "default", onEdit, onOpenContext, showActions = true, showEvidence = true }: SessionReportItemProps) {
  return <article className="grid gap-3 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4">
    <header className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1"><h4 className="font-semibold">{item.title}</h4><p className="mt-1 text-sm leading-6 text-[var(--air-color-text-secondary)]">{item.summary}</p></div><Badge showIcon={false} tone={reportItemTone(item.type)}>{reportItemLabels[item.type]}</Badge></header>
    <p className="text-xs text-[var(--air-color-text-secondary)]">{item.provenance}</p>
    {showEvidence && item.evidence[0] ? <p className={layout === "compact" ? "line-clamp-2 rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-subtle)] p-3 text-sm" : "rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-subtle)] p-3 text-sm leading-6"}>“{item.evidence[0].excerpt}”</p> : null}
    {showActions ? <footer className="flex flex-wrap gap-2"><Button onClick={onOpenContext} size="small" variant="gray-subtle">Open transcript context<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button><Button onClick={onEdit} size="small" variant="gray-subtle"><Pencil aria-hidden="true" className="h-4 w-4" />Edit</Button></footer> : null}
  </article>;
}
