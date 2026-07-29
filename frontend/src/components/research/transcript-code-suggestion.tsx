import * as React from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { TranscriptCodeChip } from "./transcript-code-chip";
import type { TranscriptEvidenceValue, TranscriptHighlightStatus } from "./transcript-coding-types";

export interface TranscriptCodeSuggestionProps {
  applyCodeDisabled?: boolean;
  applyCodeUnavailableReason?: string;
  codeName: string;
  confidence?: number;
  defaultEvidenceExpanded?: boolean;
  description: string;
  evidence: TranscriptEvidenceValue[];
  evidenceExpanded?: boolean;
  layout?: "default" | "compact";
  onAccept?: () => void;
  onApplyCode?: () => void;
  onDeleteHighlight?: (highlightId: string) => void;
  onEdit?: () => void;
  onEditCode?: () => void;
  onEvidenceExpandedChange?: (expanded: boolean) => void;
  onRemoveAcceptedCode?: () => void;
  onRemoveCode?: (highlightId: string) => void;
  onReject?: () => void;
  onSelect?: () => void;
  provenance?: string;
  selected?: boolean;
  showActions?: boolean;
  status?: TranscriptHighlightStatus;
}

export function TranscriptCodeSuggestion({
  applyCodeDisabled = false,
  applyCodeUnavailableReason,
  codeName,
  confidence,
  defaultEvidenceExpanded = false,
  description,
  evidence,
  evidenceExpanded: controlledEvidenceExpanded,
  layout = "default",
  onAccept,
  onApplyCode,
  onDeleteHighlight,
  onEdit,
  onEditCode,
  onEvidenceExpandedChange,
  onRemoveAcceptedCode,
  onRemoveCode,
  onReject,
  onSelect,
  provenance,
  selected = false,
  showActions = true,
  status = "suggested",
}: TranscriptCodeSuggestionProps) {
  const [internalEvidenceExpanded, setInternalEvidenceExpanded] = React.useState(defaultEvidenceExpanded);
  const [highlightToDelete, setHighlightToDelete] = React.useState<TranscriptEvidenceValue | null>(null);
  const applyCodeDescriptionId = React.useId();
  const evidenceExpanded = controlledEvidenceExpanded ?? internalEvidenceExpanded;
  const visibleEvidence = evidenceExpanded ? evidence : evidence.slice(0, 1);
  const evidenceCount = evidence.length;

  function setEvidenceExpanded(next: boolean) {
    if (controlledEvidenceExpanded === undefined) setInternalEvidenceExpanded(next);
    onEvidenceExpandedChange?.(next);
  }

  return (
    <>
      <article
        className={cn(
          "relative grid min-w-0 overflow-hidden rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)]",
          selected && "border-[var(--air-color-interaction-progress)]",
        )}
        data-selected={selected || undefined}
        data-status={status}
      >
        {selected ? (
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-0 top-2 w-1 rounded-r-sm bg-[var(--air-color-interaction-progress)]"
          />
        ) : null}
        <div className={cn("grid min-w-0 gap-4", layout === "compact" ? "p-4" : "p-6", selected && "pl-7")}>
          <header className="flex min-w-0 items-start justify-between gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 rounded-[var(--air-radius-sm)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
              disabled={!onSelect}
              onClick={onSelect}
            >
              <span className="block break-words text-xl font-semibold leading-7 text-[var(--air-color-text-primary)]">
                {codeName}
              </span>
              <span className="mt-1 block break-words text-base leading-6 text-[var(--air-color-text-secondary)]">
                {description}
              </span>
            </button>
            <Badge
              className="shrink-0"
              showIcon={false}
              tone={status === "accepted" ? "success" : status === "uncoded" ? "neutral" : "brand"}
            >
              {status === "accepted" ? "Accepted" : status === "uncoded" ? "Uncoded" : "Suggested"}
            </Badge>
          </header>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs leading-4">
            <p className="min-w-0 break-words text-[var(--air-color-text-muted)]">
              {[provenance, confidence === undefined ? undefined : `Confidence ${confidence.toFixed(2)}`]
                .filter(Boolean)
                .join(" • ")}
            </p>
            <p className="font-medium text-[var(--air-color-text-link)]">
              {evidenceCount} supporting {evidenceCount === 1 ? "passage" : "passages"}
            </p>
          </div>

          <div className="grid min-w-0 gap-2" aria-label="Supporting transcript evidence">
            {visibleEvidence.map((passage) => {
              const passageLabel = [passage.speaker, passage.location].filter(Boolean).join(", ");

              return (
                <article
                  aria-label={`Highlight from ${passageLabel}`}
                  className="grid min-w-0 gap-2 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-sm leading-6 text-[var(--air-color-text-primary)]"
                  key={passage.id}
                >
                  <header className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0 break-words font-medium">
                      {[passage.speaker, passage.location].filter(Boolean).join(" • ")}
                    </span>
                    {status !== "suggested" && onDeleteHighlight ? (
                      <IconButton
                        className="shrink-0"
                        icon={<Trash2 aria-hidden="true" />}
                        label={`Delete highlight from ${passageLabel}`}
                        onClick={() => setHighlightToDelete(passage)}
                        size="small"
                      />
                    ) : null}
                  </header>
                  <blockquote className="min-w-0 break-words">“{passage.excerpt}”</blockquote>
                  {status === "accepted" ? (
                    <TranscriptCodeChip
                      className="max-w-full"
                      codeName={codeName}
                      onRemove={onRemoveCode ? () => onRemoveCode(passage.id) : undefined}
                      removable={Boolean(onRemoveCode)}
                      removeLabel={`Remove ${codeName} code from ${passageLabel}`}
                    />
                  ) : status === "uncoded" ? (
                    <Badge showIcon={false} tone="neutral">Uncoded</Badge>
                  ) : null}
                </article>
              );
            })}
            {evidenceCount > 1 ? (
              <Button
                className="w-fit px-0"
                onClick={() => setEvidenceExpanded(!evidenceExpanded)}
                size="small"
                variant="text"
              >
                {evidenceExpanded
                  ? "View less supporting transcript evidence"
                  : "View all supporting transcript evidence"}
              </Button>
            ) : null}
          </div>

          {showActions && status === "suggested" ? (
            <footer className="flex flex-wrap items-center justify-end gap-2">
              <Button onClick={onAccept} size="small" variant="brand">Accept</Button>
              <Button onClick={onEdit} size="small" variant="gray-subtle">Edit</Button>
              <Button onClick={onReject} size="small" variant="text">Reject</Button>
            </footer>
          ) : showActions && status === "accepted" ? (
            <footer className="flex flex-wrap items-center justify-end gap-2">
              <Button onClick={onEditCode} size="small" variant="gray-subtle">Edit</Button>
              <Button onClick={onRemoveAcceptedCode} size="small" variant="text">Remove</Button>
            </footer>
          ) : showActions && status === "uncoded" && onApplyCode ? (
            <footer className="grid gap-2">
              {applyCodeUnavailableReason ? (
                <p
                  className="text-sm leading-5 text-[var(--air-color-text-secondary)]"
                  id={applyCodeDescriptionId}
                >
                  {applyCodeUnavailableReason}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button
                  aria-describedby={applyCodeUnavailableReason ? applyCodeDescriptionId : undefined}
                  disabled={applyCodeDisabled}
                  onClick={onApplyCode}
                  size="small"
                  variant="brand"
                >
                  Apply code
                </Button>
              </div>
            </footer>
          ) : null}
        </div>
      </article>
      <Dialog
        description="This removes only this Highlight. The Code and accepted suggestion history remain available, and the transcript text will not change."
        intent="destructive"
        onOpenChange={(open) => {
          if (!open) setHighlightToDelete(null);
        }}
        onPrimary={() => {
          if (highlightToDelete) onDeleteHighlight?.(highlightToDelete.id);
        }}
        open={Boolean(highlightToDelete)}
        primaryLabel="Delete highlight"
        title="Delete highlight?"
      />
    </>
  );
}
