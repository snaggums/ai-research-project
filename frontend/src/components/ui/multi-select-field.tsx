import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldLabel, fieldDescriptionIds } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface MultiSelectFieldProps {
  className?: string;
  defaultOpen?: boolean;
  defaultValue?: string[];
  disabled?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
  label?: React.ReactNode;
  name?: string;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string[]) => void;
  open?: boolean;
  optional?: boolean;
  options: MultiSelectOption[];
  placeholder?: string;
  required?: boolean;
  showChips?: boolean;
  showDisclosureIcon?: boolean;
  value?: string[];
}

function MultiSelectField({
  className,
  defaultOpen = false,
  defaultValue = [],
  disabled,
  error,
  hint,
  id: providedId,
  label,
  name,
  onOpenChange,
  onValueChange,
  open: controlledOpen,
  optional,
  options,
  placeholder = "Select options",
  required,
  showChips = true,
  showDisclosureIcon = true,
  value,
}: MultiSelectFieldProps) {
  const generatedId = React.useId();
  const id = providedId ?? generatedId;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const selectedValues = value ?? internalValue;
  const isOpen = controlledOpen ?? internalOpen;
  const describedBy = fieldDescriptionIds(id, hint, error);
  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));
  const selectedText = selectedOptions.map((option) => option.label).join(", ");

  function setOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function toggleValue(optionValue: string) {
    const nextValue = selectedValues.includes(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  React.useEffect(() => {
    if (!isOpen || controlledOpen !== undefined) return;

    function handlePointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setInternalOpen(false);
        onOpenChange?.(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [controlledOpen, isOpen, onOpenChange]);

  return (
    <Field ref={fieldRef} className={className}>
      {label ? (
        <FieldLabel htmlFor={id} optional={optional} required={required}>
          {label}
        </FieldLabel>
      ) : null}
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-describedby={describedBy}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error) || undefined}
          aria-required={required || undefined}
          className={cn(
            "flex min-h-12 w-full items-center gap-2 rounded-[var(--air-radius-md)] border bg-[var(--air-color-bg-surface)] px-3 py-2 text-left text-sm outline-none",
            error ? "border-[var(--air-color-border-error)]" : "border-[var(--air-color-border-control)]",
            "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
            isOpen && "rounded-b-none",
            disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
          )}
          disabled={disabled}
          onClick={() => setOpen(!isOpen)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <span
            className={cn(
              "block min-w-0 flex-1 truncate",
              selectedOptions.length === 0 && "text-[var(--air-color-text-secondary)]",
            )}
            title={selectedText || undefined}
          >
            {selectedText || placeholder}
          </span>
          {showDisclosureIcon ? (
            <ChevronDown
              aria-hidden="true"
              className={cn("pointer-events-none h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")}
            />
          ) : null}
        </button>
        {isOpen ? (
          <div
            className="absolute left-0 right-0 top-full z-20 max-h-60 overflow-auto rounded-b-[var(--air-radius-md)] border border-t-0 border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-1 shadow-lg"
            role="listbox"
            aria-multiselectable="true"
            aria-label={typeof label === "string" ? label : "Options"}
          >
            {options.map((option) => {
              const selected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  aria-disabled={option.disabled || undefined}
                  aria-selected={selected}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--air-radius-sm)] px-3 py-2 text-sm outline-none hover:bg-[var(--air-color-bg-subtle)] focus:bg-[var(--air-color-bg-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--air-color-interaction-focus)]",
                    option.disabled && "cursor-not-allowed text-[var(--air-color-text-disabled)]",
                  )}
                  role="option"
                  tabIndex={option.disabled ? -1 : 0}
                  onClick={() => {
                    if (!option.disabled) toggleValue(option.value);
                  }}
                  onKeyDown={(event) => {
                    if (!option.disabled && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      toggleValue(option.value);
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? <Check aria-hidden="true" className="h-4 w-4 text-[var(--air-color-text-brand)]" /> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      {name
        ? selectedValues.map((selectedValue) => (
            <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
          ))
        : null}
      {showChips && selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Selected options">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--air-color-text-primary)]"
            >
              {option.label}
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--air-color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)]"
                disabled={disabled}
                onClick={() => toggleValue(option.value)}
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      {!error && hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
    </Field>
  );
}

export { MultiSelectField };
