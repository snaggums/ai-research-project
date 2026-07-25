import * as React from "react";
import { ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TranscriptCodeChip } from "./transcript-code-chip";
import type { TranscriptCodeValue } from "./transcript-coding-types";

const codeNameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export interface TranscriptCodePanelProps {
  availableCodes: TranscriptCodeValue[];
  className?: string;
  defaultSelectedCodeIds?: string[];
  mode?: "apply" | "create";
  onApply?: (codeIds: string[]) => void;
  onCancel?: () => void;
  onCreateCode?: (value: { name: string; description: string }) => Promise<string | void> | string | void;
  onModeChange?: (mode: "apply" | "create") => void;
  onSelectedCodeIdsChange?: (codeIds: string[]) => void;
  selectedCodeIds?: string[];
}

export function TranscriptCodePanel({
  availableCodes,
  className,
  defaultSelectedCodeIds = [],
  mode = "apply",
  onApply,
  onCancel,
  onCreateCode,
  onModeChange,
  onSelectedCodeIdsChange,
  selectedCodeIds: controlledSelectedCodeIds,
}: TranscriptCodePanelProps) {
  const [internalSelectedCodeIds, setInternalSelectedCodeIds] = React.useState(defaultSelectedCodeIds);
  const [query, setQuery] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const selectedCodeIds = controlledSelectedCodeIds ?? internalSelectedCodeIds;
  const selectedCodes = availableCodes
    .filter((code) => selectedCodeIds.includes(code.id))
    .sort((a, b) => codeNameCollator.compare(a.name, b.name));
  const filteredCodes = availableCodes
    .filter((code) =>
      `${code.name} ${code.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const selectedOrder = Number(selectedCodeIds.includes(b.id)) - Number(selectedCodeIds.includes(a.id));
      return selectedOrder || codeNameCollator.compare(a.name, b.name);
    });

  function setSelectedCodeIds(next: string[]) {
    if (controlledSelectedCodeIds === undefined) setInternalSelectedCodeIds(next);
    onSelectedCodeIdsChange?.(next);
  }

  function toggleCode(codeId: string) {
    setSelectedCodeIds(
      selectedCodeIds.includes(codeId)
        ? selectedCodeIds.filter((value) => value !== codeId)
        : [...selectedCodeIds, codeId],
    );
  }

  if (mode === "create") {
    return (
      <form
        className={cn(
          "grid w-full gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6 shadow-[var(--air-shadow-overlay)]",
          className,
        )}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim() || creating) return;

          setCreating(true);
          try {
            const createdCodeId = await onCreateCode?.({ name: name.trim(), description: description.trim() });
            if (createdCodeId) {
              setSelectedCodeIds(
                selectedCodeIds.includes(createdCodeId)
                  ? selectedCodeIds
                  : [...selectedCodeIds, createdCodeId],
              );
            }
            setName("");
            setDescription("");
            onModeChange?.("apply");
          } finally {
            setCreating(false);
          }
        }}
      >
        <header className="flex items-center gap-2">
          <Button aria-label="Back to apply code" onClick={() => onModeChange?.("apply")} size="icon-small" type="button" variant="text">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          <h3 className="text-xl font-semibold leading-7">Create a new code</h3>
        </header>
        <InputField label="Code name" onChange={(event) => setName(event.target.value)} required value={name} />
        <TextareaField label="Description" onChange={(event) => setDescription(event.target.value)} value={description} />
        <footer className="flex justify-end gap-2">
          <Button onClick={onCancel} size="small" type="button" variant="gray-subtle">Cancel</Button>
          <Button disabled={!name.trim() || creating} size="small" type="submit" variant="brand">
            {creating ? "Creating…" : "Create code"}
          </Button>
        </footer>
      </form>
    );
  }

  return (
    <section
      aria-labelledby="apply-code-title"
      className={cn(
        "grid w-full gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6 shadow-[var(--air-shadow-overlay)]",
        className,
      )}
    >
      <header>
        <h3 id="apply-code-title" className="text-xl font-semibold leading-7">Apply code</h3>
        <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Search codes or create a new one.</p>
      </header>
      <InputField
        aria-label="Search codes"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search codes"
        type="search"
        value={query}
      />
      {selectedCodeIds.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Codes to apply">
          {selectedCodes.map((code) => (
            <TranscriptCodeChip key={code.id} codeName={code.name} onRemove={() => toggleCode(code.id)} />
          ))}
        </div>
      ) : null}
      <div className="grid overflow-hidden rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)]">
        <div
          aria-label="Available codes"
          aria-multiselectable="true"
          className="max-h-[22.5rem] overflow-y-auto"
          role="listbox"
        >
          {filteredCodes.map((code) => {
            const selected = selectedCodeIds.includes(code.id);
            return (
              <button
                key={code.id}
                aria-selected={selected}
                className="flex h-[4.5rem] w-full items-center justify-between gap-3 border-b border-[var(--air-color-border-default)] px-4 py-3 text-left hover:bg-[var(--air-color-bg-subtle)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--air-color-interaction-focus)]"
                onClick={() => toggleCode(code.id)}
                role="option"
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{code.name}</span>
                  {code.description ? <span className="mt-0.5 block truncate text-sm text-[var(--air-color-text-secondary)]">{code.description}</span> : null}
                </span>
                {selected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--air-color-text-brand)]" /> : null}
              </button>
            );
          })}
        </div>
        <button
          className="min-h-11 border-t border-[var(--air-color-border-default)] px-4 py-3 text-left font-medium hover:bg-[var(--air-color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--air-color-interaction-focus)]"
          onClick={() => onModeChange?.("create")}
          type="button"
        >
          Create a new code
        </button>
      </div>
      <footer className="flex justify-end gap-2">
        <Button onClick={onCancel} size="small" variant="gray-subtle">Cancel</Button>
        <Button disabled={selectedCodeIds.length === 0} onClick={() => onApply?.(selectedCodeIds)} size="small" variant="brand">Apply</Button>
      </footer>
    </section>
  );
}
