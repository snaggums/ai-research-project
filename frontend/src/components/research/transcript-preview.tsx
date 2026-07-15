import * as React from "react";

import { ProcessingStatus } from "@/components/application";
import { Alert } from "@/components/ui/alert";
import type { TranscriptDocumentDetail } from "@/domain/types";
import { formatTranscriptDate, formatTranscriptSize, transcriptFormat } from "./transcript-presentation";

export type TranscriptPreviewState = "ready" | "empty-extraction" | "processing" | "failed";

export interface TranscriptPreviewProps extends React.HTMLAttributes<HTMLElement> {
  actions?: React.ReactNode;
  document: TranscriptDocumentDetail;
  state?: TranscriptPreviewState;
}

export function TranscriptPreview({ actions, className, document, state = document.status === "processing" ? "processing" : document.status === "failed" ? "failed" : document.blocks.length ? "ready" : "empty-extraction", ...props }: TranscriptPreviewProps) {
  const metadata = `${document.isPrimary ? "Primary transcript · " : ""}${transcriptFormat(document.mimeType, document.filename)} · ${formatTranscriptSize(document.sizeBytes)}${document.processedAt ? ` · ${formatTranscriptDate(document.processedAt, "Extracted")}` : ""}`;
  return <article className={`grid gap-5 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-6 ${className ?? ""}`} {...props}>
    <header className="flex flex-wrap items-start gap-4"><div className="min-w-0 flex-1"><h2 className="break-words text-xl font-semibold sm:text-2xl">{document.filename}</h2><p className="text-sm text-[var(--air-color-text-secondary)]">{metadata}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</header>
    {state === "ready" ? <section aria-labelledby="extracted-transcript-heading" className="grid gap-5 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4 sm:p-6"><h3 className="text-xl font-semibold" id="extracted-transcript-heading">Extracted transcript</h3>{document.blocks.map((block) => <div className="grid gap-1" key={block.id}><h4 className="text-sm font-medium">{block.speaker} · {block.location}</h4><p className="leading-6">{block.text}</p></div>)}</section> : null}
    {state === "empty-extraction" ? <Alert message="The source may be empty, image-only, or unsupported. Download it to review the original file." size="large" title="No text could be extracted" tone="warning" /> : null}
    {state === "processing" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-5"><ProcessingStatus detail="Extracting evidence, themes, and research objects." label="Analyzing transcript" progress={75} status="processing" /></div> : null}
    {state === "failed" ? <Alert message="AIR could not extract text from this source. Retry or download the original file." size="large" title="Transcript extraction failed" tone="error" /> : null}
  </article>;
}
