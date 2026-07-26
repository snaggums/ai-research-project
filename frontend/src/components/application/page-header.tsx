import * as React from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  description?: React.ReactNode;
  title: React.ReactNode;
}

export function PageHeader({
  actions,
  breadcrumbs,
  className,
  description,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header className={cn("grid min-w-0 gap-4", className)} {...props}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{title}</h1>
          {description ? (
            <div className="mt-2 max-w-3xl text-sm leading-6 text-[var(--air-color-text-secondary)] md:text-base">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
