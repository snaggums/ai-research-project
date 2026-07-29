import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { toSessionConversation } from "@/adapters/synthesis";
import type { SessionConversation } from "@/api/types";
import {
  sessionConversationFixture,
  suggestedSessionQuestions,
  synthesisEvidenceFixtures,
} from "@/mocks/fixtures/synthesis";
import { AskThisSession } from "./ask-this-session";

const answeredConversation: SessionConversation = {
  ...sessionConversationFixture,
  turns: [
    {
      id: "session-question",
      role: "researcher",
      content: suggestedSessionQuestions[0],
      citations: [],
      created_at: "2026-07-15T12:00:00Z",
    },
    {
      id: "session-answer",
      role: "assistant",
      content: "Participants wanted the order summary to remain visible.",
      citations: synthesisEvidenceFixtures.slice(0, 1).map((evidence) => ({
        id: evidence.id,
        document_id: evidence.document_id,
        document_name: evidence.document_name,
        speaker: evidence.speaker,
        location: evidence.location,
        excerpt: evidence.excerpt,
        context_result_id: evidence.context_result_id,
      })),
      created_at: "2026-07-15T12:00:01Z",
    },
  ],
};

const baseProps = {
  onAsk: () => undefined,
  projectId: "alpha-project",
  sessionId: "mobile-checkout-test",
  suggestedQuestions: suggestedSessionQuestions,
};

describe("Ask this Session Storybook component", () => {
  it("keeps the workspace unavailable before Session Report generation", () => {
    render(<AskThisSession {...baseProps} state="before-report" />);

    expect(
      screen.getByText(
        "Generate the Session Report to enable Ask this session. Suggested questions will appear after generation succeeds.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Suggested questions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Ask this session" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ask" })).toBeDisabled();
  });

  it("enables Ask after a suggested question is selected", async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn();
    render(<AskThisSession {...baseProps} onAsk={onAsk} />);

    const askButton = screen.getByRole("button", { name: "Ask" });
    expect(askButton).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: suggestedSessionQuestions[0] }),
    );
    expect(askButton).toBeEnabled();
    await user.click(askButton);
    expect(onAsk).toHaveBeenCalledWith(suggestedSessionQuestions[0]);
  });

  it("starts a new chat and keeps suggested questions available", async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();
    render(
      <AskThisSession
        {...baseProps}
        conversation={toSessionConversation(answeredConversation)}
        onNewChat={onNewChat}
      />,
    );

    expect(screen.getByRole("heading", { name: "AIR answer" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New chat" }));
    expect(onNewChat).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("heading", { name: "AIR answer" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Suggested questions" }),
    ).toBeInTheDocument();
  });
});
