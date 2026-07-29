import { http, HttpResponse } from "msw";

import type { TranscriptDocument } from "@/api/types";
import { transcriptApiFixtures, transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";

export const TRANSCRIPTS_API_BASE_URL = "http://localhost:8000/api";
let transcriptStore: TranscriptDocument[] = [];
let sequence = 1;

export function resetTranscriptStore() {
  transcriptStore = structuredClone(transcriptApiFixtures);
  sequence = 1;
}
resetTranscriptStore();

const matches = (document: TranscriptDocument, projectId: string, sessionId: string) => document.project_id === projectId && document.session_id === sessionId;
const routeRoot = `${TRANSCRIPTS_API_BASE_URL}/projects/:projectId/sessions/:sessionId/documents`;

function matchesExactLiteral(value: string, query: string) {
  const normalizedValue = value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedQuery = query.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalizedQuery) return false;
  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const prefix = /^[\p{L}\p{N}]/u.test(normalizedQuery) ? "(?<![\\p{L}\\p{N}_])" : "";
  const suffix = /[\p{L}\p{N}]$/u.test(normalizedQuery) ? "(?![\\p{L}\\p{N}_])" : "";
  return new RegExp(`${prefix}${escaped}${suffix}`, "u").test(normalizedValue);
}

export const transcriptHandlers = [
  http.get(routeRoot, ({ params }) => HttpResponse.json(transcriptStore.filter((item) => matches(item, String(params.projectId), String(params.sessionId))))),
  http.post(routeRoot, async ({ params, request }) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return new HttpResponse("Transcript file is required", { status: 400 });
    const existingActive = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.is_primary);
    if (existingActive) {
      return HttpResponse.json(
        { code: "transcript_already_exists", detail: "This Session already has an active Transcript. Use Replace transcript to preserve its evidence history." },
        { status: 409 },
      );
    }
    const document: TranscriptDocument = {
      id: `uploaded-transcript-${sequence++}`, project_id: String(params.projectId), session_id: String(params.sessionId), filename: file.name,
      mime_type: file.type || null, size_bytes: file.size, status: "processing", lifecycle_status: "active", is_primary: true, uploaded_at: "2026-07-15T12:00:00Z", processed_at: null,
      error_message: null, blocks: [], source_url: null, download_url: "#download-uploaded-source",
    };
    transcriptStore.push(document);
    return HttpResponse.json(document, { status: 201 });
  }),
  http.post(`${TRANSCRIPTS_API_BASE_URL}/projects/:projectId/sessions/:sessionId/transcript-replacement`, async ({ params, request }) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return new HttpResponse("Transcript file is required", { status: 400 });
    const current = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.is_primary);
    if (!current) return HttpResponse.json({ code: "transcript_replacement_failed", detail: "This Session does not have an active Transcript to replace." }, { status: 409 });
    current.is_primary = false;
    current.lifecycle_status = "legacy";
    const document: TranscriptDocument = {
      id: `replacement-transcript-${sequence++}`, project_id: String(params.projectId), session_id: String(params.sessionId), filename: file.name,
      mime_type: file.type || null, size_bytes: file.size, status: "complete", lifecycle_status: "active", is_primary: true,
      uploaded_at: "2026-07-15T12:00:00Z", processed_at: "2026-07-15T12:00:05Z", error_message: null,
      blocks: [], source_url: null, download_url: "#download-replacement-source",
    };
    transcriptStore.push(document);
    return HttpResponse.json(document, { status: 201 });
  }),
  http.get(`${routeRoot}/:documentId`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    return document ? HttpResponse.json(document) : new HttpResponse("Transcript not found", { status: 404 });
  }),
  http.get(`${routeRoot}/:documentId/dependencies`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (!document) return new HttpResponse("Transcript not found", { status: 404 });
    return HttpResponse.json({
      is_primary: document.is_primary,
      accepted_highlight_count: document.is_primary ? 3 : 0,
      uncoded_highlight_count: 0,
      code_suggestion_run_count: 1,
      session_report_count: 1,
      record_synthesis_count: 1,
      retention_consequence: "preserve-lineage",
      version: "dependency-version-1",
    });
  }),
  http.post(`${routeRoot}/:documentId/process`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (!document) return new HttpResponse("Transcript not found", { status: 404 });
    Object.assign(document, { status: "processing", error_message: null });
    return HttpResponse.json(document);
  }),
  http.post(`${routeRoot}/:documentId/primary`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (!document) return new HttpResponse("Transcript not found", { status: 404 });
    transcriptStore.filter((item) => matches(item, String(params.projectId), String(params.sessionId))).forEach((item) => { item.is_primary = item.id === document.id; });
    return HttpResponse.json(document);
  }),
  http.delete(`${routeRoot}/:documentId`, ({ params, request }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (!document) return new HttpResponse("Transcript not found", { status: 404 });
    if (request.headers.get("X-Transcript-Confirmation") !== "preserve-lineage" || !request.headers.get("If-Match")) {
      return HttpResponse.json(
        { code: "transcript_confirmation_required", detail: "Review the linked evidence and confirm that research history will be preserved." },
        { status: 409 },
      );
    }
    if (request.headers.get("If-Match") !== "dependency-version-1") {
      return HttpResponse.json(
        { code: "transcript_dependency_changed", detail: "Linked evidence changed after the confirmation opened. Review the refreshed counts and try again." },
        { status: 409 },
      );
    }
    document.is_primary = false;
    document.lifecycle_status = "tombstoned";
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${routeRoot}/:documentId/search`, ({ params, request }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (!document) return new HttpResponse("Transcript not found", { status: 404 });
    if (document.status !== "complete") return new HttpResponse("Transcript is not ready", { status: 409 });
    const query = new URL(request.url).searchParams.get("q")?.trim().replace(/\s+/g, " ") ?? "";
    const results = query
      ? transcriptSearchFixtures.filter((result) => matchesExactLiteral(`${result.speaker} ${result.excerpt}`, query))
      : [];
    return HttpResponse.json({ query, results });
  }),
  http.get(`${routeRoot}/:documentId/context/:resultId`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    const result = transcriptSearchFixtures.find((item) => item.id === String(params.resultId) && item.document_id === String(params.documentId));
    if (!document || !result) return new HttpResponse("Transcript context not found", { status: 404 });
    return HttpResponse.json({ document, result, passages: document.blocks, focused_passage_id: document.blocks[result.block_index]?.id ?? "" });
  }),
];
