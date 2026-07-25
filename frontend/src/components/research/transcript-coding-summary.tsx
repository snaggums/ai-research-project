import * as React from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TranscriptCodingSummaryState = "awaiting-review" | "complete" | "empty" | "error" | "processing";

export interface TranscriptCodingSummaryProps {
  acceptedCount?: number;
  className?: string;
  errorMessage?: string;
  footerText?: string;
  onAction?: () => void;
  rejectedCount?: number;
  state?: TranscriptCodingSummaryState;
  suggestionCount?: number;
  title?: string;
}

const statePresentation = {
  "awaiting-review": { badge: "Review needed", icon: Sparkles, tone: "brand" as const },
  complete: { badge: "Review complete", icon: CheckCircle2, tone: "success" as const },
  empty: { badge: "No suggestions", icon: Sparkles, tone: "neutral" as const },
  error: { badge: "Generation failed", icon: AlertCircle, tone: "error" as const },
  processing: { badge: "Generating", icon: LoaderCircle, tone: "brand" as const },
};

export function TranscriptCodingSummary({
  acceptedCount = 0,
  className,
  errorMessage = "Suggestions could not be generated. Your existing highlights and reviewed suggestions were not changed.",
  footerText,
  onAction,
  rejectedCount = 0,
  state = "awaiting-review",
  suggestionCount = 0,
  title = "Transcript codes",
}: TranscriptCodingSummaryProps) {
  const titleId = React.useId();
  const presentation = statePresentation[state];
  const Icon = presentation.icon;
  const actionLabel = state === "error" ? "Try again" : state === "empty" ? "Generate suggestions" : "Review codes";

  return (
    <section
      aria-busy={state === "processing" || undefined}
      aria-labelledby={titleId}
      className={cn(
        "grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon
            aria-hidden="true"
            className={cn("mt-1 h-5 w-5", state === "processing" && "animate-spin")}
          />
          <div>
            <h3 id={titleId} className="text-xl font-semibold leading-7">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-[var(--air-color-text-secondary)]">
              {state === "processing"
                ? "You can leave this page while AIR generates suggestions."
                : state === "error"
                  ? errorMessage
                  : "Review AI suggestions and preserve accepted transcript highlights for this Session."}
            </p>
          </div>
        </div>
        <Badge showIcon={false} tone={presentation.tone}>{presentation.badge}</Badge>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-3">
          <dt className="text-xs text-[var(--air-color-text-secondary)]">Suggestions</dt>
          <dd className="mt-1 text-xl font-semibold">{suggestionCount}</dd>
        </div>
        <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-3">
          <dt className="text-xs text-[var(--air-color-text-secondary)]">Accepted codes</dt>
          <dd className="mt-1 text-xl font-semibold">{acceptedCount}</dd>
        </div>
        <div className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-3">
          <dt className="text-xs text-[var(--air-color-text-secondary)]">Rejected</dt>
          <dd className="mt-1 text-xl font-semibold">{rejectedCount}</dd>
        </div>
      </dl>

      {state !== "processing" && state !== "complete" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base leading-6 text-[var(--air-color-text-secondary)]">
            {footerText ?? (state === "empty"
              ? "No AI suggestions are awaiting review."
              : `${suggestionCount} AI ${suggestionCount === 1 ? "suggestion is" : "suggestions are"} ready for researcher review.`)}
          </p>
          {onAction ? (
          <Button onClick={onAction} size="small" variant={state === "error" ? "gray-subtle" : "brand"}>
            {actionLabel}
          </Button>
          ) : null}
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {state === "processing" ? "Generating code suggestions" : presentation.badge}
      </span>
    </section>
  );
}
