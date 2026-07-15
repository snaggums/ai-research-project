import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ProjectWorkflowStepStatus = "complete" | "current" | "upcoming";

export type ProjectWorkflowAction = {
  href: string;
  label: string;
};

export type ProjectWorkflowStep = {
  action?: ProjectWorkflowAction;
  description: string;
  id: string;
  status: ProjectWorkflowStepStatus;
  title: string;
};

export interface ProjectWorkflowSummaryProps extends React.HTMLAttributes<HTMLElement> {
  completionAction?: ProjectWorkflowAction;
  description?: string;
  steps: ProjectWorkflowStep[];
  title?: string;
}

const statusPresentation = {
  complete: { label: "Complete", tone: "success" },
  current: { label: "Current", tone: "brand" },
  upcoming: { label: "Upcoming", tone: "neutral" },
} as const;

export function ProjectWorkflowSummary({
  className,
  completionAction,
  description = "Complete these steps to prepare this project for transcript review.",
  steps,
  title = "Project setup",
  ...props
}: ProjectWorkflowSummaryProps) {
  const completedCount = steps.filter((step) => step.status === "complete").length;
  const progress = steps.length ? (completedCount / steps.length) * 100 : 0;
  const currentAction = steps.find((step) => step.status === "current")?.action;
  const action = completedCount === steps.length ? completionAction : currentAction;

  return (
    <section
      className={cn(
        "rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-7",
        className,
      )}
      {...props}
    >
      <h2 className="max-w-32 text-2xl font-semibold leading-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)] md:text-base">{description}</p>
      <Progress className="mt-5 max-w-xs" label="Project setup progress" value={progress} />

      <ol className="mt-6 grid gap-3">
        {steps.map((step, index) => {
          const presentation = statusPresentation[step.status];
          return (
            <li
              className="flex min-h-20 flex-col justify-between gap-3 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] px-4 py-3 sm:flex-row sm:items-center"
              key={step.id}
            >
              <div className="min-w-0">
                <div className="font-medium">{index + 1}. {step.title}</div>
                <div className="mt-1 text-sm text-[var(--air-color-text-secondary)]">{step.description}</div>
              </div>
              <Badge className="shrink-0" showIcon={false} tone={presentation.tone}>
                {presentation.label}
              </Badge>
            </li>
          );
        })}
      </ol>

      {action ? (
        <div className="mt-6 flex justify-end">
          <Button asChild size="small">
            <a href={action.href}>{action.label}</a>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
