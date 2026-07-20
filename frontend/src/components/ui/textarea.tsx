import * as React from "react";

import { Field, FieldDescription, FieldError, FieldLabel, fieldDescriptionIds } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-28 w-full resize-y rounded-[var(--air-radius-md)] border bg-[var(--air-color-bg-surface)] px-3 py-3 text-sm text-[var(--air-color-text-primary)] outline-none transition-colors placeholder:text-[var(--air-color-text-secondary)]",
        invalid ? "border-[var(--air-color-border-error)]" : "border-[var(--air-color-border-control)]",
        "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
        disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export interface TextareaFieldProps extends Omit<TextareaProps, "id"> {
  error?: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
  label?: React.ReactNode;
  optional?: boolean;
}

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ error, hint, id: providedId, invalid, label, optional, required, ...props }, ref) => {
    const generatedId = React.useId();
    const id = providedId ?? generatedId;
    const describedBy = fieldDescriptionIds(id, hint, error);

    return (
      <Field>
        {label ? (
          <FieldLabel htmlFor={id} optional={optional} required={required}>
            {label}
          </FieldLabel>
        ) : null}
        <Textarea
          ref={ref}
          id={id}
          required={required}
          invalid={Boolean(error) || invalid}
          aria-describedby={describedBy}
          {...props}
        />
        {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
        {!error && hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      </Field>
    );
  },
);
TextareaField.displayName = "TextareaField";

export { Textarea, TextareaField };
