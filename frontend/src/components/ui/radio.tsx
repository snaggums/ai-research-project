import * as React from "react";

import { cn } from "@/lib/utils";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "defaultChecked" | "onChange" | "type"> {
  checked?: boolean;
  defaultChecked?: boolean;
  description?: React.ReactNode;
  label: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      checked,
      className,
      defaultChecked = false,
      description,
      disabled,
      label,
      onCheckedChange,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isChecked = checked ?? internalChecked;

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const nextChecked = event.target.checked;
      if (checked === undefined) setInternalChecked(nextChecked);
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
          ref={ref}
          type="radio"
          data-control="radio"
          className="peer sr-only"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--air-color-interaction-focus)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
            isChecked
              ? "border-2 border-[var(--air-color-bg-brand)] bg-[var(--air-color-bg-surface)] group-hover:border-[var(--air-color-border-brand-hover)] group-active:border-[var(--air-color-bg-brand-pressed)]"
              : "border-[var(--air-color-border-control)] bg-[var(--air-color-bg-surface)] group-hover:border-[var(--air-color-interaction-focus)] group-active:bg-[var(--air-color-bg-subtle)]",
            disabled &&
              (isChecked
                ? "border-2 border-[var(--air-color-control-disabled)] bg-[var(--air-color-bg-surface)] group-hover:border-[var(--air-color-control-disabled)]"
                : "border-[var(--air-color-control-disabled)] bg-[var(--air-color-control-disabled-surface)] group-hover:border-[var(--air-color-control-disabled)]"),
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full bg-[var(--air-color-bg-brand)] group-hover:bg-[var(--air-color-bg-brand-hover)] group-active:bg-[var(--air-color-bg-brand-pressed)]",
              !isChecked && "invisible",
              disabled && "bg-[var(--air-color-control-disabled)] group-hover:bg-[var(--air-color-control-disabled)]",
            )}
          />
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
Radio.displayName = "Radio";

export { Radio };
