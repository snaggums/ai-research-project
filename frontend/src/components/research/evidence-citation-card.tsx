import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EvidenceCitationRelevance = "supporting" | "partial";
export type EvidenceCitationContext = "session" | "record";

export interface EvidenceCitation {
  excerpt: string;
  id: string;
  project?: string;
  reference: number;
  relevance?: EvidenceCitationRelevance;
  session?: string;
  speakerTimestamp: string;
  transcript: string;
  transcriptHref?: string;
}

export interface EvidenceCitationCardProps
  extends React.HTMLAttributes<HTMLElement> {
  anchorId?: string;
  citation: EvidenceCitation;
  context?: EvidenceCitationContext;
  onOpenTranscriptContext?: (citation: EvidenceCitation) => void;
}

export function EvidenceCitationCard({
  anchorId,
  citation,
  className,
  context = "record",
  onOpenTranscriptContext,
  ...props
}: EvidenceCitationCardProps) {
  const partial = citation.relevance === "partial";
  const cardId = anchorId ?? `citation-${citation.reference}`;
  const headingId = `${cardId}-heading`;
  const openLabel = `Open transcript context for citation ${citation.reference}`;
  const openContext = onOpenTranscriptContext
    ? (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onOpenTranscriptContext(citation);
      }
    : undefined;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "grid gap-6 rounded-[var(--air-radius-lg)] border bg-[var(--air-color-bg-surface)] p-5 md:p-6",
        partial
          ? "border-[var(--air-color-status-warning-border)]"
          : "border-[var(--air-color-border-default)]",
        className,
      )}
      id={cardId}
      {...props}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold" id={headingId}>
          [{citation.reference}] Citation
        </h4>
        <Badge showIcon={false} tone={partial ? "warning" : "brand"}>
          {partial ? "Partially relevant" : "Supporting evidence"}
        </Badge>
      </header>

      <dl className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
        {context === "record" && citation.project ? (
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase text-[var(--air-color-text-muted)]">Project</dt>
            <dd className="mt-2 break-words">{citation.project}</dd>
          </div>
        ) : null}
        {context === "record" && citation.session ? (
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase text-[var(--air-color-text-muted)]">Session</dt>
            <dd className="mt-2 break-words">{citation.session}</dd>
          </div>
        ) : null}
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase text-[var(--air-color-text-muted)]">Transcript</dt>
          <dd className="mt-2 break-words">{citation.transcript}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase text-[var(--air-color-text-muted)]">Speaker / timestamp</dt>
          <dd className="mt-2 break-words">{citation.speakerTimestamp}</dd>
        </div>
      </dl>

      <blockquote className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-base leading-6">
        “{citation.excerpt}”
      </blockquote>

      {citation.transcriptHref ? (
        <Button asChild className="justify-self-start" size="small" variant="gray-subtle">
          <a
            aria-label={openLabel}
            href={citation.transcriptHref}
            onClick={openContext}
          >
            Open transcript context
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </Button>
      ) : onOpenTranscriptContext ? (
        <Button
          aria-label={openLabel}
          className="justify-self-start"
          onClick={() => onOpenTranscriptContext(citation)}
          size="small"
          variant="gray-subtle"
        >
          Open transcript context
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : null}
    </article>
  );
}
