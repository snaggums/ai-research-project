import * as React from "react";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";

import { EmptyState, EntityCollection, PageHeader, SharedRouteState } from "@/components/application";
import {
  AskRecordWorkspace,
  type AskRecordWorkspaceProps,
} from "@/components/research/ask-record-workspace";
import {
  RecordKnowledgeWorkspace,
  type RecordKnowledgeWorkspaceState,
} from "@/components/research/record-knowledge-workspace";
import {
  RecordCodeWorkspace,
} from "@/components/research/record-code-workspace";
import type { RecordCodeCollectionState } from "@/components/research/record-code-collection";
import { RecordListItem } from "@/components/research/record-list-item";
import { RecordSummary } from "@/components/research/record-summary";
import { RecordSynthesisResults } from "@/components/research/record-synthesis-results";
import { RecordSynthesisScopeSummary } from "@/components/research/record-synthesis-scope-summary";
import type {
  RecordCodeDetailValue,
  RecordCodeSortValue,
  RecordCodeSupportingHighlightValue,
} from "@/components/research/record-code-types";
import { sortRecordCodeValues } from "@/components/research/record-code-utils";
import { SessionCollectionItem } from "@/components/research/session-collection-item";
import { TranscriptContextPassage } from "@/components/research/transcript-context-passage";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs } from "@/components/ui/tabs";
import type {
  RecordSummary as RecordSummaryValue,
  LifecycleStatus,
  RecordKnowledge,
  RecordSynthesis,
  RecordSynthesisScope,
  SessionSummary,
  TranscriptContext,
} from "@/domain/types";

export interface RecordsCollectionViewProps {
  onOpenRecord?: (recordId: string) => void;
  onRetry?: () => void;
  recordRootPath?: string;
  records: RecordSummaryValue[];
  state?: "ready" | "loading" | "empty" | "error";
}

export function RecordsCollectionView({ onOpenRecord, onRetry, recordRootPath = "/records", records, state = "ready" }: RecordsCollectionViewProps) {
  return <div className="grid gap-6">
    <PageHeader breadcrumbs={[{ label: "Records" }]} description="Review approved Requirements, Decisions, and Action Items collected across Sessions." title="Records" />
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
      <div className="grid gap-4">{records.map((record) => <RecordListItem href={`${recordRootPath}/${record.id}`} key={record.id} onOpen={onOpenRecord ? (event) => { event.preventDefault(); onOpenRecord(record.id); } : undefined} record={record} />)}</div>
    </EntityCollection>
  </div>;
}

export interface RecordDetailViewProps {
  activeView?: "overview" | "knowledge" | "transcript-codes" | "ask-record";
  askRecordProps?: AskRecordWorkspaceProps;
  generating?: boolean;
  knowledgeState?: RecordKnowledgeWorkspaceState;
  knowledge?: RecordKnowledge;
  onGenerate?: () => void;
  onOpenInTranscriptCoding?: (highlight: RecordCodeSupportingHighlightValue) => void;
  onOpenSynthesis?: () => void;
  onOpenEvidence?: (itemId: string) => void;
  onRetryRecordCodes?: () => void;
  onRetryKnowledge?: () => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  onRetry?: () => void;
  onViewChange?: (view: "overview" | "knowledge" | "transcript-codes" | "ask-record") => void;
  record?: RecordSummaryValue;
  recordCodeSessionCount?: number;
  recordCodes?: RecordCodeDetailValue[];
  recordCodeState?: RecordCodeCollectionState;
  recordRootPath?: string;
  routeState?: "ready" | "loading" | "error" | "not-found";
  scope?: RecordSynthesisScope;
  sessions: SessionSummary[];
  synthesis?: RecordSynthesis;
  statusUpdatingItemId?: string;
}

export function RecordDetailView({
  activeView = "overview",
  askRecordProps,
  knowledgeState,
  knowledge: recordKnowledge,
  onOpenEvidence,
  onOpenInTranscriptCoding,
  onRetry,
  onRetryKnowledge,
  onRetryRecordCodes,
  onViewChange,
  record,
  recordCodeSessionCount = 0,
  recordCodes = [],
  recordCodeState,
  recordRootPath = "/records",
  routeState = "ready",
  scope,
  sessions,
}: RecordDetailViewProps) {
  const [knowledgeQuery, setKnowledgeQuery] = React.useState("");
  const [recordCodeQuery, setRecordCodeQuery] = React.useState("");
  const [recordCodeSort, setRecordCodeSort] = React.useState<RecordCodeSortValue>(
    "most-highlights",
  );
  const [selectedRecordCodeId, setSelectedRecordCodeId] = React.useState<string>();
  const [expandedItemIds, setExpandedItemIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  if (routeState === "loading") return <SharedRouteState state="loading" />;
  if (routeState === "error") return <SharedRouteState onRetry={onRetry} state="recoverable-error" />;
  if (routeState === "not-found" || !record || !scope) return <SharedRouteState returnHref={recordRootPath} state="not-found" />;
  const resolvedKnowledgeState = knowledgeState
    ?? (recordKnowledge
      ? recordKnowledge.items.length
        ? "ready"
        : "empty"
      : "empty");
  const resolvedRecordCodeState = recordCodeState
    ?? (recordCodes.length ? "ready" : "empty");
  const normalizedRecordCodeQuery = recordCodeQuery.trim().toLocaleLowerCase();
  const visibleRecordCodes = resolvedRecordCodeState === "ready"
    ? sortRecordCodeValues(
        recordCodes.filter((code) =>
          code.name.toLocaleLowerCase().includes(normalizedRecordCodeQuery),
        ),
        recordCodeSort,
      )
    : [];
  const selectedRecordCode = recordCodes.find(
    (code) => code.id === selectedRecordCodeId,
  ) ?? recordCodes[0];

  function toggleKnowledgeItem(itemId: string) {
    setExpandedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  const overview = (
    <div className="grid gap-6">
      <RecordSynthesisScopeSummary scope={scope} />
      <EntityCollection countLabel={`${sessions.length} related ${sessions.length === 1 ? "Session" : "Sessions"}`} title="Related Sessions">
        {sessions.length ? <div className="grid gap-4">{sessions.map((session) => <SessionCollectionItem href={`/projects/${session.projectId}/sessions/${session.id}/overview`} key={session.id} session={session} />)}</div> : <EmptyState description="Assign this Record from a Session form to include that Session here." title="No related Sessions" />}
      </EntityCollection>
    </div>
  );

  const knowledge = (
    <RecordKnowledgeWorkspace
      expandedItemIds={expandedItemIds}
      items={recordKnowledge?.items ?? []}
      onOpenEvidence={onOpenEvidence}
      onQueryChange={setKnowledgeQuery}
      onRetry={onRetryKnowledge}
      onToggleItem={toggleKnowledgeItem}
      query={knowledgeQuery}
      state={resolvedKnowledgeState}
    />
  );
  const transcriptCodes = (
    <RecordCodeWorkspace
      codes={visibleRecordCodes}
      collectionState={resolvedRecordCodeState}
      comparisonState={
        resolvedRecordCodeState === "error"
          ? "error"
          : resolvedRecordCodeState === "loading"
            ? "loading"
            : "ready"
      }
      headingLevel="h2"
      onClearSearch={() => setRecordCodeQuery("")}
      onOpenInTranscriptCoding={onOpenInTranscriptCoding}
      onQueryChange={setRecordCodeQuery}
      onRetryCollection={onRetryRecordCodes}
      onRetryComparison={onRetryRecordCodes}
      onSelectCode={setSelectedRecordCodeId}
      onSortChange={setRecordCodeSort}
      onViewRelatedSessions={() => onViewChange?.("overview")}
      query={recordCodeQuery}
      selectedCode={selectedRecordCode}
      sessionCount={recordCodeSessionCount}
      sort={recordCodeSort}
      totalCodeCount={recordCodes.length}
    />
  );
  const askRecord = askRecordProps ? (
    <AskRecordWorkspace {...askRecordProps} />
  ) : null;

  return <div className="grid gap-6">
    <PageHeader
      breadcrumbs={[{ href: recordRootPath, label: "Records" }, { label: record.name }]}
      description="Approved Requirements, Decisions, and Action Items collected exactly from Session Reports."
      title={record.name}
    />
    <RecordSummary record={record} />
    <Tabs
      aria-label="Record views"
      items={[
        { content: overview, label: "Overview", value: "overview" },
        { content: knowledge, label: "Knowledge", value: "knowledge" },
        {
          content: transcriptCodes,
          label: "Transcript codes",
          value: "transcript-codes",
        },
        ...(askRecord
          ? [{ content: askRecord, label: "Ask this record", value: "ask-record" }]
          : []),
      ]}
      onValueChange={(value) =>
        onViewChange?.(
          value as "overview" | "knowledge" | "transcript-codes" | "ask-record",
        )
      }
      value={activeView}
    />
  </div>;
}

export type RecordSynthesisViewState = "empty" | "insufficient" | "processing" | "results" | "failed";

export interface RecordSynthesisViewProps {
  onGenerate: () => void;
  onOpenEvidence?: (itemId: string) => void;
  onStatusChange?: (itemId: string, status: LifecycleStatus) => void;
  onRetry?: () => void;
  record: RecordSummaryValue;
  recordRootPath?: string;
  scope: RecordSynthesisScope;
  state: RecordSynthesisViewState;
  synthesis?: RecordSynthesis;
  statusUpdatingItemId?: string;
}

export function RecordSynthesisView({ onGenerate, onOpenEvidence, onRetry, onStatusChange, record, recordRootPath = "/records", scope, state, statusUpdatingItemId, synthesis }: RecordSynthesisViewProps) {
  const header = <PageHeader breadcrumbs={[{ href: recordRootPath, label: "Records" }, { href: `${recordRootPath}/${record.id}`, label: record.name }, { label: "Synthesis" }]} description="Generate and review consolidated Requirements, Decisions, and Action Items across eligible Sessions." title={`${record.name} synthesis`} />;
  const generateLabel = synthesis ? "Regenerate synthesis" : "Generate synthesis";
  return <div className="grid gap-6">
    {header}
    <RecordSummary layout="compact" record={record} />
    <RecordSynthesisScopeSummary scope={scope} />
    {state === "processing" ? <section aria-live="polite" className="grid min-h-64 place-items-center rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6" role="status"><div className="grid max-w-lg justify-items-center gap-4 text-center"><Spinner label="Generating Record synthesis" size="medium" /><h2 className="text-xl font-semibold">Generating Record synthesis</h2><p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">AIR is consolidating eligible Session Reports. You can leave this page without losing the run.</p></div></section> : null}
    {state === "insufficient" ? <section className="grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"><Alert message={`At least ${scope.minimumEligibleSessions} eligible Session Reports are required. This Record currently has ${scope.includedSessions.length}.`} size="large" title="More research is required" tone="warning" /><Button asChild className="justify-self-start" size="small" variant="gray-subtle"><a href={`${recordRootPath}/${record.id}`}>Return to record</a></Button></section> : null}
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
  recordRootPath?: string;
  sessionTitle?: string;
  sourceType?: "knowledge" | "synthesis";
  state?: "ready" | "loading" | "error" | "not-found";
}

export function RecordEvidenceDetailView({ context, evidenceId, itemTitle, onRetry, record, recordRootPath = "/records", sessionTitle, sourceType = "knowledge", state = "ready" }: RecordEvidenceDetailViewProps) {
  const isSynthesis = sourceType === "synthesis";
  const returnHref = record
    ? isSynthesis
      ? `${recordRootPath}/${record.id}/synthesis`
      : `${recordRootPath}/${record.id}?view=knowledge`
    : recordRootPath;
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <SharedRouteState onRetry={onRetry} returnHref={returnHref} state="recoverable-error" />;
  if (state === "not-found" || !context || !record) return <SharedRouteState returnHref={recordRootPath} state="not-found" />;
  return <div className="grid gap-6">
    <PageHeader
      breadcrumbs={[{ href: recordRootPath, label: "Records" }, { href: `${recordRootPath}/${record.id}`, label: record.name }, { href: returnHref, label: isSynthesis ? "Synthesis" : "Knowledge" }, { label: "Evidence" }]}
      description={isSynthesis ? "Review the cited source passage and its surrounding transcript context." : "Review the approved source passage and its surrounding transcript context."}
      title={isSynthesis ? "Synthesis evidence" : "Record Knowledge evidence"}
    />
    <Button asChild className="justify-self-start" size="small" variant="text"><a href={returnHref}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to {isSynthesis ? "Synthesis" : "Knowledge"}</a></Button>
    <article className="grid gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6">
        <header><p className="text-xs font-semibold uppercase tracking-wide text-[var(--air-color-text-secondary)]">{sessionTitle ?? "Source Session"}</p><h2 className="mt-1 text-2xl font-semibold">{itemTitle ?? (isSynthesis ? "Synthesis item evidence" : "Record Knowledge evidence")}</h2><p className="mt-2 text-sm text-[var(--air-color-text-secondary)]">Evidence ID: {evidenceId}</p></header>
      <TranscriptContextPassage context={context} />
    </article>
  </div>;
}
