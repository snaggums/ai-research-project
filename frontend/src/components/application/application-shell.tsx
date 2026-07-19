import * as React from "react";
import {
  Bell,
  Menu,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { globalNavigationItems, projectNavigationItems } from "@/components/application/navigation-model";
import { cn } from "@/lib/utils";

export type ProjectNavigationItem =
  | "overview"
  | "participants"
  | "sessions"
  | "ask-project";

export type NavigationItem<T extends string = string> = {
  id: T;
  label: string;
  href: string;
  icon?: LucideIcon;
  children?: NavigationItem[];
};

export interface GlobalHeaderProps extends React.HTMLAttributes<HTMLElement> {
  notificationsLabel?: string;
  onOpenNavigation?: () => void;
  projectName?: string;
  settingsHref?: string;
  settingsLabel?: string;
  showProjectSearch?: boolean;
  workspaceName?: string;
}

export function GlobalHeader({
  className,
  notificationsLabel = "Notifications",
  onOpenNavigation,
  projectName,
  settingsHref = "/settings/ai",
  settingsLabel = "Settings",
  showProjectSearch = false,
  workspaceName = "Sky AIR",
  ...props
}: GlobalHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-[var(--air-color-bg-canvas)]",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex min-h-16 w-full max-w-[100rem] items-center gap-3 border-b border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-4 md:px-6">
        <IconButton
          className="lg:hidden"
          icon={<Menu aria-hidden="true" className="h-4 w-4" />}
          label="Open navigation"
          onClick={onOpenNavigation}
          variant="text"
        />
        <a
          className="flex shrink-0 items-center gap-2 rounded-[var(--air-radius-sm)] font-semibold text-[var(--air-color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
          href="/projects"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-brand)] text-sm font-bold text-[var(--air-color-text-inverse)]"
          >
            AIR
          </span>
          <span className="hidden sm:inline">{workspaceName}</span>
        </a>

        {showProjectSearch && projectName ? (
          <div className="mx-auto hidden w-full max-w-xl md:block">
            <label className="sr-only" htmlFor="project-search">
              Search {projectName}
            </label>
            <input
              className="h-11 w-full rounded-[var(--air-radius-md)] border border-[var(--air-color-border-control)] bg-[var(--air-color-bg-surface)] px-3 text-sm outline-none placeholder:text-[var(--air-color-text-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
              id="project-search"
              placeholder={`Search ${projectName}`}
              type="search"
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <IconButton
          icon={<Bell aria-hidden="true" className="h-4 w-4" />}
          label={notificationsLabel}
          variant="text"
        />
        <Button asChild aria-label={settingsLabel} size="icon-small" variant="text">
          <a href={settingsHref}>
            <Settings aria-hidden="true" className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}

export interface NavigationProps<T extends string = string>
  extends React.HTMLAttributes<HTMLElement> {
  activeChildId?: string;
  activeId?: T;
  items: NavigationItem<T>[];
  label: string;
  onNavigate?: () => void;
}

export function Navigation<T extends string>({
  activeChildId,
  activeId,
  className,
  items,
  label,
  onNavigate,
  ...props
}: NavigationProps<T>) {
  return (
    <nav aria-label={label} className={className} {...props}>
      <ul className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const activeChild = item.children?.some((child) => child.id === activeChildId) ?? false;
          const active = item.id === activeId;
          const sectionActive = active || activeChild;
          return (
            <li key={item.id}>
              <a
                aria-current={active && !activeChild ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-[var(--air-radius-md)] px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
                  sectionActive
                    ? "bg-[var(--air-color-bg-selected)] text-[var(--air-color-text-primary)]"
                    : "text-[var(--air-color-text-secondary)] hover:bg-[var(--air-color-bg-subtle)] hover:text-[var(--air-color-text-primary)]",
                )}
                href={item.href}
                onClick={onNavigate}
              >
                {Icon ? <Icon aria-hidden="true" className="h-5 w-5 shrink-0" /> : null}
                {item.label}
              </a>
              {sectionActive && item.children?.length ? (
                <ul aria-label={`${item.label} list`} className="ml-6 mt-1 grid gap-1">
                  {item.children.map((child) => {
                    const childActive = child.id === activeChildId;
                    return (
                      <li key={child.id}>
                        <a
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center rounded-[var(--air-radius-md)] px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2",
                            childActive
                              ? "bg-[var(--air-color-bg-selected)] text-[var(--air-color-text-primary)]"
                              : "text-[var(--air-color-text-secondary)] hover:bg-[var(--air-color-bg-subtle)] hover:text-[var(--air-color-text-primary)]",
                          )}
                          href={child.href}
                          onClick={onNavigate}
                        >
                          {child.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface ApplicationShellProps {
  activeGlobalItem?: "projects" | "records" | null;
  activeGlobalSubItem?: string;
  activeProjectItem?: ProjectNavigationItem;
  children: React.ReactNode;
  context: "workspace" | "project";
  project?: { id: string; name: string };
  showProjectSearch?: boolean;
}

export function ApplicationShell({
  activeGlobalItem = "projects",
  activeGlobalSubItem,
  activeProjectItem,
  children,
  context,
  project,
  showProjectSearch = false,
}: ApplicationShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = React.useState(false);
  const navItems = context === "project" && project
    ? projectNavigationItems(project.id)
    : globalNavigationItems;
  const activeId = context === "project" ? activeProjectItem : activeGlobalItem ?? undefined;

  React.useEffect(() => {
    if (!mobileNavigationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavigationOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavigationOpen]);

  return (
    <div className="min-h-screen bg-[var(--air-color-bg-canvas)] text-[var(--air-color-text-primary)]">
      <a
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-brand)] px-4 py-2 text-[var(--air-color-text-inverse)] outline-none focus:translate-y-0 focus:ring-2 focus:ring-[var(--air-color-interaction-focus)] focus:ring-offset-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <GlobalHeader
        onOpenNavigation={() => setMobileNavigationOpen(true)}
        projectName={project?.name}
        showProjectSearch={showProjectSearch}
      />

      {mobileNavigationOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-[var(--air-color-slate-900)]/40"
            onClick={() => setMobileNavigationOpen(false)}
            type="button"
          />
          <aside
            aria-label="Mobile navigation panel"
            className="relative h-full w-[min(20rem,88vw)] border-r border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 shadow-[var(--air-shadow-overlay)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Navigation</span>
              <IconButton
                icon={<X aria-hidden="true" className="h-4 w-4" />}
                label="Close navigation"
                onClick={() => setMobileNavigationOpen(false)}
                variant="text"
              />
            </div>
            {project ? (
              <div className="mb-4 border-b border-[var(--air-color-border-default)] pb-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--air-color-text-secondary)]">
                  Project
                </div>
                <div className="mt-1 font-semibold">{project.name}</div>
              </div>
            ) : null}
            <Navigation
              activeChildId={context === "workspace" ? activeGlobalSubItem : undefined}
              activeId={activeId}
              items={navItems}
              label={context === "project" ? "Project navigation" : "Global navigation"}
              onNavigate={() => setMobileNavigationOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[100rem] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 lg:block">
          {project ? (
            <div className="mb-4 border-b border-[var(--air-color-border-default)] px-3 pb-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--air-color-text-secondary)]">
                Project
              </div>
              <div className="mt-1 font-semibold">{project.name}</div>
            </div>
          ) : null}
          <Navigation
            activeChildId={context === "workspace" ? activeGlobalSubItem : undefined}
            activeId={activeId}
            items={navItems}
            label={context === "project" ? "Project navigation" : "Global navigation"}
          />
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
