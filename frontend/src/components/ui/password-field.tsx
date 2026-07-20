import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { InputField, type InputFieldProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordFieldProps extends Omit<InputFieldProps, "rightAction" | "rightIcon" | "type"> {
  defaultVisible?: boolean;
  hidePasswordLabel?: string;
  onVisibleChange?: (visible: boolean) => void;
  showPasswordLabel?: string;
  showVisibilityToggle?: boolean;
  visible?: boolean;
}

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      defaultVisible = false,
      disabled,
      hidePasswordLabel = "Hide password",
      onVisibleChange,
      showPasswordLabel = "Show password",
      showVisibilityToggle = true,
      visible: controlledVisible,
      ...props
    },
    ref,
  ) => {
    const [internalVisible, setInternalVisible] = React.useState(defaultVisible);
    const visible = controlledVisible ?? internalVisible;

    const updateVisible = () => {
      const nextVisible = !visible;
      if (controlledVisible === undefined) setInternalVisible(nextVisible);
      onVisibleChange?.(nextVisible);
    };

    return (
      <InputField
        ref={ref}
        disabled={disabled}
        type={visible ? "text" : "password"}
        rightAction={showVisibilityToggle ? (
          <button
            type="button"
            aria-label={visible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={visible}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[var(--air-radius-sm)] text-[var(--air-color-text-primary)] outline-none",
              "hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-active)]",
              "disabled:cursor-not-allowed disabled:text-[var(--air-color-text-disabled)]",
            )}
            disabled={disabled}
            onClick={updateVisible}
          >
            {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
          </button>
        ) : undefined}
        {...props}
      />
    );
  },
);
PasswordField.displayName = "PasswordField";

export { PasswordField };
