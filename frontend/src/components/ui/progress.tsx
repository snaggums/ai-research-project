import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  showValue?: boolean;
  size?: "small" | "large";
  value: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, label = "Progress", showValue = true, size = "small", value, ...props }, ref) => {
    const normalizedValue = Math.min(100, Math.max(0, value));
    const valueText = `${Math.round(normalizedValue)}%`;

    return (
      <div ref={ref} className={cn("grid w-full gap-1", className)} {...props}>
        {showValue ? (
          <div
            aria-hidden="true"
            className={cn("text-right font-semibold text-[var(--air-color-text-secondary)]", size === "small" ? "text-xs" : "text-sm")}
          >
            {valueText}
          </div>
        ) : null}
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={normalizedValue}
          aria-valuetext={valueText}
          className={cn(
            "w-full overflow-hidden rounded-full transition-[background] duration-300",
            size === "small" ? "h-2" : "h-3",
          )}
          data-progress-value={normalizedValue}
          style={{
            backgroundColor: "var(--air-color-interaction-accent-subtle)",
            backgroundImage: `linear-gradient(to right, var(--air-color-interaction-accent) 0%, var(--air-color-interaction-accent) ${normalizedValue}%, var(--air-color-interaction-accent-subtle) ${normalizedValue}%, var(--air-color-interaction-accent-subtle) 100%)`,
          }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
