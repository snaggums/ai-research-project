import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

export interface IconButtonProps
  extends Omit<ButtonProps, "aria-label" | "children" | "size"> {
  label: string;
  icon: React.ReactNode;
  size?: "small" | "large";
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = "small", variant = "gray-subtle", ...props }, ref) => (
    <Button
      ref={ref}
      aria-label={label}
      size={size === "small" ? "icon-small" : "icon-large"}
      variant={variant}
      {...props}
    >
      {icon}
    </Button>
  ),
);

IconButton.displayName = "IconButton";

export { IconButton };
