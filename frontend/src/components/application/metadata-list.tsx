import * as React from "react";

import { cn } from "@/lib/utils";

export type MetadataItem = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export interface MetadataListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: MetadataItem[];
  layout?: "grid" | "stacked";
}

export function MetadataList({ className, items, layout = "grid", ...props }: MetadataListProps) {
  return (
    <dl
      className={cn(
        layout === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3",
        className,
      )}
      {...props}
    >
      {items.map((item, index) => (
        <div className="min-w-0" key={`${index}-${String(item.label)}`}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--air-color-text-secondary)]">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm text-[var(--air-color-text-primary)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

