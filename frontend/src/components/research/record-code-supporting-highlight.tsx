import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecordCodeSupportingHighlightValue } from "./record-code-types";

export interface RecordCodeSupportingHighlightProps
  extends React.HTMLAttributes<HTMLElement> {
  highlight: RecordCodeSupportingHighlightValue;
  onOpenInTranscriptCoding?: (highlight: RecordCodeSupportingHighlightValue) => void;
}

export function RecordCodeSupportingHighlight({
  className,
  highlight,
  onOpenInTranscriptCoding,
  ...props
}: RecordCodeSupportingHighlightProps) {
  return (
    <article
      className={cn(
        "flex min-h-[220px] flex-col gap-2 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4",
        className,
      )}
      {...props}
    >
      <p className="text-xs font-semibold">
        {highlight.speaker} · {highlight.location}
      </p>
      <blockquote className="text-sm leading-5">“{highlight.excerpt}”</blockquote>
      <p className="text-xs text-[var(--air-color-text-secondary)]">
        {highlight.sessionTitle} · {highlight.projectName}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Badge showIcon={false} tone="success">
          Accepted
        </Badge>
        {onOpenInTranscriptCoding ? (
          <Button
            onClick={() => onOpenInTranscriptCoding(highlight)}
            size="small"
            variant="gray-subtle"
          >
            Open in Transcript Coding
          </Button>
        ) : null}
      </div>
    </article>
  );
}
