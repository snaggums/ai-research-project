import * as React from "react";

import { cn } from "@/lib/utils";

const spinnerSizes = {
  small: { pixels: 24, stroke: 2 },
  medium: { pixels: 64, stroke: 4 },
  large: { pixels: 112, stroke: 8 },
} as const;

const spinnerTones = {
  brand: { indicator: "var(--air-color-interaction-accent)", track: "var(--air-color-bg-active)" },
  neutral: { indicator: "var(--air-color-text-primary)", track: "var(--air-color-bg-active)" },
  inverse: { indicator: "var(--air-color-text-inverse)", track: "var(--air-color-border-strong)" },
} as const;

export interface SpinnerProps extends Omit<React.SVGAttributes<SVGSVGElement>, "color"> {
  label?: string;
  size?: keyof typeof spinnerSizes;
  tone?: keyof typeof spinnerTones;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, label = "Loading", size = "small", tone = "brand", ...props }, ref) => {
    const dimensions = spinnerSizes[size];
    const colors = spinnerTones[tone];
    const radius = (dimensions.pixels - dimensions.stroke) / 2;

    return (
      <svg
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("animate-spin", className)}
        width={dimensions.pixels}
        height={dimensions.pixels}
        viewBox={`0 0 ${dimensions.pixels} ${dimensions.pixels}`}
        fill="none"
        {...props}
      >
        <circle
          cx={dimensions.pixels / 2}
          cy={dimensions.pixels / 2}
          r={radius}
          stroke={colors.track}
          strokeWidth={dimensions.stroke}
        />
        <circle
          cx={dimensions.pixels / 2}
          cy={dimensions.pixels / 2}
          r={radius}
          pathLength="100"
          stroke={colors.indicator}
          strokeDasharray="75 25"
          strokeWidth={dimensions.stroke}
        />
      </svg>
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
