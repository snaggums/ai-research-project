import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type ErrorSummaryItem = {
  fieldId: string;
  message: string;
};

export interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  errors: ErrorSummaryItem[];
  focusOnMount?: boolean;
  title?: string;
}

export function ErrorSummary({
  className,
  errors,
  focusOnMount = true,
  title = "There is a problem",
  ...props
}: ErrorSummaryProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (focusOnMount && errors.length) rootRef.current?.focus();
  }, [errors.length, focusOnMount]);

  if (!errors.length) return null;

  return (
    <div
      className={cn(
        "rounded-[var(--air-radius-lg)] border border-[var(--air-color-status-error-border)] bg-[var(--air-color-status-error-bg)] p-4 text-[var(--air-color-status-error-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
        className,
      )}
      ref={rootRef}
      role="alert"
      tabIndex={-1}
      {...props}
    >
      <div className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden="true" className="h-5 w-5 text-[var(--air-color-icon-error)]" />
        {title}
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-7 text-sm">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              className="rounded-[var(--air-radius-sm)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
              href={`#${error.fieldId}`}
              onClick={() => {
                requestAnimationFrame(() => document.getElementById(error.fieldId)?.focus());
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

