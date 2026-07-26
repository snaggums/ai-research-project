import * as React from "react";

import { cn } from "@/lib/utils";

export type SectionNavigationItem = {
  disabled?: boolean;
  href: string;
  id: string;
  label: string;
};

export interface SectionNavigationProps extends React.HTMLAttributes<HTMLElement> {
  activeId: string;
  items: SectionNavigationItem[];
  label: string;
}

export function SectionNavigation({
  activeId,
  className,
  items,
  label,
  ...props
}: SectionNavigationProps) {
  return (
    <nav
      aria-label={label}
      className={cn("min-w-0 max-w-full overflow-x-auto border-b border-[var(--air-color-border-default)]", className)}
      {...props}
    >
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <a
              aria-current={active ? "page" : undefined}
              aria-disabled={item.disabled || undefined}
              className={cn(
                "relative flex min-h-11 items-center rounded-t-[var(--air-radius-sm)] px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--air-color-interaction-focus)]",
                active
                  ? "text-[var(--air-color-text-primary)] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--air-color-interaction-accent)]"
                  : "text-[var(--air-color-text-secondary)] hover:bg-[var(--air-color-bg-subtle)] hover:text-[var(--air-color-text-primary)]",
                item.disabled && "pointer-events-none text-[var(--air-color-text-disabled)]",
              )}
              href={item.href}
              key={item.id}
              tabIndex={item.disabled ? -1 : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

