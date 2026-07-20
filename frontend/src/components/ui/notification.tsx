import * as React from "react";
import { Settings } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export interface NotificationItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title" | "onSelect"> {
  actorName: string;
  avatar?: React.ReactNode;
  defaultSelected?: boolean;
  details?: React.ReactNode;
  onSelectedChange?: (selected: boolean) => void;
  selected?: boolean;
  time: React.ReactNode;
  title: React.ReactNode;
  unread?: boolean;
}

const NotificationItem = React.forwardRef<HTMLButtonElement, NotificationItemProps>(
  (
    {
      actorName,
      avatar,
      className,
      defaultSelected = false,
      details,
      disabled = false,
      onClick,
      onSelectedChange,
      selected: controlledSelected,
      time,
      title,
      type = "button",
      unread = true,
      ...props
    },
    ref,
  ) => {
    const [internalSelected, setInternalSelected] = React.useState(defaultSelected);
    const selected = controlledSelected ?? internalSelected;

    const updateSelected = (nextSelected: boolean) => {
      if (controlledSelected === undefined) setInternalSelected(nextSelected);
      onSelectedChange?.(nextSelected);
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        disabled={disabled}
        className={cn(
          "air-notification-item flex min-h-[104px] w-[446px] max-w-full items-start gap-4 border border-[var(--air-color-border-default)] p-4 text-left text-[var(--air-color-text-primary)] transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--air-color-interaction-focus)]",
          selected
            ? "bg-[var(--air-color-bg-selected)] hover:border-[var(--air-color-interaction-accent)] active:border-[var(--air-color-interaction-accent)]"
            : "bg-[var(--air-color-bg-canvas)] hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-bg-selected)]",
          disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) updateSelected(!selected);
        }}
        {...props}
      >
        <span className={cn("shrink-0", disabled && "opacity-50")}>
          {avatar ?? <Avatar alt={actorName} initials={initialsFromName(actorName)} size="large" />}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-h-6 min-w-0 items-center gap-1">
            <span className="shrink-0 text-sm font-semibold leading-5">{actorName}</span>
            <span className="min-w-0 flex-1 text-base leading-6">{title}</span>
          </span>
          <span className="text-xs leading-4">{time}</span>
          {details ? <span className="truncate text-base leading-5">{details}</span> : null}
        </span>

        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {unread ? (
            <>
              <span className="sr-only">Unread</span>
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--air-color-interaction-accent)]" />
            </>
          ) : null}
        </span>
      </button>
    );
  },
);
NotificationItem.displayName = "NotificationItem";

export interface NotificationData {
  actorName: string;
  avatar?: React.ReactNode;
  details?: React.ReactNode;
  disabled?: boolean;
  id: string;
  time: React.ReactNode;
  title: React.ReactNode;
  unread?: boolean;
}

export interface NotificationPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  defaultSelectedIds?: string[];
  emptyMessage?: React.ReactNode;
  items: NotificationData[];
  onSelectedIdsChange?: (selectedIds: string[]) => void;
  onSettings?: () => void;
  selectedIds?: string[];
  settingsLabel?: string;
  showSettings?: boolean;
  title?: React.ReactNode;
}

const NotificationPanel = React.forwardRef<HTMLElement, NotificationPanelProps>(
  (
    {
      className,
      defaultSelectedIds = [],
      emptyMessage = "No notifications",
      items,
      onSelectedIdsChange,
      onSettings,
      selectedIds: controlledSelectedIds,
      settingsLabel = "Notification settings",
      showSettings = true,
      title = "Notifications",
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const [internalSelectedIds, setInternalSelectedIds] = React.useState(defaultSelectedIds);
    const selectedIds = controlledSelectedIds ?? internalSelectedIds;

    const updateSelection = (id: string, selected: boolean) => {
      const nextIds = selected ? Array.from(new Set([...selectedIds, id])) : selectedIds.filter((selectedId) => selectedId !== id);
      if (controlledSelectedIds === undefined) setInternalSelectedIds(nextIds);
      onSelectedIdsChange?.(nextIds);
    };

    return (
      <section
        ref={ref}
        aria-labelledby={titleId}
        className={cn(
          "w-[446px] max-w-full overflow-hidden rounded-xl border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)]",
          className,
        )}
        {...props}
      >
        <header className="flex h-14 items-center justify-between border-b border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] pl-4 pr-2">
          <h2 id={titleId} className="text-xl font-semibold leading-7">{title}</h2>
          {showSettings ? (
            <IconButton
              icon={<Settings aria-hidden="true" size={16} />}
              label={settingsLabel}
              onClick={onSettings}
              size="small"
              variant="gray-subtle"
            />
          ) : null}
        </header>

        {items.length > 0 ? (
          <ul aria-label="Notification items">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationItem
                  actorName={item.actorName}
                  avatar={item.avatar}
                  className="border-x-0 border-b-0"
                  details={item.details}
                  disabled={item.disabled}
                  onSelectedChange={(selected) => updateSelection(item.id, selected)}
                  selected={selectedIds.includes(item.id)}
                  time={item.time}
                  title={item.title}
                  unread={item.unread}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-sm text-[var(--air-color-text-secondary)]">{emptyMessage}</div>
        )}
      </section>
    );
  },
);
NotificationPanel.displayName = "NotificationPanel";

export { NotificationItem, NotificationPanel };
