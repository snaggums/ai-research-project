import * as React from "react";
import { Check, Pencil, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SessionReport as SessionReportValue,
  SessionReportItem as SessionReportItemValue,
  SessionReportItemType,
} from "@/domain/types";
import { SessionReportItem } from "./session-report-item";
import {
  reportItemLabels,
  reportStatusLabels,
  reportStatusTone,
} from "./synthesis-presentation";

const sectionOrder: SessionReportItemType[] = [
  "requirement",
  "decision",
  "action-item",
  "open-question",
  "key-insight",
];

const sectionHeadings: Record<SessionReportItemType, string> = {
  requirement: "Requirements",
  decision: "Decisions",
  "action-item": "Action Items",
  "open-question": "Open Questions",
  "key-insight": "Key Insights",
};

type OwnershipValidationError = {
  fieldLabel: "Decision maker" | "Assignee";
  item: SessionReportItemValue;
};

function requiresOwnershipReview(item: SessionReportItemValue) {
  if (item.type !== "decision" && item.type !== "action-item") return false;
  return item.ownership?.status !== "confirmed"
    && item.ownership?.status !== "confirmed-empty";
}

export interface SessionReportProps {
  layout?: "default" | "compact";
  onApprove?: () => void;
  onCreateRevision?: () => void;
  onEditItem?: (item: SessionReportItemValue) => void;
  onEditReport?: () => void;
  onOpenContext?: (itemId: string) => void;
  onRegenerate?: () => void;
  onReview?: () => void;
  report: SessionReportValue;
}

export function SessionReport({
  layout = "default",
  onApprove,
  onCreateRevision,
  onEditItem,
  onEditReport,
  onOpenContext,
  onRegenerate,
  onReview,
  report,
}: SessionReportProps) {
  const [expandedItemIds, setExpandedItemIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [validationErrors, setValidationErrors] = React.useState<
    OwnershipValidationError[]
  >([]);
  const validationSummaryRef = React.useRef<HTMLDivElement>(null);
  const isApproved = report.status === "approved";
  const isSuperseded = report.status === "superseded";
  const canEdit = !isApproved && !isSuperseded;
  const reviewed = report.status === "researcher-reviewed";
  const reportDate = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })
    .format(new Date(report.generatedAt));

  React.useLayoutEffect(() => {
    if (validationErrors.length) validationSummaryRef.current?.focus();
  }, [validationErrors]);

  function setItemExpanded(itemId: string, expanded: boolean) {
    setExpandedItemIds((current) => {
      const next = new Set(current);
      if (expanded) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  function navigateToValidationError(error: OwnershipValidationError) {
    setItemExpanded(error.item.id, true);
    requestAnimationFrame(() => {
      const target = document.getElementById(
        `session-report-item-${error.item.id}-disclosure`,
      );
      target?.scrollIntoView?.({ block: "center" });
      target?.focus();
    });
  }

  function approveReport() {
    const errors = report.items
      .filter(requiresOwnershipReview)
      .map((item) => ({
        fieldLabel: item.type === "decision"
          ? "Decision maker" as const
          : "Assignee" as const,
        item,
      }));
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    onApprove?.();
  }

  const reportActions = (
    <div className="flex flex-wrap gap-2">
      {report.status === "ai-generated" ? (
        <Button onClick={onReview} size="small">Review report</Button>
      ) : null}
      {reviewed ? (
        <Button onClick={approveReport} size="small">
          <Check aria-hidden="true" className="h-4 w-4" />
          Approve report
        </Button>
      ) : null}
      {canEdit && onEditReport ? (
        <Button onClick={onEditReport} size="small" variant="gray-subtle">
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Edit report
        </Button>
      ) : null}
      {report.status === "ai-generated" && onRegenerate ? (
        <Button onClick={onRegenerate} size="small" variant="text">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Regenerate report
        </Button>
      ) : null}
      {isApproved || isSuperseded ? (
        <Button onClick={onCreateRevision} size="small" variant="gray-subtle">
          Create revision
        </Button>
      ) : null}
    </div>
  );

  return (
    <article className="grid gap-8 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-8">
      <header className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h2 className="text-[1.75rem] font-semibold leading-9 tracking-[-0.5px]">
              Session Report
            </h2>
            <p className="mt-1 text-sm leading-5 text-[var(--air-color-text-muted)]">
              {reviewed
                ? `Reviewed by researcher ${reportDate} · Original AI generation preserved`
                : `Generated ${reportDate}`}
            </p>
          </div>
          <Badge className="self-start" size="large" tone={reportStatusTone(report.status)}>
            {reportStatusLabels[report.status]}
          </Badge>
        </div>
        {reportActions}
      </header>

      {validationErrors.length ? (
        <div
          className="rounded-[var(--air-radius-md)] border border-[var(--air-color-status-error-border)] bg-[var(--air-color-status-error-bg)] p-4 text-[var(--air-color-status-error-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
          ref={validationSummaryRef}
          role="alert"
          tabIndex={-1}
        >
          <h3 className="font-semibold">Resolve ownership before approving</h3>
          <p className="mt-1 text-sm">
            {validationErrors.length} report {validationErrors.length === 1 ? "item needs" : "items need"} review. Confirm a Decision maker or Assignee, or explicitly confirm that none applies.
          </p>
          <ul className="mt-2 grid justify-items-start gap-1 text-sm">
            {validationErrors.map((error) => (
              <li key={error.item.id}>
                <button
                  className="rounded-[var(--air-radius-sm)] text-left font-medium underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
                  onClick={() => navigateToValidationError(error)}
                  type="button"
                >
                  {reportItemLabels[error.item.type]} · {error.item.title} — {error.fieldLabel}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-4">
        <h3 className="text-2xl font-semibold leading-8">Session Participants</h3>
        <div className="overflow-x-auto rounded-[var(--air-radius-sm)] border border-[var(--air-color-border-default)]">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--air-color-bg-subtle)]">
              <tr><th className="p-4 font-medium">Participant</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Organization</th><th className="p-4 font-medium">Notes</th></tr>
            </thead>
            <tbody>
              {report.participants.map((participant) => (
                <tr key={participant.id}>
                  <td className="p-4 text-[var(--air-color-text-secondary)]">{participant.name}</td>
                  <td className="p-4 text-[var(--air-color-text-secondary)]">{participant.role ?? "—"}</td>
                  <td className="p-4 text-[var(--air-color-text-secondary)]">{participant.organization ?? "—"}</td>
                  <td className="p-4 text-[var(--air-color-text-secondary)]">{participant.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-2xl font-semibold leading-8">Executive Summary</h3>
        <p className="leading-6 text-[var(--air-color-text-secondary)]">{report.executiveSummary}</p>
      </section>

      {sectionOrder.map((type) => {
        const items = report.items.filter((item) => item.type === type);
        return (
          <section className="grid gap-4" key={type}>
            <h3 className="text-2xl font-semibold leading-8">{sectionHeadings[type]}</h3>
            {items.length ? items.map((item) => (
              <SessionReportItem
                disclosureId={`session-report-item-${item.id}-disclosure`}
                expanded={expandedItemIds.has(item.id)}
                item={item}
                key={item.id}
                layout={layout}
                onEdit={canEdit && onEditItem ? () => onEditItem(item) : undefined}
                onExpandedChange={(expanded) => setItemExpanded(item.id, expanded)}
                onOpenContext={item.evidence.length && onOpenContext
                  ? () => onOpenContext(item.id)
                  : undefined}
                showActions={!isSuperseded}
              />
            )) : (
              <p className="text-sm text-[var(--air-color-text-secondary)]">
                No {reportItemLabels[type].toLowerCase()} items were identified.
              </p>
            )}
          </section>
        );
      })}

      <section className="grid gap-4">
        <h3 className="text-2xl font-semibold leading-8">Detailed Notes</h3>
        <p className="leading-6 text-[var(--air-color-text-secondary)]">{report.detailedNotes}</p>
      </section>
    </article>
  );
}
