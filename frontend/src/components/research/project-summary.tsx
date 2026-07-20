import * as React from "react";
import { CircleCheck, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProjectSummary as ProjectSummaryModel } from "@/domain/types";
import { cn } from "@/lib/utils";

export type ProjectSummaryAction = {
  href: string;
  label: string;
  message: string;
};

export interface ProjectSummaryProps extends React.HTMLAttributes<HTMLElement> {
  action?: ProjectSummaryAction;
  project: ProjectSummaryModel;
}

export function ProjectSummary({ className, project, action, ...props }: ProjectSummaryProps) {
  const readyCount = project.readyTranscriptCount ?? 0;
  const hasSessions = project.sessionCount > 0;
  const hasReadyTranscripts = readyCount > 0;
  const recommendedAction = action ?? (hasSessions
    ? {
        href: `/projects/${project.id}/sessions`,
        label: "Review sessions",
        message: "Review completed sessions and begin synthesis.",
      }
    : {
        href: `/projects/${project.id}/sessions/new`,
        label: "Create first session",
        message: "Create the first research session for this project.",
      });

  return (
    <section
      className={cn(
        "rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-7",
        className,
      )}
      {...props}
    >
      <h2 className="text-2xl font-semibold leading-tight">{project.name}</h2>
      {project.description ? (
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--air-color-text-secondary)] md:text-base">
          {project.description}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4">
          <div className="text-sm font-semibold text-[var(--air-color-text-secondary)]">Participants</div>
          <div className="mt-1 text-3xl font-semibold">{project.participantCount}</div>
          <div className="mt-2 text-sm text-[var(--air-color-text-secondary)]">
            {project.participantCount ? "Included in this project" : "No participants added"}
          </div>
        </div>
        <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4">
          <div className="text-sm font-semibold text-[var(--air-color-text-secondary)]">Sessions</div>
          <div className="mt-1 text-3xl font-semibold">{project.sessionCount}</div>
          <div className="mt-2 text-sm text-[var(--air-color-text-secondary)]">
            {project.sessionCount ? "Research sessions created" : "No sessions created"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4">
        {hasReadyTranscripts
          ? <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--air-color-icon-primary)]" />
          : <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--air-color-icon-primary)]" />}
        <div>
          <div className="text-sm font-semibold text-[var(--air-color-text-secondary)]">Transcript processing</div>
          <div className="mt-0.5 font-semibold">
            {hasReadyTranscripts
              ? `${readyCount} of ${project.sessionCount} transcripts are ready for analysis.`
              : "No transcripts yet. Add a session and upload its primary transcript to begin."}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-semibold text-[var(--air-color-text-secondary)]">Next recommended action</div>
          <div className="mt-0.5">{recommendedAction.message}</div>
        </div>
        <Button asChild className="shrink-0" size="small">
          <a href={recommendedAction.href}>{recommendedAction.label}</a>
        </Button>
      </div>
    </section>
  );
}

