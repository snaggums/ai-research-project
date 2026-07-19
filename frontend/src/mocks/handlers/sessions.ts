import { http, HttpResponse } from "msw";

import type { Session, SessionPayload } from "@/api/types";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { mockParticipantsById } from "@/mocks/handlers/participants";

export const SESSIONS_API_BASE_URL = "http://localhost:8000/api";
let sessionStore: Session[] = [];
let sequence = 1;

export function resetSessionStore() {
  sessionStore = structuredClone(sessionApiFixtures);
  sequence = 1;
}
resetSessionStore();

const participantsFor = (ids: string[]) => mockParticipantsById(ids);
const recordNames: Record<string, string> = { "record-1": "Record 1", "record-2": "Record 2", "record-3": "Record 3" };
const recordsFor = (ids: string[] = []) => ids.map((id) => ({ id, name: recordNames[id] ?? id }));

export const sessionHandlers = [
  http.get(`${SESSIONS_API_BASE_URL}/projects/:projectId/sessions`, ({ params, request }) => {
    const projectId = String(params.projectId);
    if (projectId === "missing-project") return new HttpResponse("Project not found", { status: 404 });
    const query = new URL(request.url).searchParams;
    const search = query.get("q")?.trim().toLowerCase() ?? "";
    const sessions = sessionStore.map((session) => ({
      ...session,
      participants: participantsFor(session.participant_ids),
    })).filter((session) => {
      const searchable = `${session.title} ${session.transcript_names.join(" ")} ${session.participants.map((participant) => `${participant.first_name} ${participant.last_name}`).join(" ")}`.toLowerCase();
      const date = session.starts_at?.slice(0, 10) ?? "";
      return session.project_id === projectId
        && (!search || searchable.includes(search))
        && (!query.get("type") || session.type === query.get("type"))
        && (!query.get("transcript_status") || session.transcript_status === query.get("transcript_status"))
        && (!query.get("analysis_status") || session.theme_status === query.get("analysis_status") || session.report_status === query.get("analysis_status"))
        && (!query.get("date") || date === query.get("date"))
        && (!query.get("record_id") || session.related_records.some(({ id }) => id === query.get("record_id")))
        && (!query.get("common_component_id") || session.related_common_components.some(({ id }) => id === query.get("common_component_id")));
    });
    return HttpResponse.json(sessions);
  }),
  http.post(`${SESSIONS_API_BASE_URL}/projects/:projectId/sessions`, async ({ params, request }) => {
    const payload = await request.json() as SessionPayload;
    const now = "2026-07-14T18:00:00Z";
    const session: Session = {
      id: `session-${sequence++}`, project_id: String(params.projectId), title: payload.title, type: payload.type,
      starts_at: payload.starts_at ?? null, duration_minutes: payload.duration_minutes ?? null, description: payload.description ?? null,
      participant_ids: payload.participant_ids, participants: participantsFor(payload.participant_ids), document_count: 0, transcript_names: [], transcript_status: "none", has_primary_transcript: false,
      theme_status: "not-generated", report_status: "not-generated", related_records: recordsFor(payload.related_record_ids), related_common_components: [], created_at: now, updated_at: now,
    };
    sessionStore.push(session);
    return HttpResponse.json(session, { status: 201 });
  }),
  http.get(`${SESSIONS_API_BASE_URL}/projects/:projectId/sessions/:sessionId`, ({ params }) => {
    const session = sessionStore.find((item) => item.project_id === String(params.projectId) && item.id === String(params.sessionId));
    return session
      ? HttpResponse.json({ ...session, participants: participantsFor(session.participant_ids) })
      : new HttpResponse("Session not found", { status: 404 });
  }),
  http.patch(`${SESSIONS_API_BASE_URL}/projects/:projectId/sessions/:sessionId`, async ({ params, request }) => {
    const index = sessionStore.findIndex((item) => item.project_id === String(params.projectId) && item.id === String(params.sessionId));
    if (index < 0) return new HttpResponse("Session not found", { status: 404 });
    const payload = await request.json() as SessionPayload;
    sessionStore[index] = { ...sessionStore[index], title: payload.title, type: payload.type, starts_at: payload.starts_at ?? null, duration_minutes: payload.duration_minutes ?? null, description: payload.description ?? null, participant_ids: payload.participant_ids, participants: participantsFor(payload.participant_ids), related_records: recordsFor(payload.related_record_ids), updated_at: "2026-07-14T18:00:00Z" };
    return HttpResponse.json(sessionStore[index]);
  }),
  http.delete(`${SESSIONS_API_BASE_URL}/projects/:projectId/sessions/:sessionId`, ({ params }) => {
    const index = sessionStore.findIndex((item) => item.project_id === String(params.projectId) && item.id === String(params.sessionId));
    if (index < 0) return new HttpResponse("Session not found", { status: 404 });
    sessionStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
