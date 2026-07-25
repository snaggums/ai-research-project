import * as React from "react";

import { Button } from "@/components/ui/button";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { cn } from "@/lib/utils";
import { TranscriptCodeChip } from "./transcript-code-chip";
import type { TranscriptCodeValue } from "./transcript-coding-types";

export interface TranscriptHighlightFiltersProps {
  availableCodes: TranscriptCodeValue[];
  className?: string;
  codeIds?: string[];
  defaultCodeIds?: string[];
  onApply?: (filters: { codeIds: string[] }) => void;
  onClear?: () => void;
  onCodeIdsChange?: (codeIds: string[]) => void;
  resultCount?: number;
  resultNoun?: "highlights" | "suggestions";
  totalCount?: number;
}

export function TranscriptHighlightFilters({
  availableCodes,
  className,
  codeIds: controlledCodeIds,
  defaultCodeIds = [],
  onApply,
  onClear,
  onCodeIdsChange,
  resultCount,
  resultNoun = "highlights",
  totalCount,
}: TranscriptHighlightFiltersProps) {
  const groupName = React.useId();
  const [internalCodeIds, setInternalCodeIds] = React.useState(defaultCodeIds);
  const codeIds = controlledCodeIds ?? internalCodeIds;

  function setCodeIds(next: string[]) {
    if (controlledCodeIds === undefined) setInternalCodeIds(next);
    onCodeIdsChange?.(next);
  }

  function clearFilters() {
    setCodeIds([]);
    onClear?.();
  }

  return (
    <section
      aria-labelledby={`${groupName}-title`}
      className={cn(
        "grid w-full gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6 shadow-[var(--air-shadow-overlay)]",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 id={`${groupName}-title`} className="text-xl font-semibold leading-7">Filter highlights</h3>
        {resultCount !== undefined ? (
          <span className="text-sm text-[var(--air-color-text-secondary)]" aria-live="polite">
            {resultCount} of {totalCount ?? resultCount} {resultNoun}
          </span>
        ) : null}
      </header>

      <MultiSelectField
        label="Codes"
        onValueChange={setCodeIds}
        options={availableCodes.map((code) => ({ label: code.name, value: code.id }))}
        placeholder="Select codes"
        selectedTextMaxLines={2}
        showChips={false}
        value={codeIds}
      />

      {codeIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active highlight filters">
          {availableCodes.filter((code) => codeIds.includes(code.id)).map((code) => (
            <TranscriptCodeChip
              key={code.id}
              codeName={code.name}
              onRemove={() => setCodeIds(codeIds.filter((value) => value !== code.id))}
            />
          ))}
        </div>
      ) : null}

      <footer className="flex items-center justify-between gap-3">
        <Button onClick={clearFilters} size="small" variant="text">Clear filters</Button>
        <Button onClick={() => onApply?.({ codeIds })} size="small" variant="brand">Apply filters</Button>
      </footer>
    </section>
  );
}
