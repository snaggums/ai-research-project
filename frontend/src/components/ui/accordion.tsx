import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content" | "title"> {
  content: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  showIcon?: boolean;
  styleVariant?: "fill" | "line";
  title: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, content, defaultOpen = false, disabled = false, onOpenChange, open, showIcon = true, styleVariant = "fill", title, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const contentId = React.useId();

    function setOpen(next: boolean) {
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    }

    return (
      <div
        ref={ref}
        className={cn(
          "air-accordion group w-full overflow-hidden bg-[var(--air-color-bg-surface)]",
          styleVariant === "fill" ? "rounded-[var(--air-radius-lg)]" : "border-b border-[var(--air-color-border-default)]",
          disabled && "text-[var(--air-color-text-disabled)]",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center gap-2 px-3 text-left text-sm font-semibold outline-none transition-colors",
            "hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-subtle)]",
            !disabled && "group-hover:bg-[var(--air-color-bg-subtle)] group-active:bg-[var(--air-color-bg-subtle)]",
            disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)] hover:bg-[var(--air-color-bg-disabled)]",
          )}
          aria-controls={contentId}
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setOpen(!isOpen)}
        >
          <span className="min-w-0 flex-1">{title}</span>
          {showIcon ? <ChevronDown aria-hidden="true" className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} /> : null}
        </button>
        {isOpen ? (
          <div
            id={contentId}
            className={cn(
              "min-h-[116px] border-t border-[var(--air-color-border-default)] p-3 text-sm text-[var(--air-color-text-secondary)] transition-colors",
              !disabled && "group-hover:bg-[var(--air-color-bg-subtle)] group-active:bg-[var(--air-color-bg-subtle)]",
              disabled && "bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
            )}
          >
            {content}
          </div>
        ) : null}
      </div>
    );
  },
);
Accordion.displayName = "Accordion";

export { Accordion };
