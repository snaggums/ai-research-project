import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within } from "storybook/test";

import { TranscriptUploader } from "./transcript-uploader";

const file = new File(["Transcript content"], "mobile-checkout-interview.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
const meta = { title: "Research Objects/Transcript/Transcript Uploader", component: TranscriptUploader, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-4xl p-6"><Story /></div>], args: { onFilesSelected: fn(), onUpload: fn() } } satisfies Meta<typeof TranscriptUploader>;
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
