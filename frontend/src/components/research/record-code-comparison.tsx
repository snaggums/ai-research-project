import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecordCodeSupportingHighlight } from "./record-code-supporting-highlight";
import type {
  RecordCodeDetailValue,
  RecordCodeSupportingHighlightValue,
} from "./record-code-types";

export type RecordCodeComparisonState = "ready" | "no-selection" | "error";

export interface RecordCodeComparisonProps
  extends React.HTMLAttributes<HTMLElement> {
  code?: RecordCodeDetailValue;
  onOpenInTranscriptCoding?: (highlight: RecordCodeSupportingHighlightValue) => void;
  onRetry?: () => void;
  state?: RecordCodeComparisonState;
}

export function RecordCodeComparison({
  className,
  code,
  onOpenInTranscriptCoding,
  onRetry,
  state = "ready",
  ...props
}: RecordCodeComparisonProps) {
  const effectiveState = state === "ready" && !code ? "no-selection" : state;

  return (
    <section
      aria-label="Record Code comparison"
      className={cn(
        "grid min-w-0 flex-1 gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-8",
        className,
      )}
      {...props}
    >
      {effectiveState !== "no-selection" && code ? (
        <header className="grid gap-2">
          <p className="text-xs font-semibold text-[var(--air-color-text-brand)]">
            Accepted Record Code
          </p>
          <h2 className="break-words text-2xl font-semibold">{code.name}</h2>
          <p className="text-sm text-[var(--air-color-text-secondary)]">
            {code.description} Compare how this Code appears across eligible Sessions.
          </p>
        </header>
      ) : null}

      {effectiveState === "no-selection" ? (
        <div
          className="grid min-h-[180px] content-start gap-4 rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-6"
          role="status"
        >
          <h2 className="text-lg font-semibold">Select a Code to compare evidence</h2>
          <p className="text-sm text-[var(--air-color-text-secondary)]">
            Choose an accepted Code from the list to compare supporting Highlights across
            eligible Sessions.
          </p>
        </div>
      ) : effectiveState === "error" ? (
        <div
          className="grid min-h-[180px] content-start gap-4 rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-6"
          role="alert"
        >
          <h3 className="text-lg font-semibold">Supporting evidence could not be loaded</h3>
          <p className="text-sm text-[var(--air-color-text-secondary)]">
            The Code remains selected. Retry without losing the current search, sort, or Code
            selection.
          </p>
          {onRetry ? (
            <div>
              <Button onClick={onRetry} size="small" variant="gray-subtle">
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      ) : code ? (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <div className="rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-3">
              <dd className="text-lg font-semibold">{code.acceptedHighlightCount}</dd>
              <dt className="mt-1 text-xs text-[var(--air-color-text-secondary)]">
                Accepted Highlights
              </dt>
            </div>
            <div className="rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-3">
              <dd className="text-lg font-semibold">{code.eligibleSessionCount}</dd>
              <dt className="mt-1 text-xs text-[var(--air-color-text-secondary)]">
                Eligible Sessions
              </dt>
            </div>
            <div className="rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-3">
              <dd className="text-lg font-semibold">{code.latestEvidenceLabel}</dd>
              <dt className="mt-1 text-xs text-[var(--air-color-text-secondary)]">
                Latest evidence
              </dt>
            </div>
          </dl>

          <div className="grid gap-1 rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-4">
            <p className="text-sm font-semibold">
              {code.knowledgeItemCount} Record Knowledge{" "}
              {code.knowledgeItemCount === 1 ? "item matches" : "items match"} this Code
            </p>
            <p className="text-xs text-[var(--air-color-text-secondary)]">
              Requirements, Decisions, and Action Items linked to this Code remain available in
              Record Knowledge.
            </p>
          </div>

          <div className="grid gap-6">
            <h3 className="text-lg font-semibold">Supporting Highlights by Session</h3>
            <p className="-mt-3 text-xs text-[var(--air-color-text-secondary)]">
              Accepted evidence is grouped by its authoritative source Session.
            </p>
            {code.evidenceGroups.map((group) => (
              <section className="grid gap-3" key={group.sessionId}>
                <header className="flex items-center justify-between gap-4">
                  <h4 className="text-base font-semibold">{group.sessionTitle}</h4>
                  <p className="text-xs text-[var(--air-color-text-secondary)]">
                    {group.highlights.length} accepted{" "}
                    {group.highlights.length === 1 ? "Highlight" : "Highlights"}
                  </p>
                </header>
                {group.highlights.map((highlight) => (
                  <RecordCodeSupportingHighlight
                    highlight={highlight}
                    key={highlight.id}
                    onOpenInTranscriptCoding={onOpenInTranscriptCoding}
                  />
                ))}
              </section>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
