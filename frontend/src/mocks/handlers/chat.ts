import { http, HttpResponse } from "msw";

import { askProjectChatResponse } from "@/mocks/fixtures/ask-project";

export const CHAT_API_BASE_URL = "http://localhost:8000/api";

export const chatHandlers = [
  http.post(`${CHAT_API_BASE_URL}/projects/:projectId/chat`, async ({ request }) => {
    const payload = await request.json() as { question?: string };
    const question = payload.question?.trim();
    if (!question) {
      return HttpResponse.json(
        { detail: "Ask a question before starting chat." },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      ...askProjectChatResponse,
      question,
    });
  }),
];
