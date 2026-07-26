import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

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
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { RecordDetailView } from "./record-views";

const recordAskSessions = sessionApiFixtures
  .filter((session) =>
    session.related_records.some((record) => record.id === "record-1"),
  )
  .map(toSessionSummary);

function RecordAskStoryPage(props: AskRecordWorkspaceProps) {
  const [activeView, setActiveView] = React.useState<
    "overview" | "knowledge" | "ask-record"
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
        activeGlobalItem="records"
        activeGlobalSubItem={recordSummaries[0].id}
        context="workspace"
      >
        <RecordDetailView
          activeView={activeView}
          askRecordProps={props}
          onViewChange={setActiveView}
          record={recordSummaries[0]}
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
  parameters: { layout: "fullscreen" },
  args: {
    onAsk: fn(),
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

export const SuggestedQuestions: Story = {};

export const AnsweredWithMultipleCitations: Story = {
  args: {
    state: "answered",
    turns: askRecordAnsweredTurns,
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
