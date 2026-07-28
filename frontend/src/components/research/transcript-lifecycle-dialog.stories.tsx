import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { TranscriptLifecycleDialog, type TranscriptDependencySummary } from "./transcript-lifecycle-dialog";

const linkedTranscriptDependencies: TranscriptDependencySummary = {
  acceptedHighlightCount: 3,
  uncodedHighlightCount: 1,
  codeSuggestionRunCount: 2,
  sessionReportCount: 1,
  recordSynthesisCount: 1,
};

const meta = {
  title: "Research Objects/Transcript/Transcript Lifecycle Dialog",
  component: TranscriptLifecycleDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    defaultOpen: true,
    filename: "mobile-checkout-interview.docx",
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof TranscriptLifecycleDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReplaceWithoutDependencies: Story = {
  args: { action: "replace" },
};

export const ReplaceWithDependencies: Story = {
  args: { action: "replace", dependencies: linkedTranscriptDependencies },
};

export const DeleteWithoutDependencies: Story = {
  args: { action: "delete" },
};

export const DeleteWithDependencies: Story = {
  args: { action: "delete", dependencies: linkedTranscriptDependencies },
};

export const OpenAndCancel: Story = {
  args: {
    action: "delete",
    defaultOpen: false,
    dependencies: linkedTranscriptDependencies,
    trigger: <Button>Delete transcript</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Delete transcript" }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: "Delete transcript with linked evidence?" })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Cancel" }));
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
