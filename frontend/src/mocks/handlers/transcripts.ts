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

export const transcriptHandlers = [
  http.get(routeRoot, ({ params }) => HttpResponse.json(transcriptStore.filter((item) => matches(item, String(params.projectId), String(params.sessionId))))),
  http.post(routeRoot, async ({ params, request }) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return new HttpResponse("Transcript file is required", { status: 400 });
    const document: TranscriptDocument = {
      id: `uploaded-transcript-${sequence++}`, project_id: String(params.projectId), session_id: String(params.sessionId), filename: file.name,
      mime_type: file.type || null, size_bytes: file.size, status: "processing", is_primary: false, uploaded_at: "2026-07-15T12:00:00Z", processed_at: null,
      error_message: null, blocks: [], source_url: null, download_url: "#download-uploaded-source",
    };
    transcriptStore.push(document);
    return HttpResponse.json(document, { status: 201 });
  }),
  http.get(`${routeRoot}/:documentId`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    return document ? HttpResponse.json(document) : new HttpResponse("Transcript not found", { status: 404 });
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
  http.delete(`${routeRoot}/:documentId`, ({ params }) => {
    const index = transcriptStore.findIndex((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (index < 0) return new HttpResponse("Transcript not found", { status: 404 });
    transcriptStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${routeRoot}/:documentId/search`, ({ params, request }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    if (!document) return new HttpResponse("Transcript not found", { status: 404 });
    if (document.status !== "complete") return new HttpResponse("Transcript is not ready", { status: 409 });
    const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    const results = query ? transcriptSearchFixtures.filter((result) => `${result.speaker} ${result.excerpt}`.toLowerCase().includes(query) || query === "navigation confusion") : [];
    return HttpResponse.json({ query, results });
  }),
  http.get(`${routeRoot}/:documentId/context/:resultId`, ({ params }) => {
    const document = transcriptStore.find((item) => matches(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.documentId));
    const result = transcriptSearchFixtures.find((item) => item.id === String(params.resultId) && item.document_id === String(params.documentId));
    if (!document || !result) return new HttpResponse("Transcript context not found", { status: 404 });
    return HttpResponse.json({ document, result, passages: document.blocks, focused_passage_id: document.blocks[result.block_index]?.id ?? "" });
  }),
];
