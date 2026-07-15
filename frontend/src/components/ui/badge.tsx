import * as React from "react";
import { Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full font-semibold leading-none",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--air-color-bg-subtle)] text-[var(--air-color-text-primary)]",
        brand: "bg-[var(--air-color-interaction-accent-subtle)] text-[var(--air-color-text-brand)]",
        success: "bg-[var(--air-color-status-success-bg)] text-[var(--air-color-status-success-text)]",
        warning: "bg-[var(--air-color-status-warning-bg)] text-[var(--air-color-status-warning-text)]",
        error: "bg-[var(--air-color-status-error-bg)] text-[var(--air-color-status-error-text)]",
        inverse: "bg-[var(--air-color-text-primary)] text-[var(--air-color-text-inverse)]",
      },
      size: {
        small: "h-6 gap-1 px-2 text-xs [&_svg]:h-4 [&_svg]:w-4",
        large: "h-8 gap-1 pl-2 pr-3 text-sm [&_svg]:h-5 [&_svg]:w-5",
      },
    },
    defaultVariants: { tone: "neutral", size: "small" },
  },
);

const badgeToneColors = {
  neutral: { backgroundColor: "var(--air-color-bg-subtle)", color: "var(--air-color-text-primary)" },
  brand: { backgroundColor: "var(--air-color-interaction-accent-subtle)", color: "var(--air-color-text-brand)" },
  success: { backgroundColor: "var(--air-color-status-success-bg)", color: "var(--air-color-status-success-text)" },
  warning: { backgroundColor: "var(--air-color-status-warning-bg)", color: "var(--air-color-status-warning-text)" },
  error: { backgroundColor: "var(--air-color-status-error-bg)", color: "var(--air-color-status-error-text)" },
  inverse: { backgroundColor: "var(--air-color-text-primary)", color: "var(--air-color-text-inverse)" },
} satisfies Record<string, React.CSSProperties>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, icon = <Info />, showIcon = true, size, style, tone = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ className, size, tone }))}
      style={{ ...badgeToneColors[tone ?? "neutral"], ...style }}
      {...props}
    >
      {showIcon ? <span aria-hidden="true" className="shrink-0">{icon}</span> : null}
      {children}
    </span>
  ),
);
Badge.displayName = "Badge";

export { Badge };
