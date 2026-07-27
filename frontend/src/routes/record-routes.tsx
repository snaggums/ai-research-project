import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { toRecordSummary, toRecordSynthesis, toRecordSynthesisScope } from "@/adapters/records";
import { toSessionSummary } from "@/adapters/sessions";
import { toTranscriptContext } from "@/adapters/transcripts";
import { RecordApiError } from "@/api/records";
import type { RecordChatCitation, RecordChatResponse } from "@/api/types";
import type {
  AskRecordConversationTurn,
  AskRecordWorkspaceState,
} from "@/components/research/ask-record-workspace";
import type { EvidenceCitation } from "@/components/research/evidence-citation-card";
import {
  useAskRecord,
  useGenerateRecordSynthesis,
  useLatestRecordSynthesis,
  useRecord,
  useRecordChatSources,
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
const suggestedRecordQuestions = [
  "What prevents participants from feeling confident after checkout?",
  "Which requirements appear across multiple Sessions?",
  "Where do reviewed findings and raw evidence disagree?",
];

function createTransientId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toEvidenceCitation(citation: RecordChatCitation): EvidenceCitation {
  return {
    excerpt: citation.excerpt,
    id: citation.id,
    project: citation.project_name,
    reference: citation.reference,
    relevance: citation.relevance,
    session: citation.session_title,
    speakerTimestamp: `${citation.speaker} • ${citation.location}`,
    transcript: citation.document_name,
    transcriptHref: `/projects/${citation.project_id}/sessions/${citation.session_id}/documents/${citation.document_id}?result=${citation.context_result_id}`,
  };
}

function toAnswerParagraphs(answer: string) {
  return answer
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => {
      const citationReferences = Array.from(
        paragraph.matchAll(/\[(\d+)\]/g),
        (match) => Number(match[1]),
      );
      const text = paragraph.replace(/\s*\[\d+\]/g, "").trim();
      return {
        id: `record-answer-paragraph-${index + 1}`,
        segments: [{ text, citationReferences }],
      };
    });
}

function toAskRecordTurn(response: RecordChatResponse): AskRecordConversationTurn {
  const citations = response.citations.map(toEvidenceCitation);
  if (response.status === "insufficient-evidence") {
    return {
      id: createTransientId("record-insufficient"),
      partialCitations: citations,
      response: "insufficient-evidence",
      role: "assistant",
    };
  }
  return {
    answer: toAnswerParagraphs(response.answer ?? ""),
    citations,
    id: createTransientId("record-answer"),
    response: "answer",
    role: "assistant",
    traceabilityNote: response.traceability_note,
  };
}

function recordChatErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  try {
    const parsed = JSON.parse(error.message) as { detail?: string };
    return parsed.detail ?? error.message;
  } catch {
    return error.message;
  }
}

function recordRootPath(projectId?: string) {
  return projectId ? `/projects/${projectId}/records` : "/records";
}

export function RecordsCollectionRoute() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const records = useRecords();
  const root = recordRootPath(projectId);
  return <RecordsCollectionView
    onOpenRecord={(recordId) => navigate(`${root}/${recordId}`)}
    onRetry={() => void records.refetch()}
    recordRootPath={root}
    records={(records.data ?? []).map(toRecordSummary)}
    state={records.isPending ? "loading" : records.isError ? "error" : records.data?.length ? "ready" : "empty"}
  />;
}

export function RecordDetailRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId, recordId = "" } = useParams();
  const root = recordRootPath(projectId);
  const requestedView = searchParams.get("view");
  const activeView =
    requestedView === "knowledge"
      ? "knowledge"
      : requestedView === "transcript-codes"
        ? "transcript-codes"
      : requestedView === "ask-record"
        ? "ask-record"
        : "overview";
  const record = useRecord(recordId);
  const sessions = useRecordSessions(recordId);
  const eligibility = useRecordSynthesisEligibility(recordId);
  const synthesis = useLatestRecordSynthesis(recordId);
  const generate = useGenerateRecordSynthesis(recordId);
  const updateItem = useUpdateRecordSynthesisItem(recordId);
  const chatSources = useRecordChatSources(recordId, activeView === "ask-record");
  const askRecordMutation = useAskRecord(recordId);
  const [chatTurns, setChatTurns] = React.useState<AskRecordConversationTurn[]>([]);
  const [chatQuestion, setChatQuestion] = React.useState("");
  const lastQuestionRef = React.useRef("");
  const criticalErrors = [record.error, sessions.error, eligibility.error];
  const routeState = criticalErrors.some(notFound)
    ? "not-found"
    : record.isPending || sessions.isPending || eligibility.isPending
      ? "loading"
      : criticalErrors.some(Boolean)
        ? "error"
        : "ready";
  const synthesisValue = synthesis.data ? toRecordSynthesis(synthesis.data) : undefined;
  const knowledgeState = synthesis.isPending
    ? "loading"
    : synthesis.isError
      ? "error"
      : synthesisValue?.status === "complete" && synthesisValue.items.length
        ? "ready"
        : "empty";

  async function submitRecordQuestion(question: string, appendQuestion = true) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    lastQuestionRef.current = cleanQuestion;
    askRecordMutation.reset();
    if (appendQuestion) {
      setChatTurns((current) => [
        ...current,
        {
          content: cleanQuestion,
          id: createTransientId("record-question"),
          role: "researcher",
        },
      ]);
    }
    try {
      const response = await askRecordMutation.mutateAsync(cleanQuestion);
      setChatTurns((current) => [...current, toAskRecordTurn(response)]);
      setChatQuestion("");
    } catch {
      setChatQuestion(cleanQuestion);
    }
  }

  const lastAssistantTurn = [...chatTurns]
    .reverse()
    .find((turn) => turn.role === "assistant");
  const askRecordState: AskRecordWorkspaceState = chatSources.isError
    ? "recoverable-error"
    : chatSources.data && !chatSources.data.searchable
      ? "no-sources"
      : askRecordMutation.isPending
        ? "generating"
        : askRecordMutation.isError
          ? "recoverable-error"
          : lastAssistantTurn?.response === "insufficient-evidence"
            ? "insufficient-evidence"
            : chatTurns.length
              ? "answered"
              : "suggested";
  const sourceAvailability = chatSources.data
    ? [
        {
          label: "Primary transcripts",
          value: String(chatSources.data.primary_transcript_count),
        },
        {
          label: "Reviewed or approved Session Reports",
          value: String(chatSources.data.reviewed_report_count),
        },
        {
          label: "Record Knowledge",
          value: chatSources.data.record_knowledge_available
            ? "Available"
            : "Not available",
        },
      ]
    : [];

  return <RecordDetailView
    activeView={activeView}
    askRecordProps={{
      errorMessage: chatSources.isError
        ? "Record sources could not be loaded. Check your connection and try again."
        : recordChatErrorMessage(askRecordMutation.error),
      onAsk: (question) => submitRecordQuestion(question),
      onOpenRelatedSessions: () => {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.delete("view");
          return next;
        });
      },
      onOpenTranscriptContext: (citation) => {
        if (citation.transcriptHref) navigate(citation.transcriptHref);
      },
      onQuestionChange: setChatQuestion,
      onRetry: () => {
        if (askRecordMutation.isError && lastQuestionRef.current) {
          void submitRecordQuestion(lastQuestionRef.current, false);
        } else {
          void chatSources.refetch();
        }
      },
      question: chatQuestion,
      sourceAvailability,
      state: askRecordState,
      suggestedQuestions: suggestedRecordQuestions,
      turns: chatTurns,
    }}
    generating={generate.isPending}
    knowledgeState={knowledgeState}
    onGenerate={() => generate.mutate()}
    onOpenInTranscriptCoding={(highlight) => {
      const params = new URLSearchParams({
        highlight: highlight.id,
        highlight_status: "accepted-coded",
        panel: "accepted",
        view: "list",
      });
      navigate(
        `/projects/${highlight.projectId}/sessions/${highlight.sessionId}/transcript?${params.toString()}`,
      );
    }}
    onOpenEvidence={(itemId) => {
      const evidenceId = synthesisValue?.items.find((item) => item.id === itemId)?.evidenceIds[0];
      if (evidenceId) navigate(`${root}/${recordId}/synthesis/items/${itemId}/evidence/${evidenceId}`);
    }}
    onRetry={() => { void record.refetch(); void sessions.refetch(); void eligibility.refetch(); void synthesis.refetch(); }}
    onRetryKnowledge={() => { void synthesis.refetch(); }}
    onStatusChange={(itemId, status) => updateItem.mutate({ itemId, status })}
    onOpenSynthesis={() => navigate(`${root}/${recordId}/synthesis`)}
    onViewChange={(view) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (view === "knowledge") next.set("view", "knowledge");
        else if (view === "transcript-codes") next.set("view", "transcript-codes");
        else if (view === "ask-record") next.set("view", "ask-record");
        else next.delete("view");
        return next;
      });
    }}
    record={record.data ? toRecordSummary(record.data) : undefined}
    recordRootPath={root}
    routeState={routeState}
    scope={eligibility.data ? toRecordSynthesisScope(eligibility.data) : undefined}
    sessions={(sessions.data ?? []).map(toSessionSummary)}
    statusUpdatingItemId={updateItem.isPending ? updateItem.variables?.itemId : undefined}
    synthesis={synthesisValue}
  />;
}

export function RecordSynthesisRoute() {
  const navigate = useNavigate();
  const { projectId, recordId = "" } = useParams();
  const root = recordRootPath(projectId);
  const record = useRecord(recordId);
  const eligibility = useRecordSynthesisEligibility(recordId);
  const synthesis = useLatestRecordSynthesis(recordId);
  const generate = useGenerateRecordSynthesis(recordId);
  const updateItem = useUpdateRecordSynthesisItem(recordId);
  const errors = [record.error, eligibility.error, synthesis.error];
  if (record.isPending || eligibility.isPending || synthesis.isPending) return <RecordDetailView recordRootPath={root} routeState="loading" sessions={[]} />;
  if (errors.some(notFound) || !record.data || !eligibility.data) return <RecordDetailView recordRootPath={root} routeState="not-found" sessions={[]} />;
  if (errors.some(Boolean)) return <RecordDetailView onRetry={() => { void record.refetch(); void eligibility.refetch(); void synthesis.refetch(); }} recordRootPath={root} routeState="error" sessions={[]} />;
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
      if (evidenceId) navigate(`${root}/${recordId}/synthesis/items/${itemId}/evidence/${evidenceId}`);
    }}
    onRetry={() => generate.mutate()}
    onStatusChange={(itemId, status) => updateItem.mutate({ itemId, status })}
    record={toRecordSummary(record.data)}
    recordRootPath={root}
    scope={scope}
    state={state}
    statusUpdatingItemId={updateItem.isPending ? updateItem.variables?.itemId : undefined}
    synthesis={value ?? (generate.data ? toRecordSynthesis(generate.data) : undefined)}
  />;
}

export function RecordEvidenceDetailRoute() {
  const { projectId, recordId = "", itemId = "", evidenceId = "" } = useParams();
  const root = recordRootPath(projectId);
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
    recordRootPath={root}
    sessionTitle={evidence.data?.session_title}
    state={state}
  />;
}
