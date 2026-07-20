import { Badge } from "@/components/ui/badge";
import type { SessionReportItem } from "@/domain/types";
import { reportItemLabels, reportItemTone } from "./synthesis-presentation";

export interface SessionReportEvidenceProps {
  item: SessionReportItem;
}

export function SessionReportEvidence({ item }: SessionReportEvidenceProps) {
  return <section aria-labelledby="session-report-evidence-heading" className="grid gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-6">
    <header className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold" id="session-report-evidence-heading">Evidence</h2>
        <Badge showIcon={false}>{item.evidence.length} {item.evidence.length === 1 ? "excerpt" : "excerpts"}</Badge>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">{item.summary}</p>
        </div>
        <Badge showIcon={false} tone={reportItemTone(item.type)}>{reportItemLabels[item.type]}</Badge>
      </div>
    </header>
    <div className="grid gap-3">
      {item.evidence.map((evidence) => <article className="grid gap-3 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4" key={evidence.id}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--air-color-text-secondary)]">
          <span>{evidence.speaker} · {evidence.location}</span>
          <span>Relevance {Math.round(evidence.relevance * 100)}%</span>
        </div>
        <blockquote className="border-l-4 border-l-[var(--air-color-interaction-accent)] pl-4 text-sm leading-6">“{evidence.excerpt}”</blockquote>
        <p className="text-xs text-[var(--air-color-text-secondary)]">{evidence.documentName}</p>
      </article>)}
    </div>
  </section>;
}
