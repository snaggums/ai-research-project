import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import {
  type AskRecordWorkspaceProps,
} from "@/components/research/ask-record-workspace";
import {
  askRecordAnsweredTurns,
  askRecordFollowUpQuestion,
  askRecordGeneratingTurns,
  askRecordInsufficientEvidenceTurns,
  askRecordSuggestedQuestions,
  emptyAskRecordSourceAvailability,
} from "@/mocks/fixtures/ask-record";
import {
  readyRecordScope,
  recordSummaries,
  recordSynthesis,
} from "@/mocks/fixtures/records";
import { alphaProject } from "@/mocks/fixtures/domain";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { RecordDetailView } from "./record-views";

const recordAskSessions = sessionApiFixtures
  .filter((session) =>
    session.related_records.some((record) => record.id === "record-1"),
  )
  .map(toSessionSummary);
const recordRootPath = `/projects/${alphaProject.id}/records`;

function RecordAskStoryPage(props: AskRecordWorkspaceProps) {
  const [activeView, setActiveView] = React.useState<
    "overview" | "knowledge" | "transcript-codes" | "ask-record"
  >("ask-record");
  return (
    <div
      onClickCapture={(event) => {
        const link = (event.target as HTMLElement).closest("a");
        if (link && !link.getAttribute("href")?.startsWith("#")) {
          event.preventDefault();
        }
      }}
    >
      <ApplicationShell
        activeProjectChildId={recordSummaries[0].id}
        activeProjectItem="records"
        context="project"
        project={{ id: alphaProject.id, name: alphaProject.name }}
      >
        <RecordDetailView
          activeView={activeView}
          askRecordProps={props}
          onViewChange={setActiveView}
          record={recordSummaries[0]}
          recordRootPath={recordRootPath}
          scope={readyRecordScope}
          sessions={recordAskSessions}
          synthesis={recordSynthesis}
        />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Records/Ask Record",
  component: RecordAskStoryPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
Desktop Record route for grounded conversation. The tab and workspace use the shared label Ask this record. Before Record Synthesis, the composer and Ask action are disabled and generated suggestions are hidden.

- [Approved Desktop Before synthesis page](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1165-1138)
- [Approved Record view tabs](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1044-65840)
        `,
      },
    },
    layout: "fullscreen",
  },
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
} satisfies Meta<typeof RecordAskStoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BeforeSynthesis: Story = {
  args: { state: "before-synthesis" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const recordTabs = canvas.getByRole("tablist", { name: "Record views" });
    await expect(
      within(recordTabs).getByRole("tab", { name: "Ask this record" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      canvas.getByRole("textbox", { name: "Ask this record" }),
    ).toBeDisabled();
  },
};

export const SuggestedQuestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const askButton = canvas.getByRole("button", { name: "Ask" });
    await expect(askButton).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: askRecordSuggestedQuestions[0] }),
    );
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
  },
};

export const GeneratingAnswer: Story = {
  args: { state: "generating", turns: askRecordGeneratingTurns },
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
