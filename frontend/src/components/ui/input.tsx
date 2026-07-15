import * as React from "react";

import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldError, FieldLabel, fieldDescriptionIds } from "@/components/ui/field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, invalid, leftIcon, rightAction, rightIcon, type, ...props }, ref) => (
    <div
      className={cn(
        "flex h-12 w-full items-center rounded-[var(--air-radius-md)] border bg-[var(--air-color-bg-surface)] transition-colors",
        invalid ? "border-[var(--air-color-border-error)]" : "border-[var(--air-color-border-control)]",
        "focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--air-color-interaction-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--air-color-bg-canvas)]",
        disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
        className,
      )}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
    >
      {leftIcon ? (
        <span aria-hidden="true" className="ml-3 flex shrink-0 text-[var(--air-color-text-secondary)]">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--air-color-text-primary)] outline-none placeholder:text-[var(--air-color-text-secondary)]",
          "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          disabled && "cursor-not-allowed text-[var(--air-color-text-disabled)]",
          leftIcon && "pl-2",
          (rightAction || rightIcon) && "pr-2",
        )}
        disabled={disabled}
        type={type}
        {...props}
      />
      {rightIcon ? (
        <span aria-hidden="true" className="pointer-events-none mr-3 flex shrink-0 text-[var(--air-color-text-secondary)]">
          {rightIcon}
        </span>
      ) : null}
      {rightAction ? <span className="mr-2 flex shrink-0">{rightAction}</span> : null}
    </div>
  ),
);
Input.displayName = "Input";

export interface InputFieldProps extends Omit<InputProps, "id"> {
  error?: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
  label?: React.ReactNode;
  optional?: boolean;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
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
        <Input
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
InputField.displayName = "InputField";

export { Input, InputField };
