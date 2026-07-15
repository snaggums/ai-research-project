import { Check, Pencil, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionReport as SessionReportValue, SessionReportItemType } from "@/domain/types";
import { SessionReportItem } from "./session-report-item";
import { reportItemLabels, reportStatusLabels, reportStatusTone } from "./synthesis-presentation";

const sectionOrder: SessionReportItemType[] = ["requirement", "decision", "action-item", "open-question", "key-insight"];
const sectionHeadings: Record<SessionReportItemType, string> = {
  requirement: "Requirements",
  decision: "Decisions",
  "action-item": "Action Items",
  "open-question": "Open Questions",
  "key-insight": "Key Insights",
};

export interface SessionReportProps {
  layout?: "default" | "compact";
  onApprove?: () => void;
  onCreateRevision?: () => void;
  onEdit?: () => void;
  onOpenContext?: (itemId: string) => void;
  onRegenerate?: () => void;
  onReview?: () => void;
  report: SessionReportValue;
}

export function SessionReport({ layout = "default", onApprove, onCreateRevision, onEdit, onOpenContext, onRegenerate, onReview, report }: SessionReportProps) {
  const isApproved = report.status === "approved";
  const isSuperseded = report.status === "superseded";
  return <article className="grid gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-6">
    <header className="grid gap-3 sm:grid-cols-[1fr_auto]"><div><h2 className="text-2xl font-semibold">Session Report</h2><p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Generated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))}</p></div><Badge className="self-start" showIcon={false} tone={reportStatusTone(report.status)}>{reportStatusLabels[report.status]}</Badge></header>
    <section className="grid gap-3 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4"><h3 className="font-semibold">Session Information</h3><dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-[var(--air-color-text-secondary)]">Session</dt><dd className="font-medium">{report.sessionTitle}</dd></div><div><dt className="text-[var(--air-color-text-secondary)]">Type</dt><dd>{report.sessionType}</dd></div><div><dt className="text-[var(--air-color-text-secondary)]">Date</dt><dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(report.sessionDate))}</dd></div><div><dt className="text-[var(--air-color-text-secondary)]">Duration</dt><dd>{report.durationMinutes ? `${report.durationMinutes} minutes` : "Not recorded"}</dd></div></dl></section>
    <section className="grid gap-3"><h3 className="text-lg font-semibold">Session Participants</h3><div className="overflow-x-auto"><table className="w-full min-w-[42rem] border-collapse text-left text-sm"><thead><tr className="border-b border-[var(--air-color-border-default)]"><th className="p-3">Participant</th><th className="p-3">Role</th><th className="p-3">Organization</th><th className="p-3">Notes</th></tr></thead><tbody>{report.participants.map((participant) => <tr className="border-b border-[var(--air-color-border-default)]" key={participant.id}><td className="p-3 font-medium">{participant.name}</td><td className="p-3">{participant.role ?? "—"}</td><td className="p-3">{participant.organization ?? "—"}</td><td className="p-3 text-[var(--air-color-text-secondary)]">{participant.notes ?? "—"}</td></tr>)}</tbody></table></div></section>
    <section className="grid gap-2"><h3 className="text-lg font-semibold">Executive Summary</h3><p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">{report.executiveSummary}</p></section>
    {sectionOrder.map((type) => { const items = report.items.filter((item) => item.type === type); return <section className="grid gap-3" key={type}><h3 className="text-lg font-semibold">{sectionHeadings[type]}</h3>{items.length ? items.map((item) => <SessionReportItem item={item} key={item.id} layout={layout} onEdit={onEdit} onOpenContext={() => onOpenContext?.(item.id)} showActions={!isSuperseded} />) : <p className="text-sm text-[var(--air-color-text-secondary)]">No {reportItemLabels[type].toLowerCase()} items were identified.</p>}</section>; })}
    <section className="grid gap-2"><h3 className="text-lg font-semibold">Detailed Notes</h3><p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">{report.detailedNotes}</p></section>
    <footer className="flex flex-wrap gap-2">{report.status === "ai-generated" ? <Button onClick={onReview} size="small">Review report</Button> : null}{report.status === "researcher-reviewed" ? <Button onClick={onApprove} size="small"><Check aria-hidden="true" className="h-4 w-4" />Approve report</Button> : null}{!isSuperseded ? <Button onClick={onEdit} size="small" variant="gray-subtle"><Pencil aria-hidden="true" className="h-4 w-4" />Edit report</Button> : null}{!isApproved && !isSuperseded ? <Button onClick={onRegenerate} size="small" variant="gray-subtle"><RefreshCw aria-hidden="true" className="h-4 w-4" />Regenerate</Button> : null}{isApproved || isSuperseded ? <Button onClick={onCreateRevision} size="small" variant="gray-subtle">Create revision</Button> : null}</footer>
  </article>;
}
