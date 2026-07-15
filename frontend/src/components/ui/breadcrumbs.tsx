import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  disabled?: boolean;
  href?: string;
  label: React.ReactNode;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  label?: string;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, label = "Breadcrumb", ...props }, ref) => (
    <nav ref={ref} aria-label={label} className={className} {...props}>
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          const content = current || item.disabled || !item.href ? (
            <span
              aria-current={current ? "page" : undefined}
              aria-disabled={item.disabled || undefined}
              className={cn(
                "inline-flex min-h-5 items-center rounded-[var(--air-radius-sm)] px-1 text-sm",
                current ? "font-semibold text-[var(--air-color-text-primary)]" : "text-[var(--air-color-text-brand)]",
                item.disabled && "text-[var(--air-color-text-disabled)]",
              )}
            >
              {item.label}
            </span>
          ) : (
            <a
              href={item.href}
              className="inline-flex min-h-5 items-center rounded-[var(--air-radius-sm)] px-1 text-sm text-[var(--air-color-text-brand)] outline-none hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-interaction-accent-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]"
            >
              {item.label}
            </a>
          );
          return (
            <li key={`${index}-${String(item.label)}`} className="flex items-center">
              {content}
              {!current ? <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--air-color-text-secondary)]" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  ),
);
Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };
