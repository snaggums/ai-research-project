import * as React from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "defaultChecked" | "onChange" | "type"> {
  checked?: boolean;
  defaultChecked?: boolean;
  defaultIndeterminate?: boolean;
  description?: React.ReactNode;
  indeterminate?: boolean;
  label: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  onIndeterminateChange?: (indeterminate: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      className,
      defaultChecked = false,
      defaultIndeterminate = false,
      description,
      disabled,
      indeterminate,
      label,
      onCheckedChange,
      onIndeterminateChange,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const [internalIndeterminate, setInternalIndeterminate] = React.useState(defaultIndeterminate);
    const isChecked = checked ?? internalChecked;
    const isIndeterminate = indeterminate ?? internalIndeterminate;
    const isSelected = isChecked || isIndeterminate;
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = isIndeterminate;
    }, [isIndeterminate]);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const nextChecked = event.target.checked;
      if (checked === undefined) setInternalChecked(nextChecked);
      if (isIndeterminate) {
        if (indeterminate === undefined) setInternalIndeterminate(false);
        onIndeterminateChange?.(false);
      }
      onCheckedChange?.(nextChecked);
    }

    return (
      <label
        className={cn(
          "group inline-flex w-fit items-start gap-3 text-sm text-[var(--air-color-text-primary)]",
          disabled && "cursor-not-allowed text-[var(--air-color-text-secondary)]",
          className,
        )}
      >
        <input
          ref={inputRef}
          type="checkbox"
          data-control="checkbox"
          className="peer sr-only"
          aria-checked={isIndeterminate ? "mixed" : undefined}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--air-radius-sm)] border text-[var(--air-color-text-inverse)] transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--air-color-interaction-focus)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
            isSelected
              ? "border-[var(--air-color-bg-brand)] bg-[var(--air-color-bg-brand)] group-hover:border-[var(--air-color-border-brand-hover)] group-hover:bg-[var(--air-color-bg-brand-hover)] group-active:bg-[var(--air-color-bg-brand-pressed)]"
              : "border-[var(--air-color-border-control)] bg-[var(--air-color-bg-surface)] group-hover:border-[var(--air-color-interaction-focus)] group-active:bg-[var(--air-color-bg-subtle)]",
            disabled &&
              (isSelected
                ? "border-[var(--air-color-control-disabled)] bg-[var(--air-color-control-disabled)] group-hover:border-[var(--air-color-control-disabled)] group-hover:bg-[var(--air-color-control-disabled)]"
                : "border-[var(--air-color-control-disabled)] bg-[var(--air-color-control-disabled-surface)] group-hover:border-[var(--air-color-control-disabled)]"),
          )}
        >
          {isIndeterminate ? (
            <Minus className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Check className={cn("h-4 w-4", !isChecked && "invisible")} strokeWidth={3} />
          )}
        </span>
        <span className="grid gap-0.5">
          <span className="font-medium">{label}</span>
          {description ? (
            <span className="font-normal text-[var(--air-color-text-secondary)]">{description}</span>
          ) : null}
        </span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
