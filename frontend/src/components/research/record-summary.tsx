import * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { RecordSummary as RecordSummaryValue } from "@/domain/types";
import { cn } from "@/lib/utils";
import {
  formatRecordSynthesisDate,
  recordReadinessLabels,
  recordReadinessTone,
} from "./record-presentation";

export interface RecordSummaryProps extends React.HTMLAttributes<HTMLElement> {
  layout?: "default" | "compact";
  record: RecordSummaryValue;
}

export function RecordSummary({ className, layout = "default", record, ...props }: RecordSummaryProps) {
  const compact = layout === "compact";
  const metadata = [
    { label: "Related Sessions", value: `${record.relatedSessionCount} related ${record.relatedSessionCount === 1 ? "Session" : "Sessions"}` },
    { label: "Approved Session Reports", value: `${record.approvedReportCount ?? record.eligibleSessionCount} approved ${(record.approvedReportCount ?? record.eligibleSessionCount) === 1 ? "report" : "reports"}` },
    { label: "Record Knowledge", value: record.knowledgeUpdatedAt ? `Updated ${formatRecordSynthesisDate(record.knowledgeUpdatedAt)}` : "No approved knowledge yet" },
  ];

  return (
    <section className={cn("rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6", className)} {...props}>
      <header className={cn("flex gap-4", compact ? "flex-col" : "flex-wrap items-start justify-between")}>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold">{record.name}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)]">{record.description}</p>
        </div>
        <Badge showIcon={false} tone={recordReadinessTone(record.readiness)}>{recordReadinessLabels[record.readiness]}</Badge>
      </header>
      <div className="my-5 border-t border-[var(--air-color-border-default)]" />
      <dl className={cn("grid gap-4", !compact && "md:grid-cols-3")}>
        {metadata.map((item) => (
          <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4" key={item.label}>
            <dt className="text-xs text-[var(--air-color-text-secondary)]">{item.label}</dt>
            <dd className="mt-2 text-sm">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
