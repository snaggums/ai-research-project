import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type {
  SessionReportItem,
  SessionReportOwnershipStatus,
} from "@/domain/types";
import { cn } from "@/lib/utils";

const defaultAssigneeOptions = ["Design team", "Team Sky", "Client"];

const statusPresentation: Record<
  SessionReportOwnershipStatus,
  { label: string; tone: NonNullable<BadgeProps["tone"]> }
> = {
  "ai-suggested": { label: "AI suggested", tone: "brand" },
  confirmed: { label: "Confirmed", tone: "success" },
  "confirmed-empty": { label: "Confirmed", tone: "success" },
  "needs-review": { label: "Needs review", tone: "warning" },
};

export interface SessionReportOwnershipEditorProps {
  assigneeOptions?: string[];
  confirmedEmpty?: boolean;
  disabled?: boolean;
  item: SessionReportItem;
  onConfirmedEmptyChange?: (confirmedEmpty: boolean) => void;
  onValueChange?: (value: string) => void;
  participantNames: string[];
  saving?: boolean;
  value?: string;
}

export function SessionReportOwnershipEditor({
  assigneeOptions = defaultAssigneeOptions,
  confirmedEmpty: controlledConfirmedEmpty,
  disabled = false,
  item,
  onConfirmedEmptyChange,
  onValueChange,
  participantNames,
  saving = false,
  value: controlledValue,
}: SessionReportOwnershipEditorProps) {
  const generatedId = React.useId();
  const ownership = item.ownership;
  const [internalValue, setInternalValue] = React.useState(ownership?.value ?? "");
  const [internalConfirmedEmpty, setInternalConfirmedEmpty] = React.useState(
    ownership?.status === "confirmed-empty",
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const skipNextFocusOpenRef = React.useRef(false);
  const value = controlledValue ?? internalValue;
  const confirmedEmpty = controlledConfirmedEmpty ?? internalConfirmedEmpty;
  const isDecision = item.type === "decision";
  const fieldLabel = isDecision ? "Decision maker" : "Assignee";
  const emptyOptionLabel = isDecision ? "None" : "Unassigned";
  const options = Array.from(new Set([
    emptyOptionLabel,
    ...participantNames,
    ...(isDecision ? [] : assigneeOptions),
  ]));
  const fieldId = `${generatedId}-field`;
  const listboxId = `${generatedId}-options`;
  const inactive = disabled || saving;
  const ownershipResolved = confirmedEmpty || Boolean(value.trim());
  const displayedStatus = ownershipResolved
    ? ownership?.status ?? "needs-review"
    : "needs-review";
  const status = statusPresentation[displayedStatus];
  const showStatus = displayedStatus !== "needs-review" || !ownershipResolved;
  const selectedValue = confirmedEmpty ? emptyOptionLabel : value;
  const helperText = isDecision
    ? "Choose a Session participant or enter another name."
    : "Defaults include Design team, Team Sky, and Client. Custom values are accepted.";

  React.useEffect(() => {
    if (!isOpen) return;

    function closeOutside(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen]);

  function updateValue(nextValue: string) {
    const nextConfirmedEmpty = nextValue === emptyOptionLabel;
    const nextStoredValue = nextConfirmedEmpty ? "" : nextValue;

    if (nextConfirmedEmpty !== confirmedEmpty) {
      updateConfirmedEmpty(nextConfirmedEmpty);
    }
    if (controlledValue === undefined) setInternalValue(nextStoredValue);
    onValueChange?.(nextStoredValue);
  }

  function updateConfirmedEmpty(nextConfirmedEmpty: boolean) {
    if (controlledConfirmedEmpty === undefined) {
      setInternalConfirmedEmpty(nextConfirmedEmpty);
    }
    onConfirmedEmptyChange?.(nextConfirmedEmpty);
  }

  function selectOption(option: string) {
    updateValue(option);
    setIsOpen(false);
    setActiveIndex(-1);
    skipNextFocusOpenRef.current = true;
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function openOptions() {
    const selectedIndex = options.indexOf(selectedValue);
    setIsOpen(true);
    setActiveIndex(selectedIndex);
  }

  return (
    <fieldset
      aria-busy={saving || undefined}
      className="grid gap-4"
      disabled={inactive}
    >
      <legend className="sr-only">Edit {fieldLabel.toLowerCase()}</legend>
      {ownership?.rationale ? (
        <p className="rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-subtle)] p-3 text-sm leading-5 text-[var(--air-color-text-secondary)]">
          {ownership.rationale}
        </p>
      ) : null}
      <Field className="gap-2" ref={fieldRef}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <FieldLabel className="inline-flex shrink-0 items-baseline" htmlFor={fieldId}>
            {fieldLabel}
            <span aria-hidden="true" className="ml-1 text-[var(--air-color-text-error)]">*</span>
            <span className="sr-only"> (required)</span>
          </FieldLabel>
          {showStatus ? <Badge className="shrink-0" showIcon={false} tone={status.tone}>{status.label}</Badge> : null}
        </div>
        <div className="relative">
          <Input
            ref={inputRef}
            aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls={isOpen ? listboxId : undefined}
            aria-describedby={`${fieldId}-hint`}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-required="true"
            autoComplete="off"
            className={cn(isOpen && "rounded-b-none")}
            disabled={inactive}
            id={fieldId}
            onChange={(event) => {
              updateValue(event.currentTarget.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onClick={openOptions}
            onFocus={() => {
              if (skipNextFocusOpenRef.current) {
                skipNextFocusOpenRef.current = false;
                return;
              }
              openOptions();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setIsOpen(false);
                setActiveIndex(-1);
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex((current) => current >= options.length - 1 ? 0 : current + 1);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex((current) => current <= 0 ? options.length - 1 : current - 1);
              }
              if (event.key === "Home" && isOpen) {
                event.preventDefault();
                setActiveIndex(0);
              }
              if (event.key === "End" && isOpen) {
                event.preventDefault();
                setActiveIndex(options.length - 1);
              }
              if (event.key === "Enter" && isOpen && activeIndex >= 0) {
                event.preventDefault();
                selectOption(options[activeIndex]);
              }
              if (event.key === "Tab") {
                setIsOpen(false);
                setActiveIndex(-1);
              }
            }}
            required
            rightAction={(
              <button
                aria-label={`${isOpen ? "Close" : "Open"} ${fieldLabel.toLowerCase()} options`}
                className="grid h-9 w-9 place-items-center rounded-[var(--air-radius-sm)] text-[var(--air-color-text-secondary)] outline-none hover:bg-[var(--air-color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)]"
                disabled={inactive}
                onClick={() => {
                  const nextOpen = !isOpen;
                  setIsOpen(nextOpen);
                  setActiveIndex(nextOpen ? options.indexOf(selectedValue) : -1);
                  if (nextOpen) requestAnimationFrame(() => inputRef.current?.focus());
                }}
                tabIndex={-1}
                type="button"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")}
                />
              </button>
            )}
            role="combobox"
            value={confirmedEmpty ? emptyOptionLabel : value}
          />
          {isOpen ? (
            <div
              aria-label={`${fieldLabel} options`}
              className="absolute left-0 right-0 top-full z-30 max-h-60 overflow-auto rounded-b-[var(--air-radius-md)] border border-t-0 border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-1 shadow-lg"
              id={listboxId}
              role="listbox"
            >
              {options.map((option) => {
                const optionIndex = options.indexOf(option);
                const selected = option === selectedValue;
                return (
                  <div
                    aria-selected={selected}
                    className={cn(
                      "flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--air-radius-sm)] px-3 py-2 text-left text-sm leading-5 text-[var(--air-color-text-primary)]",
                      activeIndex === optionIndex && "bg-[var(--air-color-bg-subtle)] outline outline-2 outline-offset-[-2px] outline-[var(--air-color-interaction-focus)]",
                    )}
                    id={`${listboxId}-option-${optionIndex}`}
                    key={option}
                    onClick={() => selectOption(option)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                  >
                    <span>{option}</span>
                    {selected ? <Check aria-hidden="true" className="h-4 w-4 text-[var(--air-color-text-brand)]" /> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        <FieldDescription id={`${fieldId}-hint`}>{helperText}</FieldDescription>
      </Field>
      {saving ? (
        <div aria-live="polite" className="flex items-center gap-2 text-sm text-[var(--air-color-text-secondary)]">
          <Spinner label={`Saving ${fieldLabel.toLowerCase()}`} size="small" />
          Saving changes…
        </div>
      ) : null}
    </fieldset>
  );
}
