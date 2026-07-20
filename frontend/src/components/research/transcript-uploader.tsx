import * as React from "react";

import { FileDropzone, ProcessingStatus } from "@/components/application";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatTranscriptSize, transcriptFormat } from "./transcript-presentation";

export type TranscriptUploaderState = "empty" | "file-selected" | "uploading" | "processing" | "complete" | "rejected" | "request-error";

export interface TranscriptUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  file?: File;
  heading?: string;
  onCancelUpload?: () => void;
  onChooseDifferentFile?: () => void;
  onFilesSelected?: (files: File[]) => void;
  onRemove?: () => void;
  onRetryUpload?: () => void;
  onUpload?: () => void;
  onViewTranscript?: () => void;
  progress?: number;
  rejectionMessage?: string;
  requestError?: string;
  showPdfGuidance?: boolean;
  state?: TranscriptUploaderState;
}

function FileSummary({ file }: { file: File }) {
  return <div className="w-full rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-sm text-[var(--air-color-text-secondary)]">{transcriptFormat(file.type, file.name)} · {formatTranscriptSize(file.size)}</p></div>;
}

export function TranscriptUploader({ className, file, heading = "Upload transcript", onCancelUpload, onChooseDifferentFile, onFilesSelected = () => undefined, onRemove, onRetryUpload, onUpload, onViewTranscript, progress = 50, rejectionMessage, requestError, showPdfGuidance = true, state = "empty", ...props }: TranscriptUploaderProps) {
  const descriptions: Record<TranscriptUploaderState, string> = {
    empty: "Add one transcript to this Session. You can upload another Document later.",
    "file-selected": "Review the selected file before uploading.",
    uploading: "Keep this page open while the transcript uploads.",
    processing: "Upload complete. AIR is extracting transcript text.",
    complete: "Transcript processing is complete.",
    rejected: "Choose a supported transcript file to continue.",
    "request-error": "The selected transcript is still available.",
  };
  const showDropzone = state === "empty" || state === "rejected";
  const showFile = file && ["file-selected", "uploading", "processing", "complete", "request-error"].includes(state);
  return <section className={`grid w-full max-w-[780px] gap-5 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 sm:p-8 ${className ?? ""}`} {...props}>
    <header><h2 className="text-2xl font-semibold">{heading}</h2><p className="mt-1 text-[var(--air-color-text-secondary)]">{descriptions[state]}</p></header>
    {state === "rejected" ? <Alert message={rejectionMessage ?? "Upload a .txt, .md, .docx, or text-based .pdf file up to 25 MB."} size="large" title="File type not supported" tone="error" /> : null}
    {state === "request-error" ? <Alert message={requestError ?? "Check your connection and try again. Your selected file has not been removed."} size="large" title="Transcript could not be uploaded" tone="error" /> : null}
    {showFile ? <FileSummary file={file} /> : null}
    {state === "uploading" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-5"><ProcessingStatus detail={`${Math.round(progress)}% uploaded`} label="Uploading document" progress={progress} status="processing" /></div> : null}
    {state === "processing" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-5"><ProcessingStatus detail="Extracting evidence, themes, and research objects." label="Analyzing transcript" progress={75} status="processing" /></div> : null}
    {state === "complete" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-5"><ProcessingStatus detail="Research objects are ready for review." label="Analysis complete" status="complete" /></div> : null}
    {showDropzone ? <FileDropzone accept=".txt,.md,.docx,.pdf" browseLabel="Browse files" description="or choose files from your device" helperText=".txt, .md, .docx, or .pdf · 25 MB max" label="Browse files" maxSizeBytes={25 * 1024 * 1024} multiple={false} onFilesSelected={onFilesSelected} onReject={() => undefined} title={state === "rejected" ? "Choose another transcript" : "Drag and drop transcript files"} /> : null}
    {showPdfGuidance && showDropzone ? <p className="text-sm text-[var(--air-color-text-secondary)]">PDF files must contain embedded text. Scanned PDFs requiring OCR are not supported.</p> : null}
    {state === "file-selected" ? <div className="flex justify-end gap-2"><Button onClick={onRemove} size="small" variant="text">Remove</Button><Button onClick={onUpload} size="small">Upload transcript</Button></div> : null}
    {state === "uploading" && onCancelUpload ? <div className="flex justify-end"><Button onClick={onCancelUpload} size="small" variant="text">Cancel upload</Button></div> : null}
    {state === "complete" && onViewTranscript ? <div className="flex justify-end"><Button onClick={onViewTranscript} size="small">View transcript</Button></div> : null}
    {state === "request-error" ? <div className="flex flex-wrap justify-end gap-2"><Button onClick={onChooseDifferentFile} size="small" variant="text">Choose different file</Button><Button onClick={onRetryUpload} size="small">Retry upload</Button></div> : null}
  </section>;
}
