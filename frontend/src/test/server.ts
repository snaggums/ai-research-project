import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { participantHandlers } from "@/mocks/handlers/participants";
import { sessionHandlers } from "@/mocks/handlers/sessions";
import { transcriptHandlers } from "@/mocks/handlers/transcripts";
import { synthesisHandlers } from "@/mocks/handlers/synthesis";
import { recordHandlers } from "@/mocks/handlers/records";
import { settingsHandlers } from "@/mocks/handlers/settings";
import { transcriptCodingHandlers } from "@/mocks/handlers/transcript-coding";
import { chatHandlers } from "@/mocks/handlers/chat";


export const API_BASE_URL = "http://localhost:8000/api";

export const handlers = [
  http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/projects/:projectId/documents`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/projects/:projectId/themes`, () => HttpResponse.json([])),
  ...participantHandlers,
  ...sessionHandlers,
  ...transcriptHandlers,
  ...synthesisHandlers,
  ...recordHandlers,
  ...settingsHandlers,
  ...transcriptCodingHandlers,
  ...chatHandlers,
];

export const server = setupServer(...handlers);
