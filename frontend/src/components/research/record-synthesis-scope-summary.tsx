import * as React from "react";
import { CircleCheck, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RecordSynthesisScope } from "@/domain/types";
import { cn } from "@/lib/utils";
import { lifecycleStatusLabels } from "./record-presentation";

export interface RecordSynthesisScopeSummaryProps extends React.HTMLAttributes<HTMLElement> {
  layout?: "default" | "compact";
  requirementsDescription?: React.ReactNode;
  scope: RecordSynthesisScope;
}

export const RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION = "When a Session Report is Approved, its Requirements, Decisions, and Action Items are added to Record Knowledge exactly as written.";

export function RecordSynthesisScopeSummary({ className, layout = "default", requirementsDescription, scope, ...props }: RecordSynthesisScopeSummaryProps) {
  const ready = scope.includedSessions.length > 0;
  const compact = layout === "compact";
  const resolvedRequirementsDescription = requirementsDescription === undefined && !compact
    ? RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION
    : requirementsDescription;
  return (
    <section className={cn("rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6", className)} {...props}>
      <h2 className="text-2xl font-semibold">Knowledge sources</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)]">{scope.description}</p>
      {resolvedRequirementsDescription ? <p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)]">{resolvedRequirementsDescription}</p> : null}
      <div className={cn("mt-5 flex items-start gap-3 p-4", ready ? "bg-[var(--air-color-status-success-bg)] text-[var(--air-color-status-success-text)]" : "bg-[var(--air-color-status-warning-bg)] text-[var(--air-color-status-warning-text)]")}>
        {ready ? <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /> : <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />}
        <div>
          <div className="font-semibold">{ready ? "Approved knowledge available" : "No approved Session Reports yet"}</div>
          <div className="mt-1 text-sm">
            {ready
              ? `${scope.includedSessions.length} approved ${scope.includedSessions.length === 1 ? "Session Report contributes" : "Session Reports contribute"} automatically.`
              : "Approve a Session Report to add its Requirements, Decisions, and Action Items."}
          </div>
        </div>
      </div>
      <div className={cn("mt-5 grid gap-5", !compact && "lg:grid-cols-2")}>
        <section>
          <header className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Approved sources</h3><Badge showIcon={false} tone="success">{scope.includedSessions.length} included</Badge></header>
          <div className="mt-3 grid gap-3">{scope.includedSessions.map((session) => <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4" key={session.id}><div className="font-medium">{session.title}</div><div className="mt-1 text-xs text-[var(--air-color-text-secondary)]">{lifecycleStatusLabels[session.reportStatus]} Session Report</div></div>)}</div>
        </section>
        <section>
          <header className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Waiting for approval</h3><Badge showIcon={false} tone="warning">{scope.excludedSessions.length} waiting</Badge></header>
          <div className="mt-3 grid gap-3">{scope.excludedSessions.length ? scope.excludedSessions.map((session) => <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4" key={session.id}><div className="font-medium">{session.title}</div><div className="mt-1 text-xs text-[var(--air-color-text-secondary)]">{session.reason}</div></div>) : <p className="text-sm text-[var(--air-color-text-secondary)]">No Sessions are excluded.</p>}</div>
        </section>
      </div>
    </section>
  );
}
