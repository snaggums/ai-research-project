import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import type { AISettings } from "@/api/types";
import { participantHandlers } from "@/mocks/handlers/participants";
import { sessionHandlers } from "@/mocks/handlers/sessions";
import { transcriptHandlers } from "@/mocks/handlers/transcripts";
import { synthesisHandlers } from "@/mocks/handlers/synthesis";
import { recordHandlers } from "@/mocks/handlers/records";
import { transcriptCodingHandlers } from "@/mocks/handlers/transcript-coding";


export const API_BASE_URL = "http://localhost:8000/api";

export const mockAISettings: AISettings = {
  id: "00000000-0000-0000-0000-000000000001",
  provider: "mock",
  model: "mock-local",
  base_url: null,
  embedding_provider: "mock",
  embedding_model: "mock-hash-64",
  api_key_env_var: null,
  has_api_key: false,
  created_at: "2026-07-10T12:00:00Z",
  updated_at: "2026-07-10T12:00:00Z",
};

export const handlers = [
  http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/settings/ai`, () => HttpResponse.json(mockAISettings)),
  http.get(`${API_BASE_URL}/projects/:projectId/documents`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/projects/:projectId/themes`, () => HttpResponse.json([])),
  ...participantHandlers,
  ...sessionHandlers,
  ...transcriptHandlers,
  ...synthesisHandlers,
  ...recordHandlers,
  ...transcriptCodingHandlers,
];

export const server = setupServer(...handlers);
