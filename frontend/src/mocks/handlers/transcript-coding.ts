import { http, HttpResponse } from "msw";

import type {
  CreateRecordCodePayload,
  CreateTranscriptHighlightPayload,
  RecordCode,
  TranscriptCodingWorkspace,
  UpdateRecordCodePayload,
  UpdateTranscriptCodeSuggestionPayload,
} from "@/api/types";
import { transcriptCodingApiFixture } from "@/mocks/fixtures/transcript-coding";

export const TRANSCRIPT_CODING_API_BASE_URL = "http://localhost:8000/api";
const timestamp = "2026-07-20T12:00:00Z";
let workspaceStore: TranscriptCodingWorkspace;
let sequence = 1;

export function resetTranscriptCodingStore() {
  workspaceStore = structuredClone(transcriptCodingApiFixture);
  sequence = 1;
}
resetTranscriptCodingStore();

function matchWorkspace(projectId: string, sessionId: string) {
  if (workspaceStore.project_id === projectId && workspaceStore.session_id === sessionId) return workspaceStore;
  workspaceStore = structuredClone(transcriptCodingApiFixture);
  workspaceStore.project_id = projectId;
  workspaceStore.session_id = sessionId;
  workspaceStore.highlights.forEach((highlight) => {
    highlight.project_id = projectId;
    highlight.session_id = sessionId;
  });
  return workspaceStore;
}

function slugify(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "code";
}

function createCode(recordId: string, payload: CreateRecordCodePayload): RecordCode {
  const existing = workspaceStore.codes.find((code) =>
    code.record_id === recordId && code.name.toLocaleLowerCase() === payload.name.trim().toLocaleLowerCase(),
  );
  if (existing) return existing;
  const code: RecordCode = {
    id: `code-${slugify(payload.name)}-${sequence++}`,
    record_id: recordId,
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    status: "active",
    created_at: timestamp,
    updated_at: timestamp,
  };
  workspaceStore.codes.push(code);
  return code;
}

export const transcriptCodingHandlers = [
  http.get(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/coding`, ({ params }) =>
    HttpResponse.json(matchWorkspace(String(params.projectId), String(params.sessionId))),
  ),
  http.post(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/highlights`, async ({ params, request }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const payload = await request.json() as CreateTranscriptHighlightPayload;
    const codes = workspace.codes.filter((code) => payload.code_ids.includes(code.id));
    const highlight = {
      id: `highlight-${sequence++}`,
      project_id: workspace.project_id,
      session_id: workspace.session_id,
      document_id: workspace.document_id,
      anchor: {
        document_id: workspace.document_id,
        chunk_id: payload.anchor.chunk_id ?? null,
        block_id: payload.anchor.block_id,
        start_char: payload.anchor.start_char,
        end_char: payload.anchor.end_char,
        excerpt_snapshot: payload.anchor.excerpt_snapshot,
        speaker: payload.anchor.speaker,
        location: payload.anchor.location,
        start_ms: payload.anchor.start_ms ?? null,
        end_ms: payload.anchor.end_ms ?? null,
        content_checksum: payload.anchor.content_checksum,
      },
      origin: "researcher" as const,
      codes,
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null,
    };
    workspace.highlights.push(highlight);
    return HttpResponse.json(highlight, { status: 201 });
  }),
  http.post(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/highlights/:highlightId/codes`, async ({ params, request }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const highlight = workspace.highlights.find((item) => item.id === String(params.highlightId));
    if (!highlight) return new HttpResponse("Highlight not found", { status: 404 });
    const payload = await request.json() as { code_ids?: string[] };
    for (const code of workspace.codes.filter((candidate) => payload.code_ids?.includes(candidate.id))) {
      if (!highlight.codes.some((candidate) => candidate.id === code.id)) highlight.codes.push(code);
    }
    highlight.updated_at = timestamp;
    return HttpResponse.json(highlight);
  }),
  http.delete(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/highlights/:highlightId/codes/:codeId`, ({ params }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const highlight = workspace.highlights.find((item) => item.id === String(params.highlightId));
    if (!highlight) return new HttpResponse("Highlight not found", { status: 404 });
    highlight.codes = highlight.codes.filter((code) => code.id !== String(params.codeId));
    highlight.updated_at = timestamp;
    return HttpResponse.json(highlight);
  }),
  http.delete(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/highlights/:highlightId`, ({ params }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const index = workspace.highlights.findIndex((item) => item.id === String(params.highlightId));
    if (index < 0) return new HttpResponse("Highlight not found", { status: 404 });
    workspace.highlights.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${TRANSCRIPT_CODING_API_BASE_URL}/records/:recordId/codes`, async ({ params, request }) => {
    const payload = await request.json() as CreateRecordCodePayload;
    return HttpResponse.json(createCode(String(params.recordId), payload), { status: 201 });
  }),
  http.patch(`${TRANSCRIPT_CODING_API_BASE_URL}/records/:recordId/codes/:codeId`, async ({ params, request }) => {
    const code = workspaceStore.codes.find((item) => item.record_id === String(params.recordId) && item.id === String(params.codeId));
    if (!code) return new HttpResponse("Code not found", { status: 404 });
    const payload = await request.json() as UpdateRecordCodePayload;
    if (payload.name !== undefined) code.name = payload.name.trim();
    if (payload.description !== undefined) code.description = payload.description?.trim() || null;
    code.updated_at = timestamp;
    return HttpResponse.json(code);
  }),
  http.patch(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/code-suggestions/:suggestionId`, async ({ params, request }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const suggestion = workspace.suggestions.find((item) => item.id === String(params.suggestionId));
    if (!suggestion) return new HttpResponse("Code suggestion not found", { status: 404 });
    const payload = await request.json() as UpdateTranscriptCodeSuggestionPayload;
    if (payload.proposed_name !== undefined) suggestion.proposed_name = payload.proposed_name.trim();
    if (payload.proposed_description !== undefined) suggestion.proposed_description = payload.proposed_description?.trim() || null;
    suggestion.was_edited = true;
    return HttpResponse.json(suggestion);
  }),
  http.post(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/code-suggestions/:suggestionId/accept`, ({ params }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const suggestionIndex = workspace.suggestions.findIndex((item) => item.id === String(params.suggestionId));
    if (suggestionIndex < 0) return new HttpResponse("Code suggestion not found", { status: 404 });
    const suggestion = workspace.suggestions[suggestionIndex];
    const code = createCode(suggestion.record_id, {
      name: suggestion.proposed_name,
      description: suggestion.proposed_description,
    });
    for (const evidence of suggestion.evidence) {
      const existing = workspace.highlights.find((highlight) =>
        highlight.anchor.document_id === evidence.anchor.document_id
        && highlight.anchor.start_char === evidence.anchor.start_char
        && highlight.anchor.end_char === evidence.anchor.end_char,
      );
      if (existing) {
        if (!existing.codes.some((candidate) => candidate.id === code.id)) existing.codes.push(code);
      } else {
        workspace.highlights.push({
          id: `highlight-${sequence++}`,
          project_id: workspace.project_id,
          session_id: workspace.session_id,
          document_id: workspace.document_id,
          anchor: structuredClone(evidence.anchor),
          origin: "ai-suggestion",
          codes: [code],
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
        });
      }
    }
    workspace.suggestions.splice(suggestionIndex, 1);
    return HttpResponse.json(workspace);
  }),
  http.post(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/code-suggestions/:suggestionId/reject`, ({ params }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const suggestionIndex = workspace.suggestions.findIndex((item) => item.id === String(params.suggestionId));
    if (suggestionIndex < 0) return new HttpResponse("Code suggestion not found", { status: 404 });
    const [suggestion] = workspace.suggestions.splice(suggestionIndex, 1);
    suggestion.status = "rejected";
    suggestion.reviewed_at = timestamp;
    return HttpResponse.json(suggestion);
  }),
  http.post(`${TRANSCRIPT_CODING_API_BASE_URL}/projects/:projectId/sessions/:sessionId/code-suggestions/generate`, ({ params }) => {
    const workspace = matchWorkspace(String(params.projectId), String(params.sessionId));
    const fresh = structuredClone(transcriptCodingApiFixture);
    workspace.suggestion_run = { ...fresh.suggestion_run, id: `coding-run-${sequence++}`, status: "complete" };
    workspace.suggestions = fresh.suggestions.map((suggestion) => ({
      ...suggestion,
      run_id: workspace.suggestion_run.id ?? suggestion.run_id,
    }));
    return HttpResponse.json(workspace);
  }),
];
