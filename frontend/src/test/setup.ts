import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./server";
import { resetParticipantStore } from "@/mocks/handlers/participants";
import { resetSessionStore } from "@/mocks/handlers/sessions";
import { resetTranscriptStore } from "@/mocks/handlers/transcripts";
import { resetSynthesisStore } from "@/mocks/handlers/synthesis";
import { resetRecordStore } from "@/mocks/handlers/records";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetParticipantStore();
  resetSessionStore();
  resetTranscriptStore();
  resetSynthesisStore();
  resetRecordStore();
});

afterAll(() => server.close());
