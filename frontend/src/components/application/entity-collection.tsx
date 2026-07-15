import * as React from "react";

import { EmptyState } from "@/components/application/empty-state";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type EntityCollectionState = "ready" | "loading" | "empty" | "no-results" | "error";

export interface EntityCollectionProps extends React.HTMLAttributes<HTMLElement> {
  actions?: React.ReactNode;
  controls?: React.ReactNode;
  countLabel?: string;
  countPosition?: "inline" | "below";
  state?: EntityCollectionState;
  stateContent?: React.ReactNode;
  title: string;
}

export function EntityCollection({
  actions,
  children,
  className,
  controls,
  countLabel,
  countPosition = "inline",
  state = "ready",
  stateContent,
  title,
  ...props
}: EntityCollectionProps) {
  let content = children;
  if (state === "loading") {
    content = stateContent ?? (
      <div className="grid min-h-52 place-items-center" role="status">
        <div className="grid justify-items-center gap-3 text-sm text-[var(--air-color-text-secondary)]">
          <Spinner label={`Loading ${title.toLowerCase()}`} size="small" />
          Loading {title.toLowerCase()}
        </div>
      </div>
    );
  }
  if (state === "empty") {
    content = stateContent ?? <EmptyState description="Create the first item to get started." title={`No ${title.toLowerCase()} yet`} />;
  }
  if (state === "no-results") {
    content = stateContent ?? <EmptyState description="Try changing or clearing the current filters." title="No matching results" />;
  }
  if (state === "error") {
    content = stateContent ?? <Alert message="Refresh the page or try again." size="large" title={`Unable to load ${title.toLowerCase()}`} tone="error" />;
  }

  return (
    <section className={cn("grid gap-4", className)} {...props}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className={cn(
          "flex gap-2",
          countPosition === "below" ? "flex-col items-start gap-0" : "items-baseline",
        )}>
          <h2 className="text-xl font-semibold">{title}</h2>
          {countLabel ? <span className="text-sm text-[var(--air-color-text-secondary)]">{countLabel}</span> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {controls ? <div>{controls}</div> : null}
      <div aria-busy={state === "loading" || undefined}>{content}</div>
    </section>
  );
}
