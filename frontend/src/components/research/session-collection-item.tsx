import * as React from "react";
import { ArrowRight } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionSummary } from "@/domain/types";
import { cn } from "@/lib/utils";
import { formatSessionDate, formatUpdatedAt, participantName, referenceNames, sessionTypeLabels, workflowStatusLabel } from "./session-presentation";

export interface SessionCollectionItemProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  layout?: "responsive" | "default" | "compact";
  session: SessionSummary;
}

function transcriptLabel(session: SessionSummary) {
  if (session.hasPrimaryTranscript) return "Primary transcript";
  return { none: "No transcript", uploaded: "Uploaded", processing: "Processing", complete: "Ready", failed: "Failed" }[session.transcriptStatus];
}

function statusTone(status: string): NonNullable<BadgeProps["tone"]> {
  if (["complete", "approved", "researcher-reviewed"].includes(status)) return "success";
  if (["failed"].includes(status)) return "error";
  if (["processing", "generating", "uploaded"].includes(status)) return "warning";
  if (["ai-generated"].includes(status)) return "brand";
  return "neutral";
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--air-color-text-secondary)]">{label}</dt><dd className="mt-1 truncate text-sm">{value}</dd></div>;
}

export function SessionCollectionItem({ className, href, layout = "responsive", session, ...props }: SessionCollectionItemProps) {
  const compact = layout === "compact";
  return (
    <article className={cn("air-session-item relative rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 transition-colors", !compact && "md:p-5", className)} {...props}>
      <a aria-label={`Open ${session.title}`} className="air-session-item-link absolute inset-0 z-[1] rounded-[var(--air-radius-lg)] outline-none" href={href} />
      <div className={cn("pointer-events-none relative z-[2]", compact ? "grid gap-4" : "grid gap-5")}>
        <header className={cn("flex gap-3", compact ? "flex-col items-start" : "flex-col sm:flex-row sm:items-start")}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-semibold">{session.title}</h3><Badge showIcon={false}>{sessionTypeLabels[session.type]}</Badge></div>
            <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">{session.participants.length ? session.participants.map(participantName).join(", ") : "No participants"}</p>
          </div>
          <Button asChild className="pointer-events-auto relative z-10 shrink-0" size="small" variant="gray-subtle"><a href={href}>Open session<ArrowRight aria-hidden="true" className="h-4 w-4" /></a></Button>
        </header>
        <dl className={cn("grid gap-x-5 gap-y-4", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4")}>
          <Detail label="Session date" value={formatSessionDate(session.startsAt)} />
          <Detail label="Transcript" value={<Badge showIcon={false} tone={statusTone(session.transcriptStatus)}>{transcriptLabel(session)}</Badge>} />
          <Detail label="Themes" value={<Badge showIcon={false} tone={statusTone(session.themeStatus)}>{workflowStatusLabel(session.themeStatus)}</Badge>} />
          <Detail label="Session Report" value={<Badge showIcon={false} tone={statusTone(session.reportStatus)}>{workflowStatusLabel(session.reportStatus)}</Badge>} />
          <Detail label="Related Records" value={referenceNames(session.relatedRecords)} />
          <Detail label="Common Components" value={referenceNames(session.relatedCommonComponents)} />
          <Detail label="Last updated" value={formatUpdatedAt(session.updatedAt)} />
        </dl>
      </div>
    </article>
  );
}
