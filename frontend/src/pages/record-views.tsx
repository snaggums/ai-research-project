import * as React from "react";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";

import { EmptyState, EntityCollection, PageHeader, SharedRouteState } from "@/components/application";
import { RecordListItem } from "@/components/research/record-list-item";
import { RecordSummary } from "@/components/research/record-summary";
import { RecordSynthesisResults } from "@/components/research/record-synthesis-results";
import { RecordSynthesisScopeSummary } from "@/components/research/record-synthesis-scope-summary";
import { SessionCollectionItem } from "@/components/research/session-collection-item";
import { TranscriptContextPassage } from "@/components/research/transcript-context-passage";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type {
  RecordSummary as RecordSummaryValue,
  LifecycleStatus,
  RecordSynthesis,
  RecordSynthesisScope,
  SessionSummary,
  TranscriptContext,
} from "@/domain/types";

export interface RecordsCollectionViewProps {
  onOpenRecord?: (recordId: string) => void;
  onRetry?: () => void;
  records: RecordSummaryValue[];
  state?: "ready" | "loading" | "empty" | "error";
}

export function RecordsCollectionView({ onOpenRecord, onRetry, records, state = "ready" }: RecordsCollectionViewProps) {
  return <div className="grid gap-6">
    <PageHeader breadcrumbs={[{ label: "Records" }]} description="Review the fixed Record catalog and synthesize eligible research across Sessions." title="Records" />
    <EntityCollection
      countLabel={state === "loading" ? "Loading records..." : `${records.length} ${records.length === 1 ? "record" : "records"}`}
      countPosition="below"
      state={state}
      stateContent={state === "empty"
        ? <EmptyState description="The fixed Record catalog is unavailable. Refresh or contact the workspace administrator." title="No Records available" />
        : state === "error"
          ? <div className="mx-auto grid max-w-xl gap-3 py-16"><Alert message="Check your connection and try again. Existing research data has not been changed." size="large" title="Records could not be loaded" tone="error" />{onRetry ? <Button className="mx-auto" onClick={onRetry} size="small">Retry</Button> : null}</div>
          : undefined}
      title="All records"
    >
      <div className="grid gap-4">{records.map((record) => <RecordListItem href={`/records/${record.id}`} key={record.id} onOpen={onOpenRecord ? (event) => { event.preventDefault(); onOpenRecord(record.id); } : undefined} record={record} />)}</div>
    </EntityCollection>
  </div>;
}

export interface RecordDetailViewProps {
  generating?: boolean;
  onGenerate?: () => void;
  onOpenSynthesis?: () => void;
  onOpenEvidence?: (itemId: string) => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  onRetry?: () => void;
  record?: RecordSummaryValue;
  routeState?: "ready" | "loading" | "error" | "not-found";
  scope?: RecordSynthesisScope;
  sessions: SessionSummary[];
  synthesis?: RecordSynthesis;
  statusUpdatingItemId?: string;
}

export function RecordDetailView({ generating = false, onGenerate, onOpenEvidence, onOpenSynthesis, onRetry, onStatusChange, record, routeState = "ready", scope, sessions, statusUpdatingItemId, synthesis }: RecordDetailViewProps) {
  if (routeState === "loading") return <SharedRouteState state="loading" />;
  if (routeState === "error") return <SharedRouteState onRetry={onRetry} state="recoverable-error" />;
  if (routeState === "not-found" || !record || !scope) return <SharedRouteState returnHref="/records" state="not-found" />;
  const eligible = scope.includedSessions.length >= scope.minimumEligibleSessions;
  return <div className="grid gap-6">
    <PageHeader
      actions={synthesis
        ? <div className="flex flex-wrap gap-2">{onOpenSynthesis ? <Button onClick={onOpenSynthesis} size="small" variant="gray-subtle">Review synthesis</Button> : null}{onGenerate ? <Button disabled={!eligible || generating} onClick={onGenerate} size="small"><Sparkles aria-hidden="true" className="h-4 w-4" />{generating ? "Regenerating…" : "Regenerate synthesis"}</Button> : null}</div>
        : onGenerate
          ? <Button disabled={!eligible || generating} onClick={onGenerate} size="small"><Sparkles aria-hidden="true" className="h-4 w-4" />{generating ? "Generating…" : "Generate synthesis"}</Button>
          : onOpenSynthesis
            ? <Button onClick={onOpenSynthesis} size="small"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate synthesis</Button>
            : <Button asChild size="small"><a href={`/records/${record.id}/synthesis`}><Sparkles aria-hidden="true" className="h-4 w-4" />{synthesis ? "Review synthesis" : "Generate synthesis"}</a></Button>}
      breadcrumbs={[{ href: "/records", label: "Records" }, { label: record.name }]}
      description="Review related Sessions, automatic eligibility, and the latest consolidated research outputs."
      title={record.name}
    />
    <RecordSummary record={record} />
    <RecordSynthesisScopeSummary scope={scope} />
    <EntityCollection countLabel={`${sessions.length} related ${sessions.length === 1 ? "Session" : "Sessions"}`} title="Related Sessions">
      {sessions.length ? <div className="grid gap-4">{sessions.map((session) => <SessionCollectionItem href={`/projects/${session.projectId}/sessions/${session.id}/overview`} key={session.id} session={session} />)}</div> : <EmptyState description="Assign this Record from a Session form to include that Session here." title="No related Sessions" />}
    </EntityCollection>
    {synthesis?.status === "complete" ? <RecordSynthesisResults onOpenEvidence={onOpenEvidence} onStatusChange={onStatusChange} statusUpdatingItemId={statusUpdatingItemId} synthesis={synthesis} /> : null}
  </div>;
}

export type RecordSynthesisViewState = "empty" | "insufficient" | "processing" | "results" | "failed";

export interface RecordSynthesisViewProps {
  onGenerate: () => void;
  onOpenEvidence?: (itemId: string) => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  onRetry?: () => void;
  record: RecordSummaryValue;
  scope: RecordSynthesisScope;
  state: RecordSynthesisViewState;
  synthesis?: RecordSynthesis;
  statusUpdatingItemId?: string;
}

export function RecordSynthesisView({ onGenerate, onOpenEvidence, onRetry, onStatusChange, record, scope, state, statusUpdatingItemId, synthesis }: RecordSynthesisViewProps) {
  const header = <PageHeader breadcrumbs={[{ href: "/records", label: "Records" }, { href: `/records/${record.id}`, label: record.name }, { label: "Synthesis" }]} description="Generate and review consolidated Requirements, Decisions, and Action Items across eligible Sessions." title={`${record.name} synthesis`} />;
  const generateLabel = synthesis ? "Regenerate synthesis" : "Generate synthesis";
  return <div className="grid gap-6">
    {header}
    <RecordSummary layout="compact" record={record} />
    <RecordSynthesisScopeSummary scope={scope} />
    {state === "processing" ? <section aria-live="polite" className="grid min-h-64 place-items-center rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6" role="status"><div className="grid max-w-lg justify-items-center gap-4 text-center"><Spinner label="Generating Record synthesis" size="medium" /><h2 className="text-xl font-semibold">Generating Record synthesis</h2><p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">AIR is consolidating eligible Session Reports. You can leave this page without losing the run.</p></div></section> : null}
    {state === "insufficient" ? <section className="grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"><Alert message={`At least ${scope.minimumEligibleSessions} eligible Session Reports are required. This Record currently has ${scope.includedSessions.length}.`} size="large" title="More research is required" tone="warning" /><Button asChild className="justify-self-start" size="small" variant="gray-subtle"><a href={`/records/${record.id}`}>Return to record</a></Button></section> : null}
    {state === "empty" ? <EmptyState description="AIR will automatically use every eligible Session Report related to this Record." primaryAction={<Button onClick={onGenerate} size="small"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate synthesis</Button>} title="No Record synthesis yet" /> : null}
    {state === "failed" ? <section className="grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"><Alert message={synthesis?.errorMessage ?? "The synthesis run failed. Eligible Session Reports remain unchanged and can be retried."} size="large" title="Record synthesis failed" tone="error" /><Button className="justify-self-start" onClick={onRetry ?? onGenerate} size="small"><RefreshCw aria-hidden="true" className="h-4 w-4" />Retry synthesis</Button></section> : null}
    {state === "results" && synthesis ? <><div className="flex justify-end"><Button onClick={onGenerate} size="small" variant="gray-subtle"><Sparkles aria-hidden="true" className="h-4 w-4" />{generateLabel}</Button></div><RecordSynthesisResults onOpenEvidence={onOpenEvidence} onStatusChange={onStatusChange} statusUpdatingItemId={statusUpdatingItemId} synthesis={synthesis} /></> : null}
  </div>;
}

export interface RecordEvidenceDetailViewProps {
  context?: TranscriptContext;
  evidenceId: string;
  itemTitle?: string;
  onRetry?: () => void;
  record?: RecordSummaryValue;
  sessionTitle?: string;
  state?: "ready" | "loading" | "error" | "not-found";
}

export function RecordEvidenceDetailView({ context, evidenceId, itemTitle, onRetry, record, sessionTitle, state = "ready" }: RecordEvidenceDetailViewProps) {
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <SharedRouteState onRetry={onRetry} returnHref={record ? `/records/${record.id}/synthesis` : "/records"} state="recoverable-error" />;
  if (state === "not-found" || !context || !record) return <SharedRouteState returnHref="/records" state="not-found" />;
  return <div className="grid gap-6">
    <PageHeader breadcrumbs={[{ href: "/records", label: "Records" }, { href: `/records/${record.id}`, label: record.name }, { href: `/records/${record.id}/synthesis`, label: "Synthesis" }, { label: "Evidence" }]} description="Review the cited source passage and its surrounding transcript context." title="Synthesis evidence" />
    <Button asChild className="justify-self-start" size="small" variant="text"><a href={`/records/${record.id}/synthesis`}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Synthesis</a></Button>
    <article className="grid gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6">
      <header><p className="text-xs font-semibold uppercase tracking-wide text-[var(--air-color-text-secondary)]">{sessionTitle ?? "Source Session"}</p><h2 className="mt-1 text-2xl font-semibold">{itemTitle ?? "Synthesis item evidence"}</h2><p className="mt-2 text-sm text-[var(--air-color-text-secondary)]">Evidence ID: {evidenceId}</p></header>
      <TranscriptContextPassage context={context} />
    </article>
  </div>;
}
