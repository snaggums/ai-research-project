import * as React from "react";

import { cn } from "@/lib/utils";
import {
  RecordCodeCollection,
  type RecordCodeCollectionState,
} from "./record-code-collection";
import {
  RecordCodeComparison,
  type RecordCodeComparisonState,
} from "./record-code-comparison";
import type {
  RecordCodeDetailValue,
  RecordCodeSortValue,
  RecordCodeSupportingHighlightValue,
  RecordCodeSummaryValue,
} from "./record-code-types";

export interface RecordCodeWorkspaceProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  codes: RecordCodeSummaryValue[];
  collectionState?: RecordCodeCollectionState;
  comparisonState?: RecordCodeComparisonState;
  defaultSortOpen?: boolean;
  eligibleSessionCount: number;
  headingLevel?: "h1" | "h2";
  onClearSearch: () => void;
  onOpenInTranscriptCoding?: (highlight: RecordCodeSupportingHighlightValue) => void;
  onQueryChange: (query: string) => void;
  onRetryCollection?: () => void;
  onRetryComparison?: () => void;
  onSelectCode: (codeId: string) => void;
  onSortChange: (sort: RecordCodeSortValue) => void;
  onViewRelatedSessions?: () => void;
  query: string;
  selectedCode?: RecordCodeDetailValue;
  sort: RecordCodeSortValue;
  totalCodeCount: number;
}

export function RecordCodeWorkspace({
  className,
  codes,
  collectionState = "ready",
  comparisonState = "ready",
  defaultSortOpen = false,
  eligibleSessionCount,
  headingLevel = "h1",
  onClearSearch,
  onOpenInTranscriptCoding,
  onQueryChange,
  onRetryCollection,
  onRetryComparison,
  onSelectCode,
  onSortChange,
  onViewRelatedSessions,
  query,
  selectedCode,
  sort,
  totalCodeCount,
  ...props
}: RecordCodeWorkspaceProps) {
  const Heading = headingLevel;
  return (
    <section
      aria-labelledby="record-transcript-codes-title"
      className={cn("grid gap-6", className)}
      {...props}
    >
      <header className="grid gap-1">
        <Heading id="record-transcript-codes-title" className="text-xl font-semibold">
          Transcript codes
        </Heading>
        <p className="text-sm text-[var(--air-color-text-secondary)]">
          Explore accepted Codes across eligible Sessions and open supporting Highlights in
          their source Transcript Coding workspace.
        </p>
      </header>
      <div className="grid grid-cols-[400px_minmax(0,1fr)] items-start gap-4">
        <RecordCodeCollection
          className="w-[400px]"
          codes={codes}
          defaultSortOpen={defaultSortOpen}
          eligibleSessionCount={eligibleSessionCount}
          onClearSearch={onClearSearch}
          onQueryChange={onQueryChange}
          onRetry={onRetryCollection}
          onSelectCode={onSelectCode}
          onSortChange={onSortChange}
          onViewRelatedSessions={onViewRelatedSessions}
          query={query}
          selectedCodeId={selectedCode?.id}
          sort={sort}
          state={collectionState}
          totalCodeCount={totalCodeCount}
        />
        <RecordCodeComparison
          code={selectedCode}
          onOpenInTranscriptCoding={onOpenInTranscriptCoding}
          onRetry={onRetryComparison}
          state={comparisonState}
        />
      </div>
    </section>
  );
}
