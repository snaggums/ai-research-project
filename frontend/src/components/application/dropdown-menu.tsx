import * as React from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export type DropdownMenuItem = {
  disabled?: boolean;
  icon?: LucideIcon;
  id: string;
  label: string;
  tone?: "default" | "destructive";
};

export interface DropdownMenuProps {
  align?: "start" | "end";
  items: DropdownMenuItem[];
  label?: string;
  onSelect: (item: DropdownMenuItem) => void;
  triggerIcon?: React.ReactNode;
}

export function DropdownMenu({
  align = "end",
  items,
  label = "Open actions",
  onSelect,
  triggerIcon = <Ellipsis aria-hidden="true" className="h-4 w-4" />,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = React.useId();

  const enabledIndexes = React.useMemo(
    () => items.map((item, index) => (!item.disabled ? index : -1)).filter((index) => index >= 0),
    [items],
  );

  const close = React.useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [close, open]);

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => itemRefs.current[enabledIndexes[0]]?.focus());
  }, [enabledIndexes, open]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = itemRefs.current.findIndex((item) => item === document.activeElement);
    let next = enabledIndexes[0];
    if (event.key === "End") next = enabledIndexes.at(-1) ?? next;
    if (event.key === "ArrowDown") {
      const position = enabledIndexes.indexOf(current);
      next = enabledIndexes[(position + 1) % enabledIndexes.length];
    }
    if (event.key === "ArrowUp") {
      const position = enabledIndexes.indexOf(current);
      next = enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length];
    }
    itemRefs.current[next]?.focus();
  };

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <IconButton
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        icon={triggerIcon}
        label={label}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        variant="gray-subtle"
      />
      {open ? (
        <div
          aria-label={label}
          className={cn(
            "absolute top-[calc(100%+0.25rem)] z-40 min-w-52 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-1 shadow-[var(--air-shadow-overlay)]",
            align === "end" ? "right-0" : "left-0",
          )}
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                className={cn(
                  "flex min-h-10 w-full items-center gap-2 rounded-[var(--air-radius-sm)] px-3 py-2 text-left text-sm outline-none hover:bg-[var(--air-color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--air-color-interaction-focus)] disabled:cursor-not-allowed disabled:text-[var(--air-color-text-disabled)]",
                  item.tone === "destructive" && "text-[var(--air-color-text-error)] hover:bg-[var(--air-color-status-error-bg)]",
                )}
                disabled={item.disabled}
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  close();
                }}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                role="menuitem"
                tabIndex={-1}
                type="button"
              >
                {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

