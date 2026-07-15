import { http, HttpResponse } from "msw";

import type { SessionConversation, SessionReport, SessionTheme } from "@/api/types";
import { sessionConversationFixture, sessionReportFixture, sessionThemeFixtures, synthesisEvidenceFixtures } from "@/mocks/fixtures/synthesis";

export const SYNTHESIS_API_BASE_URL = "http://localhost:8000/api";
let themeStore: SessionTheme[] = [];
let reportStore: SessionReport | null = null;
let conversationStore: SessionConversation;
let sequence = 1;

export function resetSynthesisStore() {
  themeStore = structuredClone(sessionThemeFixtures);
  reportStore = structuredClone(sessionReportFixture);
  conversationStore = structuredClone(sessionConversationFixture);
  sequence = 1;
}
resetSynthesisStore();

const sessionRoot = `${SYNTHESIS_API_BASE_URL}/projects/:projectId/sessions/:sessionId`;
const matchesTheme = (theme: SessionTheme, projectId: string, sessionId: string) => theme.project_id === projectId && theme.session_id === sessionId;

export const synthesisHandlers = [
  http.get(`${sessionRoot}/themes`, ({ params }) => HttpResponse.json(themeStore.filter((theme) => matchesTheme(theme, String(params.projectId), String(params.sessionId))))),
  http.post(`${sessionRoot}/themes/generate`, ({ params }) => {
    themeStore = structuredClone(sessionThemeFixtures).map((theme) => ({ ...theme, project_id: String(params.projectId), session_id: String(params.sessionId) }));
    return HttpResponse.json({ themes: themeStore, message: "Themes generated from this Session." });
  }),
  http.patch(`${sessionRoot}/themes/:themeId`, async ({ params, request }) => {
    const theme = themeStore.find((item) => matchesTheme(item, String(params.projectId), String(params.sessionId)) && item.id === String(params.themeId));
    if (!theme) return new HttpResponse("Theme not found", { status: 404 });
    Object.assign(theme, await request.json());
    return HttpResponse.json(theme);
  }),
  http.get(`${sessionRoot}/report`, ({ params }) => {
    if (!reportStore || reportStore.project_id !== String(params.projectId) || reportStore.session_id !== String(params.sessionId)) return HttpResponse.json(null);
    return HttpResponse.json(reportStore);
  }),
  http.post(`${sessionRoot}/report/generate`, ({ params }) => {
    reportStore = { ...structuredClone(sessionReportFixture), project_id: String(params.projectId), session_id: String(params.sessionId) };
    return HttpResponse.json({ report: reportStore, message: "Session Report generated." });
  }),
  http.patch(`${sessionRoot}/report`, async ({ params, request }) => {
    if (!reportStore || reportStore.project_id !== String(params.projectId) || reportStore.session_id !== String(params.sessionId)) return new HttpResponse("Session Report not found", { status: 404 });
    const payload = await request.json() as Partial<SessionReport>;
    Object.assign(reportStore, payload);
    return HttpResponse.json(reportStore);
  }),
  http.post(`${sessionRoot}/report/revisions`, ({ params }) => {
    if (!reportStore || reportStore.project_id !== String(params.projectId) || reportStore.session_id !== String(params.sessionId)) return new HttpResponse("Session Report not found", { status: 404 });
    reportStore = { ...reportStore, id: `${reportStore.id}-revision-${sequence++}`, status: "ai-generated", generated_at: "2026-07-15T12:00:00Z" };
    return HttpResponse.json(reportStore, { status: 201 });
  }),
  http.get(`${sessionRoot}/conversations`, ({ params }) => HttpResponse.json({ ...conversationStore, project_id: String(params.projectId), session_id: String(params.sessionId) })),
  http.post(`${sessionRoot}/conversations/ask`, async ({ params, request }) => {
    const payload = await request.json() as { question?: string };
    const question = payload.question?.trim();
    if (!question) return new HttpResponse("Question is required", { status: 400 });
    conversationStore.project_id = String(params.projectId);
    conversationStore.session_id = String(params.sessionId);
    const now = "2026-07-15T12:00:00Z";
    conversationStore.turns.push({ id: `question-${sequence++}`, role: "researcher", content: question, citations: [], created_at: now });
    const answer = {
      id: `answer-${sequence++}`,
      role: "assistant" as const,
      content: "Participants lost confidence when the order summary disappeared and the checkout step was unclear. A compact persistent summary and clear progress indicator would preserve context and improve trust.",
      citations: synthesisEvidenceFixtures.slice(0, 2).map((evidence) => ({ id: evidence.id, document_id: evidence.document_id, document_name: evidence.document_name, speaker: evidence.speaker, location: evidence.location, excerpt: evidence.excerpt, context_result_id: evidence.context_result_id })),
      created_at: now,
    };
    conversationStore.turns.push(answer);
    return HttpResponse.json({ conversation: conversationStore, answer });
  }),
];
