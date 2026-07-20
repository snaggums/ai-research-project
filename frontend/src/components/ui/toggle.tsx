import * as React from "react";

import { cn } from "@/lib/utils";

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  description?: React.ReactNode;
  label: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      className,
      defaultChecked = false,
      description,
      disabled,
      label,
      onCheckedChange,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isChecked = checked ?? internalChecked;

    function toggleChecked() {
      const nextChecked = !isChecked;
      if (checked === undefined) setInternalChecked(nextChecked);
      onCheckedChange?.(nextChecked);
    }

    return (
      <button
        ref={ref}
        type={type}
        role="switch"
        data-control="toggle"
        aria-checked={isChecked}
        className={cn(
          "group inline-flex w-fit items-start gap-3 rounded-[var(--air-radius-sm)] text-left text-sm text-[var(--air-color-text-primary)] outline-none",
          disabled && "cursor-not-allowed text-[var(--air-color-text-secondary)]",
          className,
        )}
        disabled={disabled}
        onClick={toggleChecked}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
            "group-focus-visible:ring-2 group-focus-visible:ring-[var(--air-color-interaction-focus)] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
            isChecked
              ? "border-[var(--air-color-bg-brand)] bg-[var(--air-color-bg-brand)] group-hover:border-[var(--air-color-border-brand-hover)] group-hover:bg-[var(--air-color-bg-brand-hover)] group-active:bg-[var(--air-color-bg-brand-pressed)]"
              : "border-[var(--air-color-border-control)] bg-[var(--air-color-bg-disabled)] group-hover:bg-[var(--air-color-bg-active)]",
            disabled &&
              (isChecked
                ? "border-[var(--air-color-control-disabled)] bg-[var(--air-color-control-disabled)]"
                : "border-[var(--air-color-control-disabled)] bg-[var(--air-color-control-disabled-surface)]"),
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform",
              isChecked && "translate-x-5",
              disabled && !isChecked && "bg-[var(--air-color-control-disabled)]",
            )}
          />
        </span>
        <span className="grid gap-0.5">
          <span className="font-medium">{label}</span>
          {description ? (
            <span className="font-normal text-[var(--air-color-text-secondary)]">{description}</span>
          ) : null}
        </span>
      </button>
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle };
