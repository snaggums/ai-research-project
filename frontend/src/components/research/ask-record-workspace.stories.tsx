import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  askRecordAnsweredTurns,
  askRecordFollowUpQuestion,
  askRecordGeneratingTurns,
  askRecordInsufficientEvidenceTurns,
  askRecordSuggestedQuestions,
  emptyAskRecordSourceAvailability,
} from "@/mocks/fixtures/ask-record";
import { AskRecordWorkspace } from "./ask-record-workspace";

const meta = {
  title: "Research Objects/Record/Ask Record Workspace",
  component: AskRecordWorkspace,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
Record-scoped grounded conversation across Record Knowledge, reviewed or approved Session Reports, and related transcripts. Ask this record is unavailable until Record Synthesis has been generated. Suggested questions remain above the conversation, and New chat clears the current thread while retaining suggestions.

- [Approved Desktop Figma component](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=945-62359)
- [Approved Before synthesis state](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1161-69874)
        `,
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[var(--air-color-bg-canvas)] p-4 md:p-8">
        <div className="mx-auto max-w-[1120px]">
          <Story />
        </div>
      </main>
    ),
  ],
  args: {
    onAsk: fn(),
    onNewChat: fn(),
    onOpenRelatedSessions: fn(),
    onOpenTranscriptContext: fn(),
    onRetry: fn(),
    onSuggestedQuestion: fn(),
    state: "suggested",
    suggestedQuestions: askRecordSuggestedQuestions,
  },
} satisfies Meta<typeof AskRecordWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BeforeSynthesis: Story = {
  args: { state: "before-synthesis" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(
        "Generate Record Synthesis to enable Ask this record. Suggested questions will appear after synthesis succeeds.",
      ),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("heading", { name: "Suggested questions" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("textbox", { name: "Ask this record" }),
    ).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Ask" })).toBeDisabled();
  },
};

export const SuggestedQuestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Ask this record" }),
    ).toBeVisible();
    const askButton = canvas.getByRole("button", { name: "Ask" });
    await expect(askButton).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: askRecordSuggestedQuestions[0] }),
    );
    await expect(
      canvas.getByRole("textbox", { name: "Ask this record" }),
    ).toHaveValue(askRecordSuggestedQuestions[0]);
    await expect(askButton).toBeEnabled();
  },
};

export const AnsweredWithMultipleCitations: Story = {
  args: {
    state: "answered",
    turns: askRecordAnsweredTurns,
  },
};

export const NewChat: Story = {
  args: {
    state: "answered",
    turns: askRecordAnsweredTurns,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New chat" }));
    await expect(args.onNewChat).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole("list", { name: "Ask Record conversation" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { name: "Suggested questions" }),
    ).toBeVisible();
  },
};

export const GeneratingAnswer: Story = {
  args: {
    state: "generating",
    turns: askRecordGeneratingTurns,
  },
};

export const RecoverableError: Story = {
  args: {
    initialQuestion: askRecordFollowUpQuestion,
    state: "recoverable-error",
    turns: askRecordGeneratingTurns,
  },
};

export const InsufficientEvidence: Story = {
  args: {
    state: "insufficient-evidence",
    turns: askRecordInsufficientEvidenceTurns,
  },
};

export const NoSearchableRecordSources: Story = {
  args: {
    sourceAvailability: emptyAskRecordSourceAvailability,
    state: "no-sources",
  },
};
