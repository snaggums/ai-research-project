import * as React from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  toRecordKnowledge,
  toRecordKnowledgeScope,
  toRecordSummary,
  toRecordTranscriptCodes,
} from "@/adapters/records";
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
  useRecord,
  useRecordChatSources,
  useRecordKnowledge,
  useRecordKnowledgeEvidence,
  useRecordKnowledgeSources,
  useRecordSynthesisEvidence,
  useRecordTranscriptCodes,
  useRecords,
  useRecordSessions,
} from "@/hooks/useRecords";
import {
  RecordDetailView,
  RecordEvidenceDetailView,
  RecordsCollectionView,
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
  const knowledgeSources = useRecordKnowledgeSources(recordId);
  const knowledge = useRecordKnowledge(recordId, true);
  const transcriptCodes = useRecordTranscriptCodes(
    recordId,
    activeView === "transcript-codes",
  );
  const chatSources = useRecordChatSources(recordId, activeView === "ask-record");
  const askRecordMutation = useAskRecord(recordId);
  const [chatTurns, setChatTurns] = React.useState<AskRecordConversationTurn[]>([]);
  const [chatQuestion, setChatQuestion] = React.useState("");
  const lastQuestionRef = React.useRef("");
  const criticalErrors = [record.error, sessions.error, knowledgeSources.error];
  const routeState = criticalErrors.some(notFound)
    ? "not-found"
    : record.isPending || sessions.isPending || knowledgeSources.isPending
      ? "loading"
      : criticalErrors.some(Boolean)
        ? "error"
        : "ready";
  const knowledgeValue = knowledge.data ? toRecordKnowledge(knowledge.data) : undefined;
  const knowledgeState = knowledge.isPending
    ? "loading"
    : knowledge.isError
      ? "error"
      : knowledgeValue?.items.length
        ? "ready"
        : "empty";
  const transcriptCodeValue = transcriptCodes.data
    ? toRecordTranscriptCodes(transcriptCodes.data)
    : undefined;
  const transcriptCodeState = transcriptCodes.isPending
    ? "loading"
    : transcriptCodes.isError
      ? "error"
      : transcriptCodeValue?.codes.length
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
          label: "Approved Session Reports",
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
    knowledge={knowledgeValue}
    knowledgeState={knowledgeState}
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
      const evidenceId = knowledgeValue?.items.find((item) => item.id === itemId)?.evidenceIds[0];
      if (evidenceId) navigate(`${root}/${recordId}/knowledge/items/${itemId}/evidence/${evidenceId}`);
    }}
    onRetry={() => { void record.refetch(); void sessions.refetch(); void knowledgeSources.refetch(); void knowledge.refetch(); }}
    onRetryKnowledge={() => { void knowledge.refetch(); }}
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
    recordCodes={transcriptCodeValue?.codes}
    recordCodeSessionCount={transcriptCodeValue?.sessionCount}
    recordCodeState={transcriptCodeState}
    recordRootPath={root}
    routeState={routeState}
    scope={knowledgeSources.data ? toRecordKnowledgeScope(knowledgeSources.data) : undefined}
    sessions={(sessions.data ?? []).map(toSessionSummary)}
    onRetryRecordCodes={() => void transcriptCodes.refetch()}
  />;
}

export function RecordSynthesisRoute() {
  const { projectId, recordId = "" } = useParams();
  const root = recordRootPath(projectId);
  return <Navigate replace to={`${root}/${recordId}?view=knowledge`} />;
}

export function RecordKnowledgeEvidenceDetailRoute() {
  const { projectId, recordId = "", itemId = "", evidenceId = "" } = useParams();
  const root = recordRootPath(projectId);
  const record = useRecord(recordId);
  const evidence = useRecordKnowledgeEvidence(recordId, itemId, evidenceId);
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

export function RecordSynthesisEvidenceDetailRoute() {
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
    sourceType="synthesis"
    state={state}
  />;
}
