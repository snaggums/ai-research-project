import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  askProjectAnsweredTurns,
  askProjectGeneratingTurns,
  askProjectInsufficientEvidenceTurns,
  askProjectQuestion,
  askProjectSuggestedQuestions,
  emptyAskProjectSourceAvailability,
} from "@/mocks/fixtures/ask-project";
import { AskProjectWorkspace } from "./ask-project-workspace";

const meta = {
  title: "Research Objects/Project/Ask Project Workspace",
  component: AskProjectWorkspace,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[var(--air-color-bg-canvas)] p-4 md:p-8">
        <div className="mx-auto max-w-[1120px]">
          <Story />
        </div>
      </main>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Project-scoped grounded question workspace. It searches every Session in the active Project with a searchable active Transcript and identifies the source Session for every cited passage.

- Project citations omit redundant Project metadata while retaining Session, Transcript, speaker, timestamp, and excerpt.
- Suggested questions fill the composer without submitting.
- Ask remains disabled until a suggested question is selected or a custom question is entered.
- New chat clears the current conversation and retains suggested questions.
- Unsupported conclusions are withheld and partially relevant evidence is labeled in text.
- The no-source state explains why grounded answers are unavailable and links back to Sessions.
- [Approved Desktop Figma contract](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1142-8)
        `,
      },
    },
    layout: "fullscreen",
  },
  args: {
    onAsk: fn(),
    onNewChat: fn(),
    onOpenSessions: fn(),
    onOpenTranscriptContext: fn(),
    onRetry: fn(),
    onSuggestedQuestion: fn(),
    state: "suggested",
    suggestedQuestions: askProjectSuggestedQuestions,
  },
  argTypes: {
    onAsk: { control: false },
    onNewChat: { control: false },
    onOpenSessions: { control: false },
    onOpenTranscriptContext: { control: false },
    onRetry: { control: false },
    onSuggestedQuestion: { control: false },
    turns: { control: false },
  },
} satisfies Meta<typeof AskProjectWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuggestedQuestions: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(
        "Select a suggested question or enter your own question to enable Ask.",
      ),
    ).toBeVisible();
    const askButton = canvas.getByRole("button", { name: "Ask" });
    await expect(askButton).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: askProjectSuggestedQuestions[0] }),
    );
    await expect(
      canvas.getByRole("textbox", { name: "Ask this project" }),
    ).toHaveValue(askProjectSuggestedQuestions[0]);
    await expect(args.onSuggestedQuestion).toHaveBeenCalledWith(
      askProjectSuggestedQuestions[0],
    );
    await expect(args.onAsk).not.toHaveBeenCalled();
    await expect(askButton).toBeEnabled();
  },
};

export const Answered: Story = {
  args: {
    state: "answered",
    turns: askProjectAnsweredTurns,
  },
};

export const NewChat: Story = {
  args: {
    state: "answered",
    turns: askProjectAnsweredTurns,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New chat" }));
    await expect(args.onNewChat).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole("list", { name: "Ask Project conversation" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { name: "Suggested questions" }),
    ).toBeVisible();
  },
};

export const GeneratingAnswer: Story = {
  args: {
    state: "generating",
    turns: askProjectGeneratingTurns,
  },
};

export const RecoverableError: Story = {
  args: {
    initialQuestion: askProjectQuestion,
    state: "recoverable-error",
    turns: askProjectGeneratingTurns,
  },
};

export const InsufficientEvidence: Story = {
  args: {
    state: "insufficient-evidence",
    turns: askProjectInsufficientEvidenceTurns,
  },
};

export const NoSearchableSources: Story = {
  args: {
    sourceAvailability: emptyAskProjectSourceAvailability,
    state: "no-sources",
  },
};
