import * as React from "react";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RecordSummary } from "@/domain/types";
import { cn } from "@/lib/utils";
import {
  formatRecordSynthesisDate,
  recordReadinessLabels,
  recordReadinessTone,
} from "./record-presentation";

export interface RecordListItemProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  layout?: "default" | "compact";
  onOpen?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  record: RecordSummary;
}

export function RecordListItem({ className, href, layout = "default", onOpen, record, ...props }: RecordListItemProps) {
  const compact = layout === "compact";
  return (
    <article
      className={cn(
        "air-record-list-item relative rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 transition-colors",
        compact && "p-4",
        className,
      )}
      {...props}
    >
      <a
        aria-label={`Open ${record.name}`}
        className="air-record-list-item-link absolute inset-0 z-[1] rounded-[var(--air-radius-lg)] outline-none"
        href={href}
        onClick={onOpen}
      />
      <div className="pointer-events-none relative z-[2]">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-semibold">{record.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge showIcon={false} tone={recordReadinessTone(record.readiness)}>
              {recordReadinessLabels[record.readiness]}
            </Badge>
            <span className="inline-flex min-h-11 items-center gap-1 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] px-3 text-sm font-medium">
              Open record <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>
        </header>
        <dl className={cn("mt-6 grid gap-4", !compact && "sm:grid-cols-3")}>
          <div><dt className="text-xs text-[var(--air-color-text-secondary)]">Related Sessions</dt><dd className="mt-2 text-sm">{record.relatedSessionCount} related Sessions</dd></div>
          <div><dt className="text-xs text-[var(--air-color-text-secondary)]">Approved Session Reports</dt><dd className="mt-2 text-sm">{record.approvedReportCount ?? record.eligibleSessionCount} approved {(record.approvedReportCount ?? record.eligibleSessionCount) === 1 ? "report" : "reports"}</dd></div>
          <div><dt className="text-xs text-[var(--air-color-text-secondary)]">Knowledge updated</dt><dd className="mt-2 text-sm">{record.knowledgeUpdatedAt ? formatRecordSynthesisDate(record.knowledgeUpdatedAt, false) : "No approved knowledge yet"}</dd></div>
        </dl>
      </div>
    </article>
  );
}
