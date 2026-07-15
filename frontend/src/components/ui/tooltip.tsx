import * as React from "react";

import { cn } from "@/lib/utils";

export type TooltipPlacement =
  | "top-start"
  | "top"
  | "top-end"
  | "bottom-start"
  | "bottom"
  | "bottom-end"
  | "left"
  | "right";

export type TooltipPointer =
  | "none"
  | "center-right"
  | "center-left"
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const arrowClasses: Record<Exclude<TooltipPointer, "none">, string> = {
  "center-right": "right-[-6px] top-1/2 -translate-y-1/2",
  "center-left": "left-[-6px] top-1/2 -translate-y-1/2",
  "top-left": "left-5 top-[-6px]",
  "top-center": "left-1/2 top-[-6px] -translate-x-1/2",
  "top-right": "right-5 top-[-6px]",
  "bottom-left": "bottom-[-6px] left-5",
  "bottom-center": "bottom-[-6px] left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-[-6px] right-5",
};

export interface TooltipSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  description?: React.ReactNode;
  pointer?: TooltipPointer;
  size?: "small" | "large";
  title?: React.ReactNode;
}

const TooltipSurface = React.forwardRef<HTMLDivElement, TooltipSurfaceProps>(
  (
    {
      children,
      className,
      description,
      pointer = "bottom-center",
      size = "small",
      title,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-[var(--air-radius-lg)] bg-[var(--air-color-text-primary)] text-[var(--air-color-text-inverse)] shadow-[var(--air-shadow-overlay)]",
        size === "small" ? "w-[120px] px-3 py-2 text-sm" : "w-[300px] p-4",
        className,
      )}
      {...props}
    >
      {size === "large" ? (
        <div className="grid gap-2">
          {title ? <div className="text-base font-semibold leading-5">{title}</div> : null}
          <div className="text-sm leading-5">{description ?? children}</div>
        </div>
      ) : (
        <div className="leading-5">{children ?? description}</div>
      )}
      {pointer !== "none" ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute h-3 w-3 rotate-45 bg-[var(--air-color-text-primary)]",
            arrowClasses[pointer],
          )}
        />
      ) : null}
    </div>
  ),
);
TooltipSurface.displayName = "TooltipSurface";

const placementClasses: Record<TooltipPlacement, string> = {
  "top-start": "bottom-full left-0 mb-2",
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  "top-end": "bottom-full right-0 mb-2",
  "bottom-start": "left-0 top-full mt-2",
  bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
  "bottom-end": "right-0 top-full mt-2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

const placementPointers: Record<TooltipPlacement, TooltipPointer> = {
  "top-start": "bottom-left",
  top: "bottom-center",
  "top-end": "bottom-right",
  "bottom-start": "top-left",
  bottom: "top-center",
  "bottom-end": "top-right",
  left: "center-right",
  right: "center-left",
};

export interface TooltipProps {
  children: React.ReactElement;
  className?: string;
  content?: React.ReactNode;
  defaultOpen?: boolean;
  delayDuration?: number;
  description?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: TooltipPlacement;
  size?: "small" | "large";
  title?: React.ReactNode;
}

function Tooltip({
  children,
  className,
  content,
  defaultOpen = false,
  delayDuration = 300,
  description,
  onOpenChange,
  open,
  placement = "top",
  size = "small",
  title,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const id = React.useId();
  const wrapperRef = React.useRef<HTMLSpanElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const childProps = children.props as React.HTMLAttributes<HTMLElement>;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange, open],
  );

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  React.useEffect(() => clearTimer, [clearTimer]);

  React.useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpen]);

  const trigger = React.cloneElement(children, {
    "aria-describedby": isOpen ? id : childProps["aria-describedby"],
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      setOpen(false);
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      clearTimer();
      setOpen(true);
    },
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(event);
      clearTimer();
      timerRef.current = setTimeout(() => setOpen(true), delayDuration);
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(event);
      clearTimer();
      setOpen(false);
    },
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <span ref={wrapperRef} className={cn("relative inline-flex", className)}>
      {trigger}
      {isOpen ? (
        <TooltipSurface
          id={id}
          role="tooltip"
          className={cn("pointer-events-none absolute z-50", placementClasses[placement])}
          description={description}
          pointer={placementPointers[placement]}
          size={size}
          title={title}
        >
          {content}
        </TooltipSurface>
      ) : null}
    </span>
  );
}

export { Tooltip, TooltipSurface };
