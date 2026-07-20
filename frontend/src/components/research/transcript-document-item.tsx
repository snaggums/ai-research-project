import * as React from "react";
import { Trash2 } from "lucide-react";

import { ProcessingStatus } from "@/components/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import type { TranscriptDocumentSummary } from "@/domain/types";
import { formatTranscriptDate, formatTranscriptSize, transcriptFormat } from "./transcript-presentation";

export interface TranscriptDocumentItemProps extends React.HTMLAttributes<HTMLElement> {
  document: TranscriptDocumentSummary;
  href: string;
  isPrimary?: boolean;
  onDelete?: () => void;
  onRetry?: () => void;
  onSetPrimary?: () => void;
  retrying?: boolean;
  showActions?: boolean;
  viewLabel?: string;
}

export function TranscriptDocumentItem({ className, document, href, isPrimary = document.isPrimary, onDelete, onRetry, onSetPrimary, retrying = false, showActions = true, viewLabel = "View extracted text", ...props }: TranscriptDocumentItemProps) {
  const metadata = `${transcriptFormat(document.mimeType, document.filename)} · ${formatTranscriptSize(document.sizeBytes)}`;
  return <article className={`grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-6 ${className ?? ""}`} {...props}>
    <div className="flex flex-wrap items-start gap-4"><div className="min-w-0 flex-1"><h3 className="break-words text-xl font-semibold">{document.filename}</h3>{isPrimary ? <Badge className="mt-1" showIcon={false} tone="brand">Primary transcript</Badge> : null}<p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">{metadata}</p><p className="text-sm text-[var(--air-color-text-secondary)]">{formatTranscriptDate(document.uploadedAt)}</p></div>
      {showActions ? <div className="flex flex-wrap items-center justify-end gap-2">
        {document.status === "complete" ? <Button asChild size="small" variant="text"><a href={href}>{viewLabel}</a></Button> : null}
        {document.status === "complete" && !isPrimary && onSetPrimary ? <Button onClick={onSetPrimary} size="small">Set as primary</Button> : null}
        {document.status === "failed" && onRetry ? <Button disabled={retrying} onClick={onRetry} size="small">{retrying ? "Retrying…" : "Retry"}</Button> : null}
        {onDelete && !retrying ? <IconButton icon={<Trash2 aria-hidden="true" className="h-4 w-4" />} label="Delete transcript" onClick={onDelete} /> : null}
      </div> : null}
    </div>
    {document.status === "uploaded" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4"><ProcessingStatus detail="Waiting for processing to begin." label="Transcript uploaded" status="uploaded" /></div> : null}
    {document.status === "processing" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] p-4"><ProcessingStatus detail={retrying ? "The transcript is being submitted for processing again." : "Extracting evidence, themes, and research objects."} label={retrying ? "Retrying transcript processing" : "Analyzing transcript"} progress={retrying ? 30 : 75} status="processing" /></div> : null}
    {document.status === "complete" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4"><ProcessingStatus detail="Research objects are ready for review." label="Analysis complete" status="complete" /></div> : null}
    {document.status === "failed" ? <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-error)] bg-[var(--air-color-bg-subtle)] p-4"><ProcessingStatus detail={document.errorMessage ?? "We could not process this document."} status="failed" /></div> : null}
  </article>;
}
