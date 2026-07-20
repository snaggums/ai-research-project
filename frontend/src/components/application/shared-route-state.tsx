import * as React from "react";
import { CloudOff, FileQuestion, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type SharedRouteStateValue =
  | "loading"
  | "recoverable-error"
  | "not-found"
  | "unavailable-source";

export interface SharedRouteStateProps {
  onRetry?: () => void;
  returnHref?: string;
  state: SharedRouteStateValue;
}

const routeStateContent = {
  "recoverable-error": {
    description: "The page could not be loaded. Check your connection and try again.",
    icon: TriangleAlert,
    title: "Something went wrong",
  },
  "not-found": {
    description: "The requested page may have moved, been deleted, or never existed.",
    icon: FileQuestion,
    title: "Page not found",
  },
  "unavailable-source": {
    description: "The source transcript is still processing or is no longer available.",
    icon: CloudOff,
    title: "Transcript context unavailable",
  },
} as const;

export function SharedRouteState({ onRetry, returnHref = "/projects", state }: SharedRouteStateProps) {
  if (state === "loading") {
    return (
      <div className="grid min-h-[24rem] place-items-center" role="status">
        <div className="grid justify-items-center gap-4 text-[var(--air-color-text-secondary)]">
          <Spinner label="Loading page" size="medium" />
          <span>Loading page</span>
        </div>
      </div>
    );
  }

  const content = routeStateContent[state];
  const Icon = content.icon;
  return (
    <section className="grid min-h-[24rem] place-items-center" aria-labelledby="route-state-title">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--air-color-bg-subtle)] text-[var(--air-color-icon-primary)]">
          <Icon aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold" id="route-state-title">{content.title}</h1>
        <p className="mt-2 leading-6 text-[var(--air-color-text-secondary)]">{content.description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {state === "recoverable-error" && onRetry ? (
            <Button onClick={onRetry} size="small">
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Try again
            </Button>
          ) : null}
          <Button asChild size="small" variant={state === "recoverable-error" ? "gray-subtle" : "brand"}>
            <a href={returnHref}>Return to projects</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

