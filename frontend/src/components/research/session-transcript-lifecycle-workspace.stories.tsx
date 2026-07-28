import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { toTranscriptDocumentSummary } from "@/adapters/transcripts";
import { transcriptApiFixtures } from "@/mocks/fixtures/transcripts";
import type { TranscriptDependencySummary } from "./transcript-lifecycle-dialog";
import {
  SessionTranscriptLifecycleWorkspace,
  type SessionTranscriptLifecycleWorkspaceProps,
} from "./session-transcript-lifecycle-workspace";

const activeDocument = toTranscriptDocumentSummary(transcriptApiFixtures[0]);
const processingDocument = toTranscriptDocumentSummary(transcriptApiFixtures[1]);
const linkedTranscriptDependencies: TranscriptDependencySummary = {
  acceptedHighlightCount: 3,
  uncodedHighlightCount: 1,
  codeSuggestionRunCount: 2,
  sessionReportCount: 1,
  recordSynthesisCount: 1,
};
const replacementFile = new File(
  ["Replacement transcript content"],
  "mobile-checkout-interview-v2.docx",
  { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
);
const legacyDocument = {
  ...activeDocument,
  id: "legacy-checkout-transcript",
  filename: "legacy-checkout-interview.docx",
  lifecycleStatus: "legacy" as const,
  isPrimary: false,
};
const removedDocument = {
  ...activeDocument,
  id: "removed-checkout-transcript",
  filename: "mobile-checkout-interview-v1.docx",
  lifecycleStatus: "tombstoned" as const,
  isPrimary: false,
};

function InteractiveReplacement(props: SessionTranscriptLifecycleWorkspaceProps) {
  const [replacement, setReplacement] = React.useState(props.replacement);
  return (
    <SessionTranscriptLifecycleWorkspace
      {...props}
      onRemoveReplacement={() => setReplacement(undefined)}
      onRequestReplacement={() => setReplacement({ file: replacementFile, state: "replacement-selected" })}
      replacement={replacement}
    />
  );
}

const meta = {
  title: "Research Objects/Transcript/Session Transcript Lifecycle Workspace",
  component: SessionTranscriptLifecycleWorkspace,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>],
  args: {
    activeDocument,
    dependencies: linkedTranscriptDependencies,
    onConfirmDelete: fn(),
    onConfirmReplacement: fn(),
    onRequestReplacement: fn(),
    onSearch: fn(),
  },
} satisfies Meta<typeof SessionTranscriptLifecycleWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Empty: Story = { args: { activeDocument: undefined } };
export const DeletedWithTranscriptHistory: Story = {
  args: {
    activeDocument: undefined,
    legacyDocuments: [legacyDocument],
    removedDocuments: [removedDocument],
  },
};
export const Processing: Story = { args: { activeDocument: processingDocument } };
export const ReplaceSelected: Story = {
  args: { replacement: { file: replacementFile, state: "replacement-selected" } },
};
export const Replacing: Story = {
  args: { replacement: { file: replacementFile, progress: 50, state: "replacement-processing" } },
};
export const ReplacementRequestError: Story = {
  args: { replacement: { file: replacementFile, state: "replacement-request-error" } },
};
export const ReplacementProcessingError: Story = {
  args: { replacement: { file: replacementFile, state: "replacement-processing-error" } },
};
export const DeleteError: Story = {
  args: {
    actionError: "The active Transcript and its evidence are unchanged. Retry, or return to the Session and try again.",
  },
};
export const LegacyTranscripts: Story = {
  args: { legacyDocuments: [legacyDocument] },
};
export const InteractiveReplaceAndConfirm: Story = {
  render: (args) => <InteractiveReplacement {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Replace transcript" }));
    await expect(canvas.getByText("mobile-checkout-interview-v2.docx")).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: "Replace transcript" }).at(-1)!);
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: "Replace transcript with linked evidence?" })).toBeVisible();
  },
};
export const InteractiveCancelReplacement: Story = {
  args: { replacement: { file: replacementFile, state: "replacement-selected" } },
  render: (args) => <InteractiveReplacement {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(canvas.queryByText("mobile-checkout-interview-v2.docx")).not.toBeInTheDocument();
    await expect(canvas.getByText(activeDocument.filename)).toBeVisible();
  },
};
export const OpenDeleteConfirmation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Delete transcript" }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: "Delete transcript with linked evidence?" })).toBeVisible();
    await expect(body.getByText("3")).toBeVisible();
  },
};
