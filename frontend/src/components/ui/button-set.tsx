import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ButtonSetProps extends React.HTMLAttributes<HTMLDivElement> {
  cancelLabel?: React.ReactNode;
  onCancel?: () => void;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryLabel?: React.ReactNode;
  primaryType?: "button" | "submit" | "reset";
  secondaryLabel?: React.ReactNode;
  showCancel?: boolean;
  size?: "small" | "large";
}

const ButtonSet = React.forwardRef<HTMLDivElement, ButtonSetProps>(
  ({ cancelLabel = "Cancel", className, onCancel, onPrimary, onSecondary, primaryLabel = "Continue", primaryType = "button", secondaryLabel, showCancel = true, size = "small", ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-wrap items-center justify-end gap-3", className)} {...props}>
      {showCancel ? <Button type="button" size={size} variant="text" onClick={onCancel}>{cancelLabel}</Button> : null}
      {secondaryLabel ? <Button type="button" size={size} variant="gray-subtle" onClick={onSecondary}>{secondaryLabel}</Button> : null}
      <Button type={primaryType} size={size} variant="brand" onClick={onPrimary}>{primaryLabel}</Button>
    </div>
  ),
);
ButtonSet.displayName = "ButtonSet";

export { ButtonSet };
