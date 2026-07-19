import { useNavigate, useParams } from "react-router-dom";

import { toRecordSummary, toRecordSynthesis, toRecordSynthesisScope } from "@/adapters/records";
import { toSessionSummary } from "@/adapters/sessions";
import { toTranscriptContext } from "@/adapters/transcripts";
import { RecordApiError } from "@/api/records";
import {
  useGenerateRecordSynthesis,
  useLatestRecordSynthesis,
  useRecord,
  useRecords,
  useRecordSessions,
  useRecordSynthesisEligibility,
  useRecordSynthesisEvidence,
  useUpdateRecordSynthesisItem,
} from "@/hooks/useRecords";
import {
  RecordDetailView,
  RecordEvidenceDetailView,
  RecordsCollectionView,
  RecordSynthesisView,
} from "@/pages/record-views";

const notFound = (error: unknown) => error instanceof RecordApiError && error.status === 404;

export function RecordsCollectionRoute() {
  const navigate = useNavigate();
  const records = useRecords();
  return <RecordsCollectionView
    onOpenRecord={(recordId) => navigate(`/records/${recordId}`)}
    onRetry={() => void records.refetch()}
    records={(records.data ?? []).map(toRecordSummary)}
    state={records.isPending ? "loading" : records.isError ? "error" : records.data?.length ? "ready" : "empty"}
  />;
}

export function RecordDetailRoute() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const record = useRecord(recordId);
  const sessions = useRecordSessions(recordId);
  const eligibility = useRecordSynthesisEligibility(recordId);
  const synthesis = useLatestRecordSynthesis(recordId);
  const updateItem = useUpdateRecordSynthesisItem(recordId);
  const errors = [record.error, sessions.error, eligibility.error, synthesis.error];
  const routeState = errors.some(notFound)
    ? "not-found"
    : record.isPending || sessions.isPending || eligibility.isPending || synthesis.isPending
      ? "loading"
      : errors.some(Boolean)
        ? "error"
        : "ready";
  const synthesisValue = synthesis.data ? toRecordSynthesis(synthesis.data) : undefined;
  return <RecordDetailView
    onOpenEvidence={(itemId) => {
      const evidenceId = synthesisValue?.items.find((item) => item.id === itemId)?.evidenceIds[0];
      if (evidenceId) navigate(`/records/${recordId}/synthesis/items/${itemId}/evidence/${evidenceId}`);
    }}
    onRetry={() => { void record.refetch(); void sessions.refetch(); void eligibility.refetch(); void synthesis.refetch(); }}
    onStatusChange={(itemId, status) => updateItem.mutate({ itemId, status })}
    onOpenSynthesis={() => navigate(`/records/${recordId}/synthesis`)}
    record={record.data ? toRecordSummary(record.data) : undefined}
    routeState={routeState}
    scope={eligibility.data ? toRecordSynthesisScope(eligibility.data) : undefined}
    sessions={(sessions.data ?? []).map(toSessionSummary)}
    statusUpdatingItemId={updateItem.isPending ? updateItem.variables?.itemId : undefined}
    synthesis={synthesisValue}
  />;
}

export function RecordSynthesisRoute() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const record = useRecord(recordId);
  const eligibility = useRecordSynthesisEligibility(recordId);
  const synthesis = useLatestRecordSynthesis(recordId);
  const generate = useGenerateRecordSynthesis(recordId);
  const updateItem = useUpdateRecordSynthesisItem(recordId);
  const errors = [record.error, eligibility.error, synthesis.error];
  if (record.isPending || eligibility.isPending || synthesis.isPending) return <RecordDetailView routeState="loading" sessions={[]} />;
  if (errors.some(notFound) || !record.data || !eligibility.data) return <RecordDetailView routeState="not-found" sessions={[]} />;
  if (errors.some(Boolean)) return <RecordDetailView onRetry={() => { void record.refetch(); void eligibility.refetch(); void synthesis.refetch(); }} routeState="error" sessions={[]} />;
  const scope = toRecordSynthesisScope(eligibility.data);
  const value = synthesis.data ? toRecordSynthesis(synthesis.data) : undefined;
  const insufficient = scope.includedSessions.length < scope.minimumEligibleSessions;
  const state = generate.isPending
    ? "processing"
    : insufficient
      ? "insufficient"
      : value?.status === "processing"
        ? "processing"
        : value?.status === "failed" || generate.isError
          ? "failed"
          : value?.status === "complete"
            ? "results"
            : "empty";
  return <RecordSynthesisView
    onGenerate={() => generate.mutate()}
    onOpenEvidence={(itemId) => {
      const evidenceId = value?.items.find((item) => item.id === itemId)?.evidenceIds[0];
      if (evidenceId) navigate(`/records/${recordId}/synthesis/items/${itemId}/evidence/${evidenceId}`);
    }}
    onRetry={() => generate.mutate()}
    onStatusChange={(itemId, status) => updateItem.mutate({ itemId, status })}
    record={toRecordSummary(record.data)}
    scope={scope}
    state={state}
    statusUpdatingItemId={updateItem.isPending ? updateItem.variables?.itemId : undefined}
    synthesis={value ?? (generate.data ? toRecordSynthesis(generate.data) : undefined)}
  />;
}

export function RecordEvidenceDetailRoute() {
  const { recordId = "", itemId = "", evidenceId = "" } = useParams();
  const record = useRecord(recordId);
  const evidence = useRecordSynthesisEvidence(recordId, itemId, evidenceId);
  const state = record.isPending || evidence.isPending
    ? "loading"
    : notFound(record.error) || notFound(evidence.error)
      ? "not-found"
      : record.isError || evidence.isError
        ? "error"
        : "ready";
  return <RecordEvidenceDetailView
    context={evidence.data ? toTranscriptContext(evidence.data.context) : undefined}
    evidenceId={evidenceId}
    itemTitle={evidence.data?.item_title}
    onRetry={() => { void record.refetch(); void evidence.refetch(); }}
    record={record.data ? toRecordSummary(record.data) : undefined}
    sessionTitle={evidence.data?.session_title}
    state={state}
  />;
}
