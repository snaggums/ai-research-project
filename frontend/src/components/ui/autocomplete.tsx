import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldLabel, fieldDescriptionIds } from "@/components/ui/field";
import type { SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AutocompleteFieldProps {
  className?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
  label?: React.ReactNode;
  noResultsMessage?: React.ReactNode;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
}

export const AutocompleteField = React.forwardRef<HTMLInputElement, AutocompleteFieldProps>(
  (
    {
      className,
      defaultOpen = false,
      defaultValue = "",
      disabled,
      error,
      hint,
      id: providedId,
      label,
      noResultsMessage = "No matching participants.",
      onValueChange,
      options,
      placeholder = "Search participants",
      value,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = providedId ?? generatedId;
    const listboxId = `${id}-listbox`;
    const fieldRef = React.useRef<HTMLDivElement>(null);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [query, setQuery] = React.useState(
      options.find((option) => option.value === defaultValue)?.label ?? "",
    );
    const [open, setOpen] = React.useState(defaultOpen);
    const [activePosition, setActivePosition] = React.useState<number | null>(null);
    const selectedValue = value ?? internalValue;
    const selectedOption = options.find((option) => option.value === selectedValue);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredOptions = React.useMemo(
      () => options
        .map((option, originalIndex) => ({ option, originalIndex }))
        .filter(({ option }) => option.label.toLocaleLowerCase().includes(normalizedQuery)),
      [normalizedQuery, options],
    );
    const enabledPositions = React.useMemo(
      () => filteredOptions.reduce<number[]>((positions, { option }, position) => {
        if (!option.disabled) positions.push(position);
        return positions;
      }, []),
      [filteredOptions],
    );
    const describedBy = fieldDescriptionIds(id, hint, error);

    React.useEffect(() => {
      setQuery(selectedOption?.label ?? "");
    }, [selectedOption?.label]);

    React.useEffect(() => {
      if (!open) return;
      setActivePosition((current) => (
        current !== null && enabledPositions.includes(current)
          ? current
          : (enabledPositions[0] ?? null)
      ));
    }, [enabledPositions, open]);

    React.useEffect(() => {
      if (!open) return;
      function handlePointerDown(event: PointerEvent) {
        if (!fieldRef.current?.contains(event.target as Node)) setOpen(false);
      }
      document.addEventListener("pointerdown", handlePointerDown);
      return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    function updateValue(nextValue: string) {
      if (value === undefined) setInternalValue(nextValue);
      onValueChange?.(nextValue);
    }

    function selectOption(option: SelectOption) {
      if (option.disabled) return;
      updateValue(option.value);
      setQuery(option.label);
      setOpen(false);
      setActivePosition(null);
    }

    function moveActive(direction: 1 | -1) {
      if (!enabledPositions.length) return;
      const currentIndex = activePosition === null ? -1 : enabledPositions.indexOf(activePosition);
      const nextIndex = direction === 1
        ? (currentIndex + 1) % enabledPositions.length
        : (currentIndex <= 0 ? enabledPositions.length - 1 : currentIndex - 1);
      setActivePosition(enabledPositions[nextIndex]);
    }

    return (
      <Field ref={fieldRef} className={className}>
        {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-activedescendant={
              open && activePosition !== null
                ? `${listboxId}-option-${filteredOptions[activePosition]?.originalIndex}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={open ? listboxId : undefined}
            aria-describedby={describedBy}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error) || undefined}
            autoComplete="off"
            className={cn(
              "h-12 w-full rounded-[var(--air-radius-md)] border bg-[var(--air-color-bg-surface)] px-3 pr-10 text-sm text-[var(--air-color-text-primary)] outline-none",
              error ? "border-[var(--air-color-border-error)]" : "border-[var(--air-color-border-control)]",
              "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
              open && "rounded-b-none",
              disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
            )}
            disabled={disabled}
            onChange={(event) => {
              const nextQuery = event.currentTarget.value;
              setQuery(nextQuery);
              if (selectedValue && nextQuery !== selectedOption?.label) updateValue("");
              setOpen(true);
              setActivePosition(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!open) setOpen(true);
                else moveActive(event.key === "ArrowDown" ? 1 : -1);
                return;
              }
              if (event.key === "Enter" && open && activePosition !== null) {
                event.preventDefault();
                const result = filteredOptions[activePosition];
                if (result) selectOption(result.option);
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setQuery(selectedOption?.label ?? "");
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            role="combobox"
            spellCheck={false}
            value={query}
          />
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--air-color-text-secondary)] transition-transform",
              open && "rotate-180",
            )}
          />
          {open ? (
            <div
              id={listboxId}
              aria-label={typeof label === "string" ? label : "Options"}
              className="absolute left-0 right-0 top-full z-20 max-h-60 overflow-auto rounded-b-[var(--air-radius-md)] border border-t-0 border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-1 shadow-lg"
              role="listbox"
            >
              {filteredOptions.length ? filteredOptions.map(({ option, originalIndex }, position) => {
                const selected = option.value === selectedValue;
                const active = position === activePosition;
                return (
                  <div
                    key={option.value}
                    id={`${listboxId}-option-${originalIndex}`}
                    aria-disabled={option.disabled || undefined}
                    aria-selected={selected}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--air-radius-sm)] px-3 py-2 text-sm outline-none hover:bg-[var(--air-color-bg-subtle)]",
                      active && "bg-[var(--air-color-bg-subtle)]",
                      option.disabled && "cursor-not-allowed text-[var(--air-color-text-disabled)]",
                    )}
                    onClick={() => selectOption(option)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                  >
                    <span>{option.label}</span>
                    {selected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                  </div>
                );
              }) : (
                <div className="px-3 py-2 text-sm text-[var(--air-color-text-secondary)]" role="status">
                  {noResultsMessage}
                </div>
              )}
            </div>
          ) : null}
        </div>
        {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
        {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      </Field>
    );
  },
);
AutocompleteField.displayName = "AutocompleteField";
