import { http, HttpResponse } from "msw";

import type {
  RecordCatalogItem,
  RecordSynthesis as RecordSynthesisTransport,
  RecordSynthesisEligibility,
} from "@/api/types";
import type { RecordSynthesis as RecordSynthesisDomain, RecordSynthesisScope } from "@/domain/types";
import {
  recordChatAnswerFixture,
  recordChatSourcesFixture,
} from "@/mocks/fixtures/ask-record";
import {
  insufficientRecordScope,
  readyRecordScope,
  recordSummaries,
  recordSynthesis,
} from "@/mocks/fixtures/records";
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
];
