import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid content-start gap-2", className)} {...props} />
  ),
);
Field.displayName = "Field";

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean;
  required?: boolean;
}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ children, className, optional, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-[var(--air-color-text-primary)]", className)}
      {...props}
    >
      {children}
      {required ? (
        <><span aria-hidden="true" className="ml-1 text-[var(--air-color-text-error)]">*</span><span className="sr-only"> (required)</span></>
      ) : null}
      {optional ? (
        <span className="ml-1 font-normal text-[var(--air-color-text-secondary)]">(optional)</span>
      ) : null}
    </label>
  ),
);
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-[var(--air-color-text-secondary)]", className)}
      {...props}
    />
  ),
);
FieldDescription.displayName = "FieldDescription";

const FieldError = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex min-h-10 items-center gap-2 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-danger-subtle)] px-3 py-2 text-sm text-[var(--air-color-text-primary)]",
        className,
      )}
      role="alert"
      {...props}
    >
      <CircleAlert
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-[var(--air-color-icon-error)]"
      />
      <span>{children}</span>
    </div>
  ),
);
FieldError.displayName = "FieldError";

function fieldDescriptionIds(id: string, hint?: React.ReactNode, error?: React.ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export { Field, FieldDescription, FieldError, FieldLabel, fieldDescriptionIds };
