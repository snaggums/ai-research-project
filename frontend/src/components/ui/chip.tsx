import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultSelected?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  onRemove?: () => void;
  onSelectedChange?: (selected: boolean) => void;
  removable?: boolean;
  removeLabel?: string;
  selected?: boolean;
  size?: "small" | "large";
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      children,
      className,
      defaultSelected = false,
      disabled = false,
      leadingIcon,
      onRemove,
      onSelectedChange,
      removable = true,
      removeLabel,
      selected,
      size = "small",
      ...props
    },
    ref,
  ) => {
    const [internalSelected, setInternalSelected] = React.useState(defaultSelected);
    const isSelected = selected ?? internalSelected;
    const label = typeof children === "string" ? children : "chip";

    function toggleSelected() {
      if (disabled) return;
      const next = !isSelected;
      if (selected === undefined) setInternalSelected(next);
      onSelectedChange?.(next);
    }

    return (
      <div
        ref={ref}
        className={cn(
          "air-chip group inline-flex w-fit items-center rounded-full border transition-colors",
          isSelected
            ? "border-[var(--air-color-border-default)] bg-[var(--air-color-interaction-accent-subtle)] hover:bg-[var(--air-color-bg-selected-hover)]"
            : "border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] hover:bg-[var(--air-color-bg-subtle)]",
          disabled &&
            "border-[var(--air-color-border-strong)] bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)] hover:bg-[var(--air-color-bg-disabled)]",
          size === "small" ? "h-6 text-xs" : "h-8 text-sm",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          data-control="chip"
          className={cn(
            "flex h-full min-w-0 items-center gap-1 rounded-l-full font-medium outline-none",
            size === "small" ? "pl-2 pr-1 [&_svg]:h-4 [&_svg]:w-4" : "gap-2 pl-3 pr-1 [&_svg]:h-5 [&_svg]:w-5",
            !removable && (size === "small" ? "rounded-r-full pr-2" : "rounded-r-full pr-3"),
          )}
          aria-pressed={isSelected}
          disabled={disabled}
          onClick={toggleSelected}
        >
          {leadingIcon ? <span aria-hidden="true" className="shrink-0">{leadingIcon}</span> : null}
          <span className="truncate">{children}</span>
        </button>
        {removable ? (
          <button
            type="button"
            className={cn(
              "flex h-full shrink-0 items-center justify-center rounded-r-full outline-none hover:text-[var(--air-color-text-brand)]",
              size === "small" ? "w-6" : "w-8",
            )}
            aria-label={removeLabel ?? `Remove ${label}`}
            disabled={disabled}
            onClick={onRemove}
          >
            <X aria-hidden="true" className={size === "small" ? "h-4 w-4" : "h-5 w-5"} />
          </button>
        ) : null}
      </div>
    );
  },
);
Chip.displayName = "Chip";

export { Chip };
