import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--air-radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)] disabled:pointer-events-none disabled:border-[var(--air-color-border-default)] disabled:bg-[var(--air-color-bg-disabled)] disabled:text-[var(--air-color-text-disabled)]",
  {
    variants: {
      variant: {
        brand: "bg-[var(--air-color-bg-brand)] text-[var(--air-color-text-inverse)] hover:bg-[var(--air-color-bg-brand-hover)] active:bg-[var(--air-color-bg-brand-pressed)]",
        "brand-subtle": "bg-[var(--air-color-bg-selected)] text-[var(--air-color-text-brand)] hover:bg-[var(--air-color-bg-selected-hover)] active:bg-[var(--air-color-bg-selected-active)]",
        gray: "border border-[var(--air-color-border-strong)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
        "gray-subtle": "border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
        text: "bg-transparent text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
        danger: "bg-[var(--air-color-action-destructive-default)] text-[var(--air-color-action-destructive-foreground)] hover:bg-[var(--air-color-action-destructive-hover)] active:bg-[var(--air-color-action-destructive-hover)]",
        "danger-subtle": "border border-[var(--air-color-border-error)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-error)] hover:bg-[var(--air-color-status-error-bg)] active:bg-[var(--air-color-status-error-border)]",
        default: "bg-[var(--air-color-bg-brand)] text-[var(--air-color-text-inverse)] hover:bg-[var(--air-color-bg-brand-hover)] active:bg-[var(--air-color-bg-brand-pressed)]",
        destructive: "bg-[var(--air-color-action-destructive-default)] text-[var(--air-color-action-destructive-foreground)] hover:bg-[var(--air-color-action-destructive-hover)] active:bg-[var(--air-color-action-destructive-hover)]",
        outline: "border border-[var(--air-color-border-strong)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
        secondary: "border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
        ghost: "bg-transparent text-[var(--air-color-text-brand)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
      },
      size: {
        small: "h-11 px-3",
        large: "h-12 px-4",
        "icon-small": "h-11 w-11 p-0",
        "icon-large": "h-12 w-12 p-0",
        default: "h-12 px-4",
        sm: "h-11 px-3",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "large",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
