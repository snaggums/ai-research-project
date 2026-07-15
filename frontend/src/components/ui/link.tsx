import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

const linkVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-[var(--air-radius-sm)] font-medium underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
  {
    variants: {
      variant: {
        inline: "text-[var(--air-color-text-brand)] underline hover:no-underline active:text-[var(--air-color-bg-brand-pressed)]",
        standalone: "text-[var(--air-color-text-brand)] hover:underline active:text-[var(--air-color-bg-brand-pressed)]",
        subtle: "text-[var(--air-color-text-secondary)] hover:text-[var(--air-color-text-primary)] hover:underline active:text-[var(--air-color-text-primary)]",
      },
      size: {
        small: "text-sm",
        medium: "text-base",
      },
    },
    defaultVariants: {
      variant: "inline",
      size: "medium",
    },
  },
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  asChild?: boolean;
  external?: boolean;
  showExternalIcon?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      asChild = false,
      children,
      className,
      external = false,
      rel,
      showExternalIcon = external,
      target,
      variant,
      size,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(linkVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <a
        ref={ref}
        className={cn(linkVariants({ variant, size }), className)}
        rel={external ? rel ?? "noreferrer" : rel}
        target={external ? target ?? "_blank" : target}
        {...props}
      >
        <span>{children}</span>
        {showExternalIcon ? <ExternalLink aria-hidden="true" className="h-4 w-4" /> : null}
      </a>
    );
  },
);
Link.displayName = "Link";

export { Link, linkVariants };
