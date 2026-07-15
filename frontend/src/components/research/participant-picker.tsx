import * as React from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel, fieldDescriptionIds } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ParticipantOption = {
  disabled?: boolean;
  firstName: string;
  id: string;
  lastName: string;
  referenceId?: string;
};

export interface ParticipantPickerProps {
  className?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
  onAddParticipant?: () => void;
  onOpenChange?: (open: boolean) => void;
  onValueChange: (participantIds: string[]) => void;
  open?: boolean;
  participants: ParticipantOption[];
  value: string[];
}

function optionName(option: ParticipantOption) {
  return `${option.firstName} ${option.lastName}`.trim();
}

export function ParticipantPicker({
  className,
  defaultOpen = false,
  disabled = false,
  error,
  id: providedId,
  onAddParticipant,
  onOpenChange,
  onValueChange,
  open: controlledOpen,
  participants,
  value,
}: ParticipantPickerProps) {
  const generatedId = React.useId();
  const id = providedId ?? generatedId;
  const listboxId = `${id}-listbox`;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isOpen = controlledOpen ?? internalOpen;
  const selected = participants.filter((participant) => value.includes(participant.id));
  const filtered = participants.filter((participant) => {
    const searchable = `${optionName(participant)} ${participant.referenceId ?? ""}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });
  const describedBy = fieldDescriptionIds(id, undefined, error);

  const setOpen = React.useCallback((next: boolean) => {
    if (disabled) return;
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) setQuery("");
  }, [controlledOpen, disabled, onOpenChange]);

  React.useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen, setOpen]);

  function toggleParticipant(participantId: string) {
    const next = value.includes(participantId)
      ? value.filter((current) => current !== participantId)
      : [...value, participantId];
    onValueChange(next);
  }

  return (
    <div
      className={cn(
        "rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6",
        className,
      )}
      ref={rootRef}
    >
      <Field>
        <FieldLabel htmlFor={id}>Participants</FieldLabel>
        <div className="relative">
          <Input
            className={cn(isOpen && "rounded-b-none")}
            aria-autocomplete="list"
            aria-controls={isOpen ? listboxId : undefined}
            aria-describedby={describedBy}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error) || undefined}
            autoComplete="off"
            disabled={disabled}
            id={id}
            invalid={Boolean(error)}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              if (!isOpen) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
              }
              if (event.key === "ArrowDown" && !isOpen) setOpen(true);
            }}
            placeholder={selected.length ? "Search or add participants" : "Search participants"}
            ref={inputRef}
            rightAction={(
              <button
                aria-label={isOpen ? "Close participant options" : "Open participant options"}
                className="grid h-9 w-9 place-items-center rounded-[var(--air-radius-sm)] outline-none hover:bg-[var(--air-color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)]"
                disabled={disabled}
                onClick={() => {
                  const nextOpen = !isOpen;
                  setOpen(nextOpen);
                  if (nextOpen) requestAnimationFrame(() => inputRef.current?.focus());
                }}
                type="button"
              >
                <ChevronDown aria-hidden="true" className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
              </button>
            )}
            role="combobox"
            value={query}
          />

          {isOpen ? (
            <div
              aria-label="Participant options"
              aria-multiselectable="true"
              className="absolute left-0 right-0 top-full z-30 max-h-64 overflow-auto rounded-b-[var(--air-radius-md)] border border-t-0 border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] shadow-[var(--air-shadow-overlay)]"
              id={listboxId}
              role="listbox"
            >
              {filtered.length ? filtered.map((participant) => {
                const name = optionName(participant);
                const checked = value.includes(participant.id);
                return (
                  <button
                    aria-disabled={participant.disabled || undefined}
                    aria-selected={checked}
                    className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm outline-none hover:bg-[var(--air-color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--air-color-interaction-focus)] disabled:cursor-not-allowed disabled:text-[var(--air-color-text-disabled)]"
                    disabled={participant.disabled}
                    key={participant.id}
                    onClick={() => toggleParticipant(participant.id)}
                    role="option"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-[var(--air-radius-sm)] border",
                        checked
                          ? "border-[var(--air-color-bg-brand)] bg-[var(--air-color-bg-brand)] text-[var(--air-color-text-inverse)]"
                          : "border-[var(--air-color-border-control)] bg-[var(--air-color-bg-surface)]",
                      )}
                    >
                      <Check className={cn("h-4 w-4", !checked && "invisible")} strokeWidth={3} />
                    </span>
                    <span>{name}{participant.referenceId ? ` · ${participant.referenceId}` : ""}</span>
                  </button>
                );
              }) : (
                <div className="bg-[var(--air-color-bg-subtle)] px-4 py-3 text-sm" role="status">
                  <div className="font-semibold">No participants found</div>
                  <div className="mt-2 text-[var(--air-color-text-secondary)]">
                    No Participants in this Project match “{query}”.
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
        {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      </Field>

      {selected.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Selected participants</h3>
          <div aria-label="Selected participants" className="mt-3 flex flex-wrap gap-2">
            {selected.map((participant) => {
              const name = optionName(participant);
              return (
                <span
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] pl-3 pr-1 text-xs font-semibold"
                  key={participant.id}
                >
                  {name}
                  <button
                    aria-label={`Remove ${name}`}
                    className="grid h-6 w-6 place-items-center rounded-full outline-none hover:bg-[var(--air-color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)]"
                    disabled={disabled}
                    onClick={() => toggleParticipant(participant.id)}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--air-color-text-secondary)]">
        <span>
          {disabled
            ? "Participant selection unavailable."
            : error
              ? "Choose at least one participant to continue."
              : selected.length
                ? `${selected.length} ${selected.length === 1 ? "participant" : "participants"} selected.`
                : query && isOpen
                  ? "Try another search or add a participant."
                  : "No participants selected."}
        </span>
        {onAddParticipant ? (
          <Button disabled={disabled} onClick={onAddParticipant} size="small" type="button" variant="text">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add participant
          </Button>
        ) : null}
      </div>
    </div>
  );
}
