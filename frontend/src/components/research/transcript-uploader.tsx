import * as React from "react";

import { FileDropzone, ProcessingStatus } from "@/components/application";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatTranscriptSize, transcriptFormat } from "./transcript-presentation";

export type TranscriptUploaderState =
  | "empty"
  | "file-selected"
  | "uploading"
  | "processing"
  | "complete"
  | "rejected"
  | "request-error"
  | "replacement-selected"
  | "replacement-uploading"
  | "replacement-processing"
  | "replacement-request-error"
  | "replacement-processing-error";

export type TranscriptFileSummary = Pick<File, "name" | "size" | "type">;

export interface TranscriptUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  file?: TranscriptFileSummary;
  heading?: string;
  onCancelUpload?: () => void;
  onChooseDifferentFile?: () => void;
  onFilesSelected?: (files: File[]) => void;
  onRemove?: () => void;
  onReplace?: () => void;
  onRetryProcessing?: () => void;
  onRetryUpload?: () => void;
  onUpload?: () => void;
  onViewTranscript?: () => void;
  progress?: number;
  rejectionMessage?: string;
  requestError?: string;
  showPdfGuidance?: boolean;
  state?: TranscriptUploaderState;
}

function FileSummary({ file }: { file: TranscriptFileSummary }) {
  return (
    <div className="w-full rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4">
      <p className="truncate text-sm font-medium">{file.name}</p>
      <p className="text-sm text-[var(--air-color-text-secondary)]">
        {transcriptFormat(file.type, file.name)} · {formatTranscriptSize(file.size)}
      </p>
    </div>
  );
}

export function TranscriptUploader({
  className,
  file,
  heading,
  onCancelUpload,
  onChooseDifferentFile,
  onFilesSelected = () => undefined,
  onRemove,
  onReplace,
  onRetryProcessing,
  onRetryUpload,
  onUpload,
  onViewTranscript,
  progress = 50,
  rejectionMessage,
  requestError,
  showPdfGuidance = true,
  state = "empty",
  ...props
}: TranscriptUploaderProps) {
  const replacement = state.startsWith("replacement-");
  const resolvedHeading = heading ?? (replacement ? "Replace transcript" : "Upload transcript");
  const descriptions: Record<TranscriptUploaderState, string> = {
    empty: "Add the Transcript for this Session. A Session can have one active Transcript.",
    "file-selected": "Review the selected file before uploading.",
    uploading: "Keep this page open while the transcript uploads.",
    processing: "Upload complete. AIR is extracting transcript text.",
    complete: "Transcript processing is complete.",
    rejected: "Choose a supported transcript file to continue.",
    "request-error": "The selected transcript is still available.",
    "replacement-selected": "Review the replacement before continuing. The current Transcript remains active until processing succeeds.",
    "replacement-uploading": "The current Transcript remains active while the replacement uploads.",
    "replacement-processing": "The current Transcript remains active while AIR processes the replacement.",
    "replacement-request-error": "The selected replacement is still available. The current Transcript has not changed.",
    "replacement-processing-error": "The current Transcript is still active. Choose another file or retry processing.",
  };
  const showDropzone = state === "empty" || state === "rejected";
  const showFile = file && [
    "file-selected",
    "uploading",
    "processing",
    "complete",
    "request-error",
    "replacement-selected",
    "replacement-uploading",
    "replacement-processing",
    "replacement-request-error",
    "replacement-processing-error",
  ].includes(state);

  return (
    <section
      className={`grid w-full max-w-[780px] gap-5 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 sm:p-8 ${className ?? ""}`}
      {...props}
    >
      <header>
        <h2 className="text-2xl font-semibold">{resolvedHeading}</h2>
        <p className="mt-1 text-[var(--air-color-text-secondary)]">{descriptions[state]}</p>
      </header>

      {state === "rejected" ? (
        <Alert
          message={rejectionMessage ?? "Upload a .txt, .md, .docx, or text-based .pdf file up to 25 MB."}
          size="large"
          title="File type not supported"
          tone="error"
        />
      ) : null}
      {state === "request-error" ? (
        <Alert
          message={requestError ?? "Check your connection and try again. Your selected file has not been removed."}
          size="large"
          title="Transcript could not be uploaded"
          tone="error"
        />
      ) : null}
      {state === "replacement-request-error" ? (
        <Alert
          message={requestError ?? "Check your connection and retry. The active Transcript and its evidence are unchanged."}
          size="large"
          title="Replacement could not be uploaded"
          tone="error"
        />
      ) : null}
      {state === "replacement-processing-error" ? (
        <Alert
          message={requestError ?? "AIR could not extract a usable Transcript from the replacement file."}
          size="large"
          title="Replacement could not be processed"
          tone="error"
        />
      ) : null}

      {showFile ? <FileSummary file={file} /> : null}
      {state === "uploading" || state === "replacement-uploading" ? (
        <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-5">
          <ProcessingStatus
            detail={`${Math.round(progress)}% uploaded`}
            label={replacement ? "Uploading replacement" : "Uploading document"}
            progress={progress}
            status="processing"
          />
        </div>
      ) : null}
      {state === "processing" ? (
        <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-5">
          <ProcessingStatus detail="Extracting evidence, themes, and research objects." label="Analyzing transcript" progress={75} status="processing" />
        </div>
      ) : null}
      {state === "replacement-processing" ? (
        <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-5">
          <ProcessingStatus detail="Validating and extracting the replacement Transcript." label="Analyzing replacement" progress={75} status="processing" />
        </div>
      ) : null}
      {state === "complete" ? (
        <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-5">
          <ProcessingStatus detail="Research objects are ready for review." label="Analysis complete" status="complete" />
        </div>
      ) : null}

      {showDropzone ? (
        <FileDropzone
          accept=".txt,.md,.docx,.pdf"
          browseLabel="Browse files"
          description="or choose files from your device"
          helperText=".txt, .md, .docx, or .pdf · 25 MB max"
          label="Browse files"
          maxSizeBytes={25 * 1024 * 1024}
          multiple={false}
          onFilesSelected={onFilesSelected}
          onReject={() => undefined}
          title={state === "rejected" ? "Choose another transcript" : "Drag and drop transcript files"}
        />
      ) : null}
      {showPdfGuidance && showDropzone ? (
        <p className="text-sm text-[var(--air-color-text-secondary)]">
          PDF files must contain embedded text. Scanned PDFs requiring OCR are not supported.
        </p>
      ) : null}

      {state === "file-selected" ? (
        <div className="flex justify-end gap-2">
          <Button onClick={onRemove} size="small" variant="text">Remove</Button>
          <Button onClick={onUpload} size="small">Upload transcript</Button>
        </div>
      ) : null}
      {state === "replacement-selected" ? (
        <div className="flex justify-end gap-2">
          <Button onClick={onRemove} size="small" variant="text">Cancel</Button>
          <Button onClick={onReplace} size="small">Replace transcript</Button>
        </div>
      ) : null}
      {(state === "uploading" || state === "replacement-uploading") && onCancelUpload ? (
        <div className="flex justify-end">
          <Button onClick={onCancelUpload} size="small" variant="text">Cancel upload</Button>
        </div>
      ) : null}
      {state === "complete" && onViewTranscript ? (
        <div className="flex justify-end">
          <Button onClick={onViewTranscript} size="small">View transcript</Button>
        </div>
      ) : null}
      {state === "request-error" ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onChooseDifferentFile} size="small" variant="text">Choose different file</Button>
          <Button onClick={onRetryUpload} size="small">Retry upload</Button>
        </div>
      ) : null}
      {state === "replacement-request-error" ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onChooseDifferentFile} size="small" variant="text">Choose different file</Button>
          <Button onClick={onRetryUpload} size="small">Retry replacement</Button>
        </div>
      ) : null}
      {state === "replacement-processing-error" ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onChooseDifferentFile} size="small" variant="text">Choose another file</Button>
          <Button onClick={onRetryProcessing} size="small">Retry processing</Button>
        </div>
      ) : null}
    </section>
  );
}
