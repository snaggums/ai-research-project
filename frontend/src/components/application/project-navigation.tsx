import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProjectNavigationLink = {
  href: string;
  id: string;
  label: string;
};

export type ProjectNavigationEntry =
  | (ProjectNavigationLink & { type: "link" })
  | (ProjectNavigationLink & {
      items: ProjectNavigationLink[];
      type: "group";
    });

export interface ProjectNavigationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  activeChildId?: string;
  activeId?: string;
  defaultExpandedId?: string | null;
  expandedId?: string | null;
  items: ProjectNavigationEntry[];
  label?: string;
  onExpandedChange?: (expandedId: string | null) => void;
  onNavigate?: (item: ProjectNavigationLink) => void;
}

export function ProjectNavigation({
  activeChildId,
  activeId,
  className,
  defaultExpandedId,
  expandedId,
  items,
  label = "Project navigation",
  onExpandedChange,
  onNavigate,
  ...props
}: ProjectNavigationProps) {
  const activeGroupId = items.find(
    (item) => item.type === "group" && item.items.some((child) => child.id === activeChildId),
  )?.id;
  const [uncontrolledExpandedId, setUncontrolledExpandedId] = React.useState<string | null>(
    defaultExpandedId ?? activeGroupId ?? null,
  );
  const previousActiveGroupId = React.useRef(activeGroupId);
  const currentExpandedId = expandedId === undefined ? uncontrolledExpandedId : expandedId;

  React.useEffect(() => {
    if (expandedId === undefined) {
      if (activeGroupId) setUncontrolledExpandedId(activeGroupId);
      else if (previousActiveGroupId.current) setUncontrolledExpandedId(null);
    }
    previousActiveGroupId.current = activeGroupId;
  }, [activeGroupId, expandedId]);

  function setExpanded(nextId: string | null) {
    if (expandedId === undefined) setUncontrolledExpandedId(nextId);
    onExpandedChange?.(nextId);
  }

  return (
    <nav aria-label={label} className={cn("w-full", className)} {...props}>
      <ul className="grid gap-1">
        {items.map((item) => {
          if (item.type === "link") {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center overflow-hidden rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-surface)] px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
                    active
                      ? "bg-[var(--air-color-bg-selected)] font-medium text-[var(--air-color-text-brand)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--air-color-interaction-accent)] before:content-['']"
                      : "font-normal text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)]",
                  )}
                  href={item.href}
                  onClick={() => onNavigate?.(item)}
                >
                  {item.label}
                </a>
              </li>
            );
          }

          const expanded = item.id === currentExpandedId;
          const activeChild = item.items.some((child) => child.id === activeChildId);
          const active = item.id === activeId;
          const sectionActive = active && !activeChild;
          const listId = `project-navigation-${item.id}-list`;
          const countLabel = `${item.items.length} ${item.items.length === 1 ? "item" : "items"}`;

          return (
            <li key={item.id}>
              <div
                className={cn(
                  "relative flex min-h-11 items-center overflow-hidden rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-surface)] text-sm font-medium text-[var(--air-color-text-primary)] transition-colors",
                  sectionActive
                    ? "bg-[var(--air-color-bg-selected)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--air-color-interaction-accent)] before:content-['']"
                    : "hover:bg-[var(--air-color-bg-subtle)]",
                )}
              >
                <button
                  aria-controls={listId}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--air-radius-sm)] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-inset"
                  onClick={() => setExpanded(expanded ? null : item.id)}
                  type="button"
                >
                  {expanded
                    ? <ChevronDown aria-hidden="true" className="h-4 w-4" />
                    : <ChevronRight aria-hidden="true" className="h-4 w-4" />}
                </button>
                <a
                  aria-label={`${item.label}, ${countLabel}`}
                  aria-current={active && !activeChild ? "page" : undefined}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-[var(--air-radius-sm)] py-2 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-inset"
                  href={item.href}
                  onClick={() => onNavigate?.(item)}
                >
                  <span className="min-w-0 flex-1 truncate leading-[17px]">{item.label}</span>
                  <span aria-hidden="true" className="text-xs font-normal leading-[15px] tabular-nums">
                    {item.items.length}
                  </span>
                </a>
              </div>
              <ul
                aria-label={`${item.label} list`}
                className={cn("ml-6 mt-1 gap-1", expanded ? "grid" : "hidden")}
                hidden={!expanded}
                id={listId}
              >
                {item.items.map((child) => {
                  const childActive = child.id === activeChildId;
                  return (
                    <li key={child.id}>
                      <a
                        aria-current={childActive ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-11 items-center overflow-hidden rounded-[var(--air-radius-sm)] bg-[var(--air-color-bg-surface)] px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
                          childActive
                            ? "bg-[var(--air-color-bg-selected)] font-medium text-[var(--air-color-text-brand)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--air-color-interaction-accent)] before:content-['']"
                            : "font-normal text-[var(--air-color-text-primary)] hover:bg-[var(--air-color-bg-subtle)]",
                        )}
                        href={child.href}
                        onClick={() => onNavigate?.(child)}
                      >
                        {child.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
