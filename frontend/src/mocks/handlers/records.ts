import { http, HttpResponse } from "msw";

import type {
  RecordCatalogItem,
  RecordKnowledge as RecordKnowledgeTransport,
  RecordKnowledgeSources,
  RecordTranscriptCodes,
  RecordSynthesis as RecordSynthesisTransport,
  RecordSynthesisEligibility,
} from "@/api/types";
import type { RecordKnowledge as RecordKnowledgeDomain, RecordSynthesis as RecordSynthesisDomain, RecordSynthesisScope } from "@/domain/types";
import {
  recordChatAnswerFixture,
  recordChatSourcesFixture,
} from "@/mocks/fixtures/ask-record";
import {
  insufficientRecordScope,
  readyRecordScope,
  recordSummaries,
  recordKnowledge,
  recordSynthesis,
} from "@/mocks/fixtures/records";
import { recordCodeDetails } from "@/components/research/record-code-story-data";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { transcriptApiFixtures, transcriptBlocks, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";

export const RECORDS_API_BASE_URL = "http://localhost:8000/api";

const toTransportRecord = (record: (typeof recordSummaries)[number]): RecordCatalogItem => ({
  id: record.id,
  name: record.name,
  description: record.description,
  related_session_count: record.relatedSessionCount,
  eligible_session_count: record.eligibleSessionCount,
  readiness: record.readiness,
  latest_synthesis_at: record.latestSynthesisAt ?? null,
  approved_report_count: record.approvedReportCount ?? record.eligibleSessionCount,
  knowledge_item_count: record.knowledgeItemCount ?? 0,
  knowledge_updated_at: record.knowledgeUpdatedAt ?? null,
});

const toTransportKnowledge = (value: RecordKnowledgeDomain): RecordKnowledgeTransport => ({
  record_id: value.recordId,
  total_count: value.totalCount,
  knowledge_updated_at: value.knowledgeUpdatedAt ?? null,
  items: value.items.map((item) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    summary: item.summary,
    provenance: item.provenance,
    ownership: item.ownership
      ? {
          role: item.ownership.role,
          value: item.ownership.value ?? null,
          status: item.ownership.status,
          rationale: item.ownership.rationale ?? null,
        }
      : null,
    source_project_id: item.sourceProjectId,
    source_session_id: item.sourceSessionId,
    source_session_title: item.sourceSessionTitle,
    source_report_id: item.sourceReportId,
    source_report_item_id: item.sourceReportItemId,
    source_report_updated_at: item.sourceReportUpdatedAt,
    position: item.position,
    promoted_at: item.promotedAt,
    superseded_at: item.supersededAt ?? null,
    evidence_preview: item.evidencePreview,
    evidence_ids: item.evidenceIds,
  })),
});

const toTransportScope = (scope: RecordSynthesisScope): RecordSynthesisEligibility => ({
  record_id: scope.recordId,
  description: scope.description,
  minimum_eligible_sessions: scope.minimumEligibleSessions,
  included_sessions: scope.includedSessions.map((session) => ({
    id: session.id,
    title: session.title,
    report_id: session.reportId,
    report_status: session.reportStatus,
  })),
  excluded_sessions: scope.excludedSessions,
});

const toTransportSynthesis = (value: RecordSynthesisDomain): RecordSynthesisTransport => ({
  id: value.id,
  record_id: value.recordId,
  status: value.status,
  generated_at: value.generatedAt ?? null,
  source_session_count: value.sourceSessionCount,
  source_report_revision_count: value.sourceReportRevisionCount,
  provider: value.provider ?? null,
  model: value.model ?? null,
  prompt_version: value.promptVersion ?? null,
  items: value.items.map((item) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    summary: item.summary,
    evidence_preview: item.evidencePreview,
    source_session_count: item.sourceSessionCount,
    source_report_item_count: item.sourceReportItemCount,
    provenance: item.provenance,
    evidence_ids: item.evidenceIds,
  })),
  error_message: value.errorMessage ?? null,
});

const scopes: Record<string, RecordSynthesisScope> = {
  "record-1": readyRecordScope,
  "record-2": insufficientRecordScope,
  "record-3": { ...readyRecordScope, recordId: "record-3", description: "All eligible Sessions related to Medicare Fraud Finder are included automatically." },
};

const failedSynthesis: RecordSynthesisDomain = {
  id: "record-3-synthesis-failed",
  recordId: "record-3",
  status: "failed",
  sourceSessionCount: 2,
  sourceReportRevisionCount: 2,
  items: [],
  errorMessage: "AIR could not complete this synthesis. The eligible Session Reports remain available.",
};

let synthesisStore: Record<string, RecordSynthesisTransport | null> = {};

export function resetRecordStore() {
  synthesisStore = {
    "record-1": toTransportSynthesis(recordSynthesis),
    "record-2": null,
    "record-3": toTransportSynthesis(failedSynthesis),
  };
}
resetRecordStore();

const recordRoot = `${RECORDS_API_BASE_URL}/records/:recordId`;

function toTransportEvidenceGroups(code: (typeof recordCodeDetails)[number]) {
  const evidenceGroups = code.evidenceGroups.length
    ? code.evidenceGroups
    : recordCodeDetails[0].evidenceGroups.slice(0, code.sessionCount).map(
        (group, groupIndex) => {
          const baseHighlightCount = Math.floor(
            code.acceptedHighlightCount / code.sessionCount,
          );
          const extraHighlightCount =
            code.acceptedHighlightCount % code.sessionCount;
          const highlightCount =
            baseHighlightCount + (groupIndex < extraHighlightCount ? 1 : 0);
          return {
            ...group,
            highlights: Array.from({ length: highlightCount }, (_, index) => ({
              ...group.highlights[index % group.highlights.length],
              id: `${code.id}-highlight-${groupIndex + 1}-${index + 1}`,
            })),
          };
        },
      );

  return evidenceGroups.map((group) => ({
    session_id: group.sessionId,
    session_title: group.sessionTitle,
    highlights: group.highlights.map((highlight) => ({
      id: highlight.id,
      project_id: highlight.projectId,
      project_name: highlight.projectName,
      session_id: highlight.sessionId,
      session_title: highlight.sessionTitle,
      excerpt: highlight.excerpt,
      speaker: highlight.speaker,
      location: highlight.location,
    })),
  }));
}

const recordTranscriptCodesFixture: RecordTranscriptCodes = {
  record_id: "record-1",
  accepted_code_count: recordCodeDetails.length,
  session_count: 5,
  codes: recordCodeDetails.map((code) => ({
    id: code.id,
    record_id: "record-1",
    name: code.name,
    description: code.description,
    accepted_highlight_count: code.acceptedHighlightCount,
    session_count: code.sessionCount,
    latest_evidence_at: code.latestEvidenceAt,
    evidence_groups: toTransportEvidenceGroups(code),
  })),
};

export const recordHandlers = [
  http.get(`${RECORDS_API_BASE_URL}/records`, () => HttpResponse.json(recordSummaries.map(toTransportRecord))),
  http.get(recordRoot, ({ params }) => {
    const record = recordSummaries.find((item) => item.id === String(params.recordId));
    return record ? HttpResponse.json(toTransportRecord(record)) : new HttpResponse("Record not found", { status: 404 });
  }),
  http.get(`${recordRoot}/sessions`, ({ params }) => {
    const recordId = String(params.recordId);
    if (!recordSummaries.some((record) => record.id === recordId)) return new HttpResponse("Record not found", { status: 404 });
    return HttpResponse.json(sessionApiFixtures.filter((session) => session.related_records.some((record) => record.id === recordId)));
  }),
  http.get(`${recordRoot}/chat/sources`, ({ params }) => {
    const recordId = String(params.recordId);
    if (!recordSummaries.some((record) => record.id === recordId)) return new HttpResponse("Record not found", { status: 404 });
    if (recordId === "record-2") {
      return HttpResponse.json({
        record_id: recordId,
        primary_transcript_count: 0,
        reviewed_report_count: 0,
        record_knowledge_available: false,
        searchable: false,
      });
    }
    return HttpResponse.json({ ...recordChatSourcesFixture, record_id: recordId });
  }),
  http.get(`${recordRoot}/knowledge`, ({ params, request }) => {
    const recordId = String(params.recordId);
    if (!recordSummaries.some((record) => record.id === recordId)) return new HttpResponse("Record not found", { status: 404 });
    if (recordId === "record-2") {
      return HttpResponse.json({ record_id: recordId, items: [], total_count: 0, knowledge_updated_at: null });
    }
    const includeSuperseded = new URL(request.url).searchParams.get("include_superseded") === "true";
    const value = toTransportKnowledge({ ...recordKnowledge, recordId });
    value.items = includeSuperseded ? value.items : value.items.filter((item) => item.status === "current");
    value.total_count = value.items.length;
    return HttpResponse.json(value);
  }),
  http.get(`${recordRoot}/knowledge/sources`, ({ params }) => {
    const recordId = String(params.recordId);
    const scope = scopes[recordId];
    if (!scope) return new HttpResponse("Record not found", { status: 404 });
    const response: RecordKnowledgeSources = {
      record_id: recordId,
      description: "Approved Session Report Requirements, Decisions, and Action Items are collected exactly as written.",
      sources: [
        ...scope.includedSessions.map((session) => ({
          session_id: session.id,
          session_title: session.title,
          report_id: session.reportId,
          report_status: "approved" as const,
          promoted_item_count: recordId === "record-2" ? 0 : 3,
          included: recordId !== "record-2",
          reason: recordId === "record-2" ? "Session Report is waiting for approval" : null,
        })),
        ...scope.excludedSessions.map((session) => ({
          session_id: session.id,
          session_title: session.title,
          report_id: null,
          report_status: "ai-generated" as const,
          promoted_item_count: 0,
          included: false,
          reason: session.reason,
        })),
      ],
    };
    return HttpResponse.json(response);
  }),
  http.get(`${recordRoot}/transcript-codes`, ({ params }) => {
    const recordId = String(params.recordId);
    if (!recordSummaries.some((record) => record.id === recordId)) {
      return new HttpResponse("Record not found", { status: 404 });
    }
    if (recordId !== "record-1") {
      return HttpResponse.json({
        record_id: recordId,
        accepted_code_count: 0,
        session_count: 0,
        codes: [],
      } satisfies RecordTranscriptCodes);
    }
    return HttpResponse.json(recordTranscriptCodesFixture);
  }),
  http.post(`${recordRoot}/chat/ask`, async ({ params, request }) => {
    const recordId = String(params.recordId);
    if (!recordSummaries.some((record) => record.id === recordId)) return new HttpResponse("Record not found", { status: 404 });
    const payload = await request.json() as { question?: string };
    const question = payload.question?.trim();
    if (!question) return HttpResponse.json({ detail: "Question is required." }, { status: 422 });
    if (recordId === "record-2") {
      return HttpResponse.json(
        { detail: "This Record has no processed primary transcript evidence available to search." },
        { status: 409 },
      );
    }
    if (question.toLowerCase().includes("biometric")) {
      return HttpResponse.json({
        ...recordChatAnswerFixture,
        question,
        status: "insufficient-evidence",
        answer: null,
        citations: recordChatAnswerFixture.citations.slice(0, 1).map((citation) => ({
          ...citation,
          relevance: "partial",
        })),
      });
    }
    return HttpResponse.json({ ...structuredClone(recordChatAnswerFixture), question });
  }),
  http.get(`${recordRoot}/synthesis/eligibility`, ({ params }) => {
    const scope = scopes[String(params.recordId)];
    return scope ? HttpResponse.json(toTransportScope(scope)) : new HttpResponse("Record not found", { status: 404 });
  }),
  http.get(`${recordRoot}/synthesis/latest`, ({ params }) => {
    const recordId = String(params.recordId);
    if (!(recordId in synthesisStore)) return new HttpResponse("Record not found", { status: 404 });
    return HttpResponse.json(synthesisStore[recordId]);
  }),
  http.post(`${recordRoot}/synthesis`, ({ params }) => {
    const recordId = String(params.recordId);
    const scope = scopes[recordId];
    if (!scope) return new HttpResponse("Record not found", { status: 404 });
    if (scope.includedSessions.length < scope.minimumEligibleSessions) return new HttpResponse("At least two eligible Session Reports are required", { status: 409 });
    const generated = toTransportSynthesis({ ...recordSynthesis, id: `${recordId}-synthesis-2026-07-16`, recordId, generatedAt: "2026-07-16T14:00:00.000Z" });
    synthesisStore[recordId] = generated;
    return HttpResponse.json(generated, { status: 201 });
  }),
  http.patch(`${recordRoot}/synthesis/items/:itemId`, async ({ params, request }) => {
    const synthesis = synthesisStore[String(params.recordId)];
    if (!synthesis) return new HttpResponse("Synthesis not found", { status: 404 });
    const item = synthesis.items.find((candidate) => candidate.id === String(params.itemId));
    if (!item) return new HttpResponse("Synthesis item not found", { status: 404 });
    const payload = await request.json() as { status?: typeof item.status };
    if (payload.status) item.status = payload.status;
    return HttpResponse.json(item);
  }),
  http.get(`${recordRoot}/synthesis/items/:itemId/evidence/:evidenceId`, ({ params }) => {
    const synthesis = synthesisStore[String(params.recordId)];
    const item = synthesis?.items.find((candidate) => candidate.id === String(params.itemId));
    if (!item || !item.evidence_ids.includes(String(params.evidenceId))) return new HttpResponse("Evidence not found", { status: 404 });
    const document = transcriptApiFixtures[0];
    const result = transcriptSearchFixtures[0];
    return HttpResponse.json({
      id: String(params.evidenceId),
      record_id: String(params.recordId),
      item_id: item.id,
      item_title: item.title,
      project_id: document.project_id,
      session_id: document.session_id,
      session_title: "Mobile checkout usability test",
      context: { document, result, passages: transcriptBlocks, focused_passage_id: transcriptBlocks[1].id },
    });
  }),
  http.get(`${recordRoot}/knowledge/items/:itemId/evidence/:evidenceId`, ({ params }) => {
    const item = recordKnowledge.items.find((candidate) => candidate.id === String(params.itemId));
    if (!item || !item.evidenceIds.includes(String(params.evidenceId))) return new HttpResponse("Evidence not found", { status: 404 });
    const document = transcriptApiFixtures[0];
    const result = transcriptSearchFixtures[0];
    return HttpResponse.json({
      id: String(params.evidenceId),
      record_id: String(params.recordId),
      item_id: item.id,
      item_title: item.title,
      project_id: document.project_id,
      session_id: document.session_id,
      session_title: item.sourceSessionTitle,
      context: { document, result, passages: transcriptBlocks, focused_passage_id: transcriptBlocks[1].id },
    });
  }),
];
