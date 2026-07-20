import * as React from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";

import { DropdownMenu, type DropdownMenuItem } from "@/components/application/dropdown-menu";
import type { ProjectSummary } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface ProjectCardProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  onDelete?: () => void;
  onEdit?: () => void;
  project: ProjectSummary;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(new Date(value));
}

export function ProjectCard({
  className,
  href,
  onDelete,
  onEdit,
  project,
  ...props
}: ProjectCardProps) {
  const menuItems: DropdownMenuItem[] = [
    ...(onEdit ? [{ id: "edit", label: "Edit project", icon: Pencil } satisfies DropdownMenuItem] : []),
    ...(onDelete ? [{ id: "delete", label: "Delete project", icon: Trash2, tone: "destructive" } satisfies DropdownMenuItem] : []),
  ];

  return (
    <article
      className={cn(
        "air-project-card relative flex min-h-72 flex-col rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 transition-colors",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-6">{project.name}</h2>
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--air-color-text-secondary)]">
            {project.description}
          </p>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
        <span>{project.participantCount} {project.participantCount === 1 ? "participant" : "participants"}</span>
        <span aria-hidden="true" className="text-[var(--air-color-text-secondary)]">•</span>
        <span>{project.sessionCount} {project.sessionCount === 1 ? "session" : "sessions"}</span>
      </div>
      {project.readyTranscriptCount !== undefined ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--air-color-text-secondary)]">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--air-color-interaction-progress)]" />
          {project.readyTranscriptCount} {project.readyTranscriptCount === 1 ? "transcript" : "transcripts"} ready
        </div>
      ) : null}

      <div className="my-5 border-t border-[var(--air-color-border-default)]" />
      <div className="mt-auto flex items-center gap-4">
        <span className="mr-auto text-xs text-[var(--air-color-text-secondary)]">
          Updated {formatUpdatedAt(project.updatedAt)}
        </span>
        <a
          className="air-project-card-link inline-flex min-h-11 items-center gap-1 rounded-[var(--air-radius-sm)] px-2 text-sm font-semibold text-[var(--air-color-text-primary)] outline-none after:absolute after:inset-0"
          href={href}
        >
          Open project
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </a>
        {menuItems.length ? (
          <div className="relative z-10">
            <DropdownMenu
              items={menuItems}
              label={`Actions for ${project.name}`}
              onSelect={(item) => {
                if (item.id === "edit") onEdit?.();
                if (item.id === "delete") onDelete?.();
              }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

