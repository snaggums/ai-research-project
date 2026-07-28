import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldLabel, fieldDescriptionIds } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  showDisclosureIcon?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, disabled, invalid, showDisclosureIcon = true, ...props }, ref) => (
    <div
      className={cn(
        "relative flex h-12 w-full items-center rounded-[var(--air-radius-md)] border bg-[var(--air-color-bg-surface)] transition-colors",
        invalid ? "border-[var(--air-color-border-error)]" : "border-[var(--air-color-border-control)]",
        "focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--air-color-interaction-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--air-color-bg-canvas)]",
        disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
        className,
      )}
    >
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-full w-full appearance-none bg-transparent px-3 text-sm text-[var(--air-color-text-primary)] outline-none",
          showDisclosureIcon && "pr-10",
          disabled && "cursor-not-allowed text-[var(--air-color-text-disabled)]",
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
      {showDisclosureIcon ? (
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 h-5 w-5 text-[var(--air-color-text-secondary)]"
        />
      ) : null}
    </div>
  ),
);
Select.displayName = "Select";

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface SelectFieldProps {
  className?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
  invalid?: boolean;
  label?: React.ReactNode;
  name?: string;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  optional?: boolean;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  showDisclosureIcon?: boolean;
  value?: string;
}

const SelectField = React.forwardRef<HTMLButtonElement, SelectFieldProps>(
  (
    {
      className,
      defaultOpen = false,
      defaultValue = "",
      disabled,
      error,
      hint,
      id: providedId,
      invalid,
      label,
      name,
      onOpenChange,
      onValueChange,
      open: controlledOpen,
      optional,
      options,
      placeholder = "Select an option",
      required,
      showDisclosureIcon = true,
      value,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = providedId ?? generatedId;
    const menuId = `${id}-menu`;
    const describedBy = fieldDescriptionIds(id, hint, error);
    const fieldRef = React.useRef<HTMLDivElement>(null);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const [activeOptionIndex, setActiveOptionIndex] = React.useState<number | null>(null);
    const selectedValue = value ?? internalValue;
    const isOpen = controlledOpen ?? internalOpen;
    const selectedOption = options.find((option) => option.value === selectedValue);
    const enabledOptionIndexes = React.useMemo(
      () => options.reduce<number[]>((indexes, option, index) => {
        if (!option.disabled) indexes.push(index);
        return indexes;
      }, []),
      [options],
    );

    function setOpen(nextOpen: boolean) {
      if (controlledOpen === undefined) setInternalOpen(nextOpen);
      if (nextOpen) {
        const selectedIndex = options.findIndex(
          (option) => !option.disabled && option.value === selectedValue,
        );
        setActiveOptionIndex(selectedIndex >= 0 ? selectedIndex : (enabledOptionIndexes[0] ?? null));
      } else {
        setActiveOptionIndex(null);
      }
      onOpenChange?.(nextOpen);
    }

    function selectValue(nextValue: string) {
      if (value === undefined) setInternalValue(nextValue);
      onValueChange?.(nextValue);
      setOpen(false);
    }

    function moveActiveOption(direction: 1 | -1) {
      if (enabledOptionIndexes.length === 0) return;
      const currentPosition = activeOptionIndex === null
        ? -1
        : enabledOptionIndexes.indexOf(activeOptionIndex);
      const nextPosition = direction === 1
        ? (currentPosition + 1) % enabledOptionIndexes.length
        : (currentPosition <= 0 ? enabledOptionIndexes.length - 1 : currentPosition - 1);
      setActiveOptionIndex(enabledOptionIndexes[nextPosition]);
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

    React.useEffect(() => {
      if (!isOpen) return;
      const selectedIndex = options.findIndex(
        (option) => !option.disabled && option.value === selectedValue,
      );
      setActiveOptionIndex((currentIndex) => (
        currentIndex !== null && !options[currentIndex]?.disabled
          ? currentIndex
          : (selectedIndex >= 0 ? selectedIndex : (enabledOptionIndexes[0] ?? null))
      ));
    }, [enabledOptionIndexes, isOpen, options, selectedValue]);

    return (
      <Field ref={fieldRef} className={className}>
        {label ? (
          <FieldLabel htmlFor={id} optional={optional} required={required}>
            {label}
          </FieldLabel>
        ) : null}
        <div className="relative">
          <button
            ref={ref}
            id={id}
            type="button"
            aria-controls={isOpen ? menuId : undefined}
            aria-activedescendant={
              isOpen && activeOptionIndex !== null
                ? `${menuId}-option-${activeOptionIndex}`
                : undefined
            }
            aria-describedby={describedBy}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error) || invalid || undefined}
            aria-required={required || undefined}
            role="combobox"
            className={cn(
              "flex h-12 w-full items-center gap-2 rounded-[var(--air-radius-md)] border bg-[var(--air-color-bg-surface)] px-3 text-left text-sm outline-none",
              error || invalid ? "border-[var(--air-color-border-error)]" : "border-[var(--air-color-border-control)]",
              "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
              isOpen && "rounded-b-none",
              disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
            )}
            disabled={disabled}
            onClick={() => setOpen(!isOpen)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!isOpen) {
                  setOpen(true);
                } else {
                  moveActiveOption(event.key === "ArrowDown" ? 1 : -1);
                }
                return;
              }
              if (isOpen && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                if (activeOptionIndex !== null) {
                  const option = options[activeOptionIndex];
                  if (option && !option.disabled) selectValue(option.value);
                }
                return;
              }
              if (isOpen && (event.key === "Home" || event.key === "End")) {
                event.preventDefault();
                setActiveOptionIndex(
                  event.key === "Home"
                    ? (enabledOptionIndexes[0] ?? null)
                    : (enabledOptionIndexes[enabledOptionIndexes.length - 1] ?? null),
                );
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
              }
            }}
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                !selectedOption && "text-[var(--air-color-text-secondary)]",
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>
            {showDisclosureIcon ? (
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "pointer-events-none h-5 w-5 shrink-0 text-[var(--air-color-text-secondary)] transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            ) : null}
          </button>
          {isOpen ? (
            <div
              id={menuId}
              className="absolute left-0 right-0 top-full z-20 max-h-60 overflow-auto rounded-b-[var(--air-radius-md)] border border-t-0 border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-1 shadow-lg"
              role="listbox"
              aria-label={typeof label === "string" ? label : "Options"}
            >
              {options.map((option, index) => {
                const selected = option.value === selectedValue;
                const active = index === activeOptionIndex;
                return (
                  <div
                    key={option.value}
                    id={`${menuId}-option-${index}`}
                    aria-disabled={option.disabled || undefined}
                    aria-selected={selected}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--air-radius-sm)] px-3 py-2 text-sm outline-none hover:bg-[var(--air-color-bg-subtle)] focus:bg-[var(--air-color-bg-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--air-color-interaction-focus)]",
                      active && "bg-[var(--air-color-bg-subtle)]",
                      option.disabled && "cursor-not-allowed text-[var(--air-color-text-disabled)]",
                    )}
                    role="option"
                    tabIndex={option.disabled ? -1 : 0}
                    onClick={() => {
                      if (!option.disabled) selectValue(option.value);
                    }}
                    onKeyDown={(event) => {
                      if (!option.disabled && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        selectValue(option.value);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!option.disabled) setActiveOptionIndex(index);
                    }}
                  >
                    <span>{option.label}</span>
                    {selected ? (
                      <Check aria-hidden="true" className="h-4 w-4 text-[var(--air-color-text-brand)]" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
        {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
        {!error && hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      </Field>
    );
  },
);
SelectField.displayName = "SelectField";

export { Select, SelectField };
