import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

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
  parameters: { layout: "fullscreen" },
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

export const SuggestedQuestions: Story = {};

export const AnsweredWithMultipleCitations: Story = {
  args: {
    state: "answered",
    turns: askRecordAnsweredTurns,
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
