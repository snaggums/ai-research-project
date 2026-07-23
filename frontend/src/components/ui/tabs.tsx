import * as React from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  content?: React.ReactNode;
  disabled?: boolean;
  label: React.ReactNode;
  value: string;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  "aria-label": string;
  defaultValue?: string;
  items: TabItem[];
  onValueChange?: (value: string) => void;
  styleVariant?: "line" | "pill";
  value?: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      "aria-label": ariaLabel,
      className,
      defaultValue,
      items,
      onValueChange,
      styleVariant = "line",
      value,
      ...props
    },
    ref,
  ) => {
    const firstEnabled = items.find((item) => !item.disabled)?.value ?? "";
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? firstEnabled);
    const selectedValue = value ?? internalValue;
    const baseId = React.useId();
    const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

    function select(nextValue: string) {
      if (value === undefined) setInternalValue(nextValue);
      onValueChange?.(nextValue);
    }

    function moveFocus(currentIndex: number, direction: 1 | -1) {
      if (!items.length) return;
      let index = currentIndex;
      for (let count = 0; count < items.length; count += 1) {
        index = (index + direction + items.length) % items.length;
        if (!items[index].disabled) {
          tabRefs.current[index]?.focus();
          select(items[index].value);
          return;
        }
      }
    }

    const selectedItem = items.find((item) => item.value === selectedValue);

    return (
      <div ref={ref} className={className} {...props}>
        <div
          role="tablist"
          aria-label={ariaLabel}
          className={cn("flex items-center", styleVariant === "pill" && "gap-2")}
        >
          {items.map((item, index) => {
            const selected = item.value === selectedValue;
            const tabId = `${baseId}-tab-${index}`;
            const panelId = `${baseId}-panel-${index}`;
            return (
              <button
                key={item.value}
                ref={(node) => { tabRefs.current[index] = node; }}
                id={tabId}
                type="button"
                role="tab"
                aria-controls={item.content !== undefined ? panelId : undefined}
                aria-selected={selected}
                disabled={item.disabled}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  "relative inline-flex items-center justify-center text-base outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-canvas)]",
                  "disabled:cursor-not-allowed disabled:text-[var(--air-color-text-disabled)]",
                  styleVariant === "line"
                    ? "h-[46px] min-w-20 rounded-[var(--air-radius-sm)] px-2 text-[var(--air-color-text-secondary)] hover:bg-[var(--air-color-bg-subtle)] hover:text-[var(--air-color-text-primary)] active:bg-[var(--air-color-interaction-accent-subtle)]"
                    : "h-10 min-w-28 rounded-full border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-4 text-[var(--air-color-text-secondary)] hover:bg-[var(--air-color-bg-subtle)] hover:text-[var(--air-color-text-primary)] active:bg-[var(--air-color-interaction-accent-subtle)]",
                  selected && styleVariant === "line" && "font-semibold text-[var(--air-color-text-brand)]",
                  selected && styleVariant === "pill" && "border-transparent bg-[var(--air-color-bg-brand)] font-semibold text-[var(--air-color-text-inverse)] hover:bg-[var(--air-color-bg-brand-hover)] hover:text-[var(--air-color-text-inverse)] active:bg-[var(--air-color-bg-brand-pressed)]",
                  selected && item.disabled && styleVariant === "pill" && "border-transparent bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
                )}
                onClick={() => select(item.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    moveFocus(index, 1);
                  } else if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveFocus(index, -1);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    const next = items.findIndex((candidate) => !candidate.disabled);
                    if (next >= 0) {
                      tabRefs.current[next]?.focus();
                      select(items[next].value);
                    }
                  } else if (event.key === "End") {
                    event.preventDefault();
                    let next = items.length - 1;
                    while (next >= 0 && items[next].disabled) next -= 1;
                    if (next >= 0) {
                      tabRefs.current[next]?.focus();
                      select(items[next].value);
                    }
                  }
                }}
              >
                {item.label}
                {styleVariant === "line" && selected ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-0.5 bg-[var(--air-color-interaction-accent)]",
                      item.disabled && "bg-[var(--air-color-border-strong)]",
                    )}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        {selectedItem?.content !== undefined ? (
          <div
            id={`${baseId}-panel-${items.indexOf(selectedItem)}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${items.indexOf(selectedItem)}`}
            tabIndex={0}
            className="mt-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)]"
          >
            {selectedItem.content}
          </div>
        ) : null}
      </div>
    );
  },
);
Tabs.displayName = "Tabs";

export { Tabs };
