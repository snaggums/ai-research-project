import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { TranscriptUploader } from "./transcript-uploader";

const file = new File(["Transcript content"], "mobile-checkout-interview.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
const replacementFile = new File(["Replacement transcript content"], "mobile-checkout-interview-v2.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
const meta = {
  title: "Research Objects/Transcript/Transcript Uploader",
  component: TranscriptUploader,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-4xl p-6"><Story /></div>],
  args: {
    onCancelUpload: fn(),
    onChooseDifferentFile: fn(),
    onFilesSelected: fn(),
    onRemove: fn(),
    onReplace: fn(),
    onRetryProcessing: fn(),
    onRetryUpload: fn(),
    onUpload: fn(),
  },
} satisfies Meta<typeof TranscriptUploader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const FileSelected: Story = { args: { file, state: "file-selected" } };
export const Uploading: Story = { args: { file, progress: 50, state: "uploading" } };
export const Processing: Story = { args: { file, state: "processing" } };
export const Complete: Story = { args: { file, onViewTranscript: fn(), state: "complete" } };
export const Rejected: Story = { args: { state: "rejected" } };
export const RequestError: Story = { args: { file, onRetryUpload: fn(), state: "request-error" } };
export const SelectFile: Story = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.upload(canvas.getByLabelText("Browse files"), file); } };
export const ReplacementSelected: Story = { args: { file: replacementFile, state: "replacement-selected" } };
export const ReplacementUploading: Story = { args: { file: replacementFile, progress: 50, state: "replacement-uploading" } };
export const ReplacementProcessing: Story = { args: { file: replacementFile, state: "replacement-processing" } };
export const ReplacementRequestError: Story = { args: { file: replacementFile, state: "replacement-request-error" } };
export const ReplacementProcessingError: Story = { args: { file: replacementFile, state: "replacement-processing-error" } };
export const ConfirmReplacement: Story = {
  args: { file: replacementFile, state: "replacement-selected" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Replace transcript" }));
    await expect(args.onReplace).toHaveBeenCalledOnce();
  },
};
export const CancelReplacement: Story = {
  args: { file: replacementFile, state: "replacement-selected" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};
