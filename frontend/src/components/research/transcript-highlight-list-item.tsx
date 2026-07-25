import * as React from "react";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TranscriptCodeChip } from "./transcript-code-chip";
import type { TranscriptHighlightValue } from "./transcript-coding-types";

export interface TranscriptHighlightListItemProps {
  className?: string;
  highlight: TranscriptHighlightValue;
  onDelete?: () => void;
  onEditCodes?: () => void;
  onOpenInTranscript?: () => void;
  onRemoveCode?: (codeId: string) => void;
}

export function TranscriptHighlightListItem({
  className,
  highlight,
  onDelete,
  onEditCodes,
  onOpenInTranscript,
  onRemoveCode,
}: TranscriptHighlightListItemProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <article
      className={cn(
        "grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">
            {[highlight.evidence.speaker, highlight.evidence.location].filter(Boolean).join(" • ")}
          </h4>
          {highlight.provenance ? (
            <p className="mt-1 text-xs text-[var(--air-color-text-muted)]">{highlight.provenance}</p>
          ) : null}
        </div>
        <Badge
          showIcon={false}
          tone={highlight.status === "accepted" ? "success" : highlight.status === "suggested" ? "brand" : "neutral"}
        >
          {highlight.status === "accepted" ? "Accepted" : highlight.status === "suggested" ? "Suggested" : "Uncoded"}
        </Badge>
      </header>

      <blockquote className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-sm leading-6">
        “{highlight.evidence.excerpt}”
      </blockquote>

      {highlight.codes.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Applied codes">
          {highlight.codes.map((code) => (
            <TranscriptCodeChip
              key={code.id}
              codeName={code.name}
              onRemove={onRemoveCode ? () => onRemoveCode(code.id) : undefined}
              removable={Boolean(onRemoveCode)}
            />
          ))}
        </div>
      ) : null}

      <footer className="flex flex-wrap gap-2">
        {onOpenInTranscript ? (
          <Button onClick={onOpenInTranscript} size="small" variant="gray-subtle">
            Open in transcript
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
        {onEditCodes ? (
          <Button onClick={onEditCodes} size="small" variant="gray-subtle">
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Edit codes
          </Button>
        ) : null}
        {onDelete ? (
          <Button onClick={() => setDeleteOpen(true)} size="small" variant="danger-subtle">
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Delete highlight
          </Button>
        ) : null}
      </footer>
      <Dialog
        description="This removes only this Highlight. Its source Transcript and Record Codes will not be deleted."
        intent="destructive"
        onOpenChange={setDeleteOpen}
        onPrimary={onDelete}
        open={deleteOpen}
        primaryLabel="Delete highlight"
        title="Delete highlight?"
      />
    </article>
  );
}
