import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

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
      content:
        "Participants lost confidence when the order summary disappeared and the checkout step was unclear.",
      citations: synthesisEvidenceFixtures.slice(0, 2).map((evidence) => ({
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

const meta = {
  title: "Research Objects/Session/Ask This Session Workspace",
  component: AskThisSession,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[var(--air-color-bg-canvas)] p-4 md:p-8">
        <div className="mx-auto max-w-[1120px] rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6">
          <Story />
        </div>
      </main>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Session-scoped grounded conversation. The workspace is unavailable before Session Report generation. After generation, suggested questions remain above every conversation state. New chat clears the current thread and retains suggestions.

- [Approved Desktop Figma component](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=584-16343)
- [Approved Before report state](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1161-69688)
        `,
      },
    },
    layout: "fullscreen",
  },
  args: {
    conversation: toSessionConversation(sessionConversationFixture),
    onAsk: fn(),
    onNewChat: fn(),
    onOpenContext: fn(),
    projectId: "alpha-project",
    sessionId: "mobile-checkout-test",
    suggestedQuestions: suggestedSessionQuestions,
  },
  argTypes: {
    conversation: { control: false },
    onAsk: { control: false },
    onNewChat: { control: false },
    onOpenContext: { control: false },
  },
} satisfies Meta<typeof AskThisSession>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BeforeReport: Story = {
  args: { state: "before-report" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(
        "Generate the Session Report to enable Ask this session. Suggested questions will appear after generation succeeds.",
      ),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("heading", { name: "Suggested questions" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("textbox", { name: "Ask this session" }),
    ).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Ask" })).toBeDisabled();
  },
};

export const SuggestedQuestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const askButton = canvas.getByRole("button", { name: "Ask" });
    await expect(askButton).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: suggestedSessionQuestions[0] }),
    );
    await expect(askButton).toBeEnabled();
  },
};

export const Answered: Story = {
  args: { conversation: toSessionConversation(answeredConversation) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Suggested questions" }),
    ).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "AIR answer" })).toBeVisible();
  },
};

export const NewChat: Story = {
  args: { conversation: toSessionConversation(answeredConversation) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New chat" }));
    await expect(args.onNewChat).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole("heading", { name: "AIR answer" }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByText("No conversation yet")).toBeVisible();
  },
};

export const Generating: Story = {
  args: { state: "loading" },
};

export const RecoverableError: Story = {
  args: {
    errorMessage:
      "Retrieval failed. Your question has been retained so you can try again.",
    state: "error",
  },
};
