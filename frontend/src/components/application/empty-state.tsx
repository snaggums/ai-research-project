import * as React from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  description?: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  title: React.ReactNode;
}

export function EmptyState({
  className,
  description,
  icon = <Inbox aria-hidden="true" className="h-6 w-6" />,
  primaryAction,
  secondaryAction,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-[var(--air-radius-lg)] border border-dashed border-[var(--air-color-border-strong)] bg-[var(--air-color-bg-surface)] px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--air-color-bg-subtle)] text-[var(--air-color-icon-primary)]">
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {description ? (
        <div className="mt-2 max-w-md text-sm leading-6 text-[var(--air-color-text-secondary)]">
          {description}
        </div>
      ) : null}
      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {secondaryAction}
          {primaryAction}
        </div>
      ) : null}
    </div>
  );
}
