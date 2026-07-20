import * as React from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "error";

const alertToneStyles: Record<AlertTone, React.CSSProperties> = {
  info: {
    backgroundColor: "var(--air-color-status-information-bg)",
    borderColor: "var(--air-color-status-information-border)",
    color: "var(--air-color-status-information-text)",
  },
  success: {
    backgroundColor: "var(--air-color-status-success-bg)",
    borderColor: "var(--air-color-status-success-border)",
    color: "var(--air-color-status-success-text)",
  },
  warning: {
    backgroundColor: "var(--air-color-status-warning-bg)",
    borderColor: "var(--air-color-status-warning-border)",
    color: "var(--air-color-status-warning-text)",
  },
  error: {
    backgroundColor: "var(--air-color-status-error-bg)",
    borderColor: "var(--air-color-status-error-border)",
    color: "var(--air-color-status-error-text)",
  },
};

const alertIcons: Record<AlertTone, React.ReactNode> = {
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  error: <CircleAlert />,
};

const alertIconColors: Record<AlertTone, string> = {
  info: "var(--air-color-status-information-text)",
  success: "var(--air-color-icon-success)",
  warning: "var(--air-color-icon-warning)",
  error: "var(--air-color-icon-error)",
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  dismissLabel?: string;
  dismissible?: boolean;
  icon?: React.ReactNode;
  message?: React.ReactNode;
  onDismiss?: () => void;
  presentation?: "full-bleed" | "contained";
  showIcon?: boolean;
  size?: "small" | "large";
  title: React.ReactNode;
  tone?: AlertTone;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      dismissLabel = "Dismiss notification",
      dismissible = false,
      icon,
      message,
      onDismiss,
      presentation = "contained",
      role,
      showIcon = true,
      size = "small",
      style,
      title,
      tone = "info",
      ...props
    },
    ref,
  ) => {
    const [dismissed, setDismissed] = React.useState(false);
    if (dismissed) return null;

    return (
      <div
        ref={ref}
        role={role ?? (tone === "error" ? "alert" : "status")}
        className={cn(
          "flex w-full items-start",
          presentation === "contained" ? "rounded-[var(--air-radius-lg)] border" : "border-0",
          size === "small" ? "min-h-10 gap-2 px-3 py-2 text-sm" : "min-h-20 gap-3 p-4 text-sm",
          className,
        )}
        style={{ ...alertToneStyles[tone], ...style }}
        {...props}
      >
        {showIcon ? (
          <span
            aria-hidden="true"
            className={cn("shrink-0 [&_svg]:h-full [&_svg]:w-full", size === "small" ? "h-5 w-5" : "h-6 w-6")}
            style={{ color: alertIconColors[tone] }}
          >
            {icon ?? alertIcons[tone]}
          </span>
        ) : null}
        <div className={cn("min-w-0 flex-1", size === "large" && "grid gap-1")}>
          <div className="font-semibold leading-5">{title}</div>
          {size === "large" && message ? <div className="leading-5">{message}</div> : null}
        </div>
        {dismissible ? (
          <button
            type="button"
            className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--air-radius-sm)] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]"
            aria-label={dismissLabel}
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    );
  },
);
Alert.displayName = "Alert";

export { Alert };
