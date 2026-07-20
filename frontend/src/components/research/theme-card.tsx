import { Pencil, SearchCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionTheme } from "@/domain/types";
import { themeStatusLabels, themeStatusTone } from "./synthesis-presentation";

export interface ThemeCardProps {
  layout?: "default" | "compact";
  onEdit?: () => void;
  onReject?: () => void;
  onReview?: () => void;
  showActions?: boolean;
  showEvidence?: boolean;
  theme: SessionTheme;
}

export function ThemeCard({ layout = "default", onEdit, onReject, onReview, showActions = true, showEvidence = true, theme }: ThemeCardProps) {
  const reviewLabel = theme.status === "rejected" ? "Review theme" : "Review theme";
  const canReject = theme.status === "ai-generated" || theme.status === "researcher-reviewed";
  const canEdit = theme.status !== "approved";
  return <article className="grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1"><h3 className="text-lg font-semibold text-[var(--air-color-text-primary)]">{theme.name}</h3><p className="mt-1 text-sm leading-6 text-[var(--air-color-text-secondary)]">{theme.summary}</p></div>
      <Badge showIcon={false} tone={themeStatusTone(theme.status)}>{themeStatusLabels[theme.status]}</Badge>
    </header>
    <p className="text-xs text-[var(--air-color-text-secondary)]">{theme.sourceLabel} · Confidence {theme.confidence.toFixed(2)}</p>
    {showEvidence ? <button className="flex w-full items-center justify-between gap-3 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] px-3 py-3 text-left text-sm outline-none hover:bg-[var(--air-color-bg-active)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2" onClick={onReview} type="button"><span><span className="font-medium">Supporting evidence</span><span className="text-[var(--air-color-text-secondary)]"> · {theme.evidence.length} {theme.evidence.length === 1 ? "excerpt" : "excerpts"}</span>{layout === "default" && theme.evidence[0] ? <span className="mt-1 block line-clamp-2 text-[var(--air-color-text-secondary)]">“{theme.evidence[0].excerpt}”</span> : null}</span><SearchCheck aria-hidden="true" className="h-5 w-5 shrink-0" /></button> : null}
    {showActions && theme.status !== "approved" ? <footer className="flex flex-wrap gap-2">
      <Button onClick={onReview} size="small">{reviewLabel}</Button>
      {canEdit ? <Button onClick={onEdit} size="small" variant="gray-subtle"><Pencil aria-hidden="true" className="h-4 w-4" />Edit</Button> : null}
      {canReject ? <Button onClick={onReject} size="small" variant="danger-subtle"><X aria-hidden="true" className="h-4 w-4" />Reject</Button> : null}
    </footer> : null}
  </article>;
}
