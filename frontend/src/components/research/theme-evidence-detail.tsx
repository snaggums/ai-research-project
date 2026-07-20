import { ArrowUpRight, Check, Pencil, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionTheme, ThemeEvidenceDetail } from "@/domain/types";

export interface ThemeEvidenceDetailProps {
  contextHref: (evidence: ThemeEvidenceDetail) => string;
  layout?: "default" | "compact";
  onApprove?: () => void;
  onEdit?: () => void;
  onOpenContext?: (href: string) => void;
  onReject?: () => void;
  theme: SessionTheme;
}

export function ThemeEvidenceDetail({ contextHref, layout = "default", onApprove, onEdit, onOpenContext, onReject, theme }: ThemeEvidenceDetailProps) {
  return <section aria-labelledby="theme-evidence-heading" className="grid gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-6">
    <header className="grid gap-2"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold" id="theme-evidence-heading">Theme evidence</h2><Badge showIcon={false}>{theme.evidence.length} excerpts</Badge></div><h3 className="text-lg font-semibold">{theme.name}</h3><p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">{theme.summary}</p><p className="text-xs text-[var(--air-color-text-secondary)]">{theme.sourceLabel} · Confidence {theme.confidence.toFixed(2)}</p></header>
    <div className="grid gap-3">{theme.evidence.map((evidence) => { const href = contextHref(evidence); return <article className="grid gap-2 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4" key={evidence.id}><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--air-color-text-secondary)]"><span>{evidence.speaker} · {evidence.location}</span><span>Relevance {evidence.relevance.toFixed(2)}</span></div><blockquote className={layout === "compact" ? "line-clamp-3 text-sm" : "text-sm leading-6"}>“{evidence.excerpt}”</blockquote><p className="text-xs text-[var(--air-color-text-secondary)]">{evidence.documentName}</p><Button asChild className="justify-self-start" size="small" variant="gray-subtle"><a href={href} onClick={onOpenContext ? (event) => { event.preventDefault(); onOpenContext(href); } : undefined}>Open transcript context<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a></Button></article>; })}</div>
    <footer className="flex flex-wrap gap-2"><Button onClick={onApprove} size="small"><Check aria-hidden="true" className="h-4 w-4" />Approve theme</Button><Button onClick={onEdit} size="small" variant="gray-subtle"><Pencil aria-hidden="true" className="h-4 w-4" />Edit theme</Button><Button onClick={onReject} size="small" variant="danger-subtle"><X aria-hidden="true" className="h-4 w-4" />Reject theme</Button></footer>
  </section>;
}
