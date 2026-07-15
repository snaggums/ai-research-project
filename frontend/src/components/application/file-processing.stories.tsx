import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FileDropzone } from "@/components/application/file-dropzone";
import { MetadataList } from "@/components/application/metadata-list";
import { ProcessingStatus } from "@/components/application/processing-status";

function FileDropzoneExample() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [rejection, setRejection] = React.useState("");
  return (
    <div className="grid gap-3">
      <FileDropzone
        onFilesSelected={setFiles}
        onReject={setRejection}
        selectedFiles={files}
      />
      {rejection ? <p className="text-sm text-[var(--air-color-text-error)]" role="alert">{rejection}</p> : null}
    </div>
  );
}

const meta = {
  title: "Application Foundation/File & Processing",
  component: FileDropzone,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-3xl p-6"><Story /></div>],
  args: { onFilesSelected: () => undefined },
} satisfies Meta<typeof FileDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dropzone: Story = { render: () => <FileDropzoneExample /> };

export const DisabledDropzone: Story = { args: { disabled: true } };

export const ProcessingStates: Story = {
  render: () => (
    <div className="grid gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5">
      <ProcessingStatus detail="Waiting to begin extraction" status="uploaded" />
      <ProcessingStatus detail="Extracting transcript text" progress={64} status="processing" />
      <ProcessingStatus detail="Transcript is ready to review" status="complete" />
      <ProcessingStatus detail="The file could not be processed" status="failed" />
    </div>
  ),
};

export const Metadata: Story = {
  render: () => (
    <div className="rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5">
      <MetadataList
        items={[
          { label: "Session type", value: "Interview" },
          { label: "Date", value: "July 8, 2026" },
          { label: "Duration", value: "45 minutes" },
          { label: "Records", value: "Record 1" },
          { label: "Common Components", value: "Search" },
        ]}
      />
    </div>
  ),
};

