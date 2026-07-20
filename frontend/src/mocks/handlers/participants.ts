import { http, HttpResponse } from "msw";

import type { Participant, ParticipantPayload } from "@/api/types";
import { participantApiFixtures } from "@/mocks/fixtures/participants";

export const PARTICIPANTS_API_BASE_URL = "http://localhost:8000/api";

let participantStore: Participant[] = [];
let sequence = 1;

export function resetParticipantStore() {
  participantStore = structuredClone(participantApiFixtures);
  sequence = 1;
}

resetParticipantStore();

function projectParticipants(projectId: string) {
  return participantStore.filter((participant) => participant.project_id === projectId);
}

export function mockParticipantsById(ids: string[]) {
  return participantStore.filter((participant) => ids.includes(participant.id));
}

export const participantHandlers = [
  http.get(`${PARTICIPANTS_API_BASE_URL}/projects/:projectId/participants`, ({ params, request }) => {
    const projectId = String(params.projectId);
    if (projectId === "missing-project") return new HttpResponse("Project not found", { status: 404 });
    const search = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    const participants = projectParticipants(projectId).filter((participant) =>
      `${participant.first_name} ${participant.last_name} ${participant.email ?? ""}`.toLowerCase().includes(search),
    );
    return HttpResponse.json(participants);
  }),
  http.post(`${PARTICIPANTS_API_BASE_URL}/projects/:projectId/participants`, async ({ params, request }) => {
    const projectId = String(params.projectId);
    const payload = await request.json() as ParticipantPayload;
    const now = "2026-07-14T16:00:00Z";
    const participant: Participant = {
      id: `participant-${sequence++}`,
      project_id: projectId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email ?? null,
      organization: payload.organization ?? null,
      role: payload.role ?? null,
      record_ids: payload.record_ids,
      researcher_notes: payload.researcher_notes ?? null,
      session_count: 0,
      created_at: now,
      updated_at: now,
    };
    participantStore.push(participant);
    return HttpResponse.json(participant, { status: 201 });
  }),
  http.get(`${PARTICIPANTS_API_BASE_URL}/projects/:projectId/participants/:participantId`, ({ params }) => {
    const participant = participantStore.find((item) =>
      item.project_id === String(params.projectId) && item.id === String(params.participantId),
    );
    return participant
      ? HttpResponse.json(participant)
      : new HttpResponse("Participant not found", { status: 404 });
  }),
  http.patch(`${PARTICIPANTS_API_BASE_URL}/projects/:projectId/participants/:participantId`, async ({ params, request }) => {
    const index = participantStore.findIndex((item) =>
      item.project_id === String(params.projectId) && item.id === String(params.participantId),
    );
    if (index < 0) return new HttpResponse("Participant not found", { status: 404 });
    const payload = await request.json() as ParticipantPayload;
    participantStore[index] = {
      ...participantStore[index],
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email ?? null,
      organization: payload.organization ?? null,
      role: payload.role ?? null,
      record_ids: payload.record_ids,
      researcher_notes: payload.researcher_notes ?? null,
      updated_at: "2026-07-14T16:00:00Z",
    };
    return HttpResponse.json(participantStore[index]);
  }),
  http.delete(`${PARTICIPANTS_API_BASE_URL}/projects/:projectId/participants/:participantId`, ({ params }) => {
    const index = participantStore.findIndex((item) =>
      item.project_id === String(params.projectId) && item.id === String(params.participantId),
    );
    if (index < 0) return new HttpResponse("Participant not found", { status: 404 });
    participantStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
