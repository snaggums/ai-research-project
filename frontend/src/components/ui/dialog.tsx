import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { ButtonSet } from "@/components/ui/button-set";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export interface DialogProps {
  cancelLabel?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  description: React.ReactNode;
  dismissible?: boolean;
  feedback?: React.ReactNode;
  intent?: "default" | "destructive";
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
  onPrimary?: () => void;
  onSecondary?: () => void;
  open?: boolean;
  primaryLabel?: React.ReactNode;
  secondaryLabel?: React.ReactNode;
  showActions?: boolean;
  size?: "small" | "large";
  title: React.ReactNode;
  trigger?: React.ReactElement;
}

function Dialog({
  cancelLabel = "Cancel",
  children,
  className,
  defaultOpen = false,
  description,
  dismissible = true,
  feedback,
  intent = "default",
  onCancel,
  onOpenChange,
  onPrimary,
  onSecondary,
  open: controlledOpen,
  primaryLabel = "Continue",
  secondaryLabel,
  showActions = true,
  size = "small",
  title,
  trigger,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  const updateOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const completeAction = (callback?: () => void) => {
    callback?.();
    updateOpen(false);
  };

  const large = size === "large";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={updateOpen}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50" />
        <DialogPrimitive.Content
          aria-modal="true"
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-32px)] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-auto rounded-xl border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)] shadow-[var(--air-shadow-overlay)] focus:outline-none",
            large ? "min-h-[220px] w-[500px] gap-4 p-6" : "min-h-[180px] w-[350px] gap-2 p-4",
            className,
          )}
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
        >
          <div className={cn("flex shrink-0 items-center justify-between gap-2", large ? "h-12" : "h-11")}>
            <DialogPrimitive.Title className={cn("min-w-0 font-semibold", large ? "text-2xl leading-8" : "text-xl leading-7")}>
              {title}
            </DialogPrimitive.Title>
            {dismissible ? (
              <DialogPrimitive.Close asChild>
                <IconButton
                  icon={<X aria-hidden="true" size={large ? 24 : 16} />}
                  label="Close dialog"
                  size={size}
                  variant="gray-subtle"
                />
              </DialogPrimitive.Close>
            ) : null}
          </div>

          <DialogPrimitive.Description asChild>
            <div className={cn("shrink-0", large ? "text-lg leading-7" : "text-base leading-6")}>{description}</div>
          </DialogPrimitive.Description>

          {children ? <div>{children}</div> : null}
          {feedback ?? null}

          {showActions ? (
            <div className={cn("mt-auto flex shrink-0 items-center justify-end", large ? "min-h-12" : "min-h-11")}>
              <ButtonSet
                cancelLabel={cancelLabel}
                onCancel={() => completeAction(onCancel)}
                onPrimary={() => completeAction(onPrimary)}
                onSecondary={() => completeAction(onSecondary)}
                primaryLabel={primaryLabel}
                primaryVariant={intent === "destructive" ? "danger" : "brand"}
                secondaryLabel={secondaryLabel}
                size={size}
              />
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DialogErrorFeedback({ message = "Something went wrong" }: { message?: React.ReactNode }) {
  return <Alert presentation="contained" size="small" title={message} tone="error" />;
}

export { Dialog, DialogErrorFeedback };
