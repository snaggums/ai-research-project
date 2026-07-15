import * as React from "react";
import { Plus } from "lucide-react";

import type { AIProviderSettingsFormProps } from "@/components/research/ai-provider-settings-form";
import { AIProviderSettingsForm } from "@/components/research/ai-provider-settings-form";
import { ProjectCard } from "@/components/research/project-card";
import { ProjectForm, type ProjectFormProps } from "@/components/research/project-form";
import { ProjectSummary } from "@/components/research/project-summary";
import { ProjectWorkflowSummary, type ProjectWorkflowStep } from "@/components/research/project-workflow-summary";
import { EntityCollection, EmptyState, PageHeader, SectionNavigation } from "@/components/application";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/search-field";
import type { ProjectSummary as ProjectSummaryModel } from "@/domain/types";

export interface ProjectsIndexViewProps {
  onDeleteProject?: (project: ProjectSummaryModel) => void;
  onEditProject?: (project: ProjectSummaryModel) => void;
  onRetry?: () => void;
  projects: ProjectSummaryModel[];
  search: string;
  onSearchChange: (value: string) => void;
  state?: "ready" | "loading" | "empty" | "error";
}

export function ProjectsIndexView({
  onDeleteProject,
  onEditProject,
  onRetry,
  projects,
  search,
  onSearchChange,
  state = "ready",
}: ProjectsIndexViewProps) {
  const filtered = projects.filter((project) =>
    `${project.name} ${project.description ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const collectionState = state === "ready" && search && !filtered.length ? "no-results" : state;

  return (
    <div className="grid gap-8">
      <PageHeader
        actions={(
          <Button asChild size="small">
            <a href="/projects/new"><Plus aria-hidden="true" className="h-4 w-4" />Create project</a>
          </Button>
        )}
        description="Organize research projects, participants, sessions, and transcripts in one workspace."
        title="Projects"
      />
      <EntityCollection
        countLabel={state === "loading"
          ? "Loading projects…"
          : `${search ? filtered.length : projects.length} ${(search ? filtered.length : projects.length) === 1 ? "project" : "projects"}`}
        controls={(
          <div className="ml-auto w-full sm:max-w-xs">
            <SearchField
              aria-label="Search projects"
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              placeholder="Search projects"
              value={search}
            />
          </div>
        )}
        state={collectionState}
        stateContent={state === "empty" ? (
          <EmptyState
            description="Create your first project to organize participants, sessions, and transcripts."
            primaryAction={<Button asChild size="small"><a href="/projects/new">Create project</a></Button>}
            title="No projects yet"
          />
        ) : state === "error" ? (
          <div className="mx-auto grid max-w-xl gap-3 py-16">
            <Alert message="Check your connection and try again. Your existing research data has not been changed." size="large" title="Projects could not be loaded" tone="error" />
            {onRetry ? <Button className="mx-auto" onClick={onRetry} size="small">Retry</Button> : null}
          </div>
        ) : undefined}
        title="All projects"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              href={`/projects/${project.id}/overview`}
              key={project.id}
              onDelete={onDeleteProject ? () => onDeleteProject(project) : undefined}
              onEdit={onEditProject ? () => onEditProject(project) : undefined}
              project={project}
            />
          ))}
        </div>
      </EntityCollection>
    </div>
  );
}

export interface ProjectOverviewViewProps {
  project: ProjectSummaryModel;
  steps: ProjectWorkflowStep[];
}

export function ProjectOverviewView({ project, steps }: ProjectOverviewViewProps) {
  const root = `/projects/${project.id}`;
  return (
    <div className="grid gap-6">
      <PageHeader
        actions={<Button asChild size="small" variant="gray-subtle"><a href={`${root}/edit`}>Edit project</a></Button>}
        breadcrumbs={[
          { href: "/projects", label: "Projects" },
          { href: `${root}/overview`, label: project.name },
          { label: "Overview" },
        ]}
        description={project.description}
        title={project.name}
      />
      <SectionNavigation
        activeId="overview"
        items={[
          { id: "overview", label: "Overview", href: `${root}/overview` },
          { id: "participants", label: "Participants", href: `${root}/participants` },
          { id: "sessions", label: "Sessions", href: `${root}/sessions` },
          { id: "ask", label: "Ask this project", href: `${root}/ask` },
        ]}
        label="Project sections"
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)]">
        <ProjectSummary project={project} />
        <ProjectWorkflowSummary
          completionAction={{ href: `${root}/sessions`, label: "View sessions" }}
          steps={steps}
        />
      </div>
    </div>
  );
}

export function ProjectFormDialogView({ mode, ...formProps }: ProjectFormProps) {
  const isCreate = mode === "create";
  return (
    <Dialog
      className="w-[42rem]"
      description={isCreate
        ? "Add the basic details now. Participants and sessions can be added after the project is created."
        : "Update the project details. Participants, sessions, and research artifacts are managed separately."}
      dismissible={false}
      open
      showActions={false}
      size="large"
      title={isCreate ? "Create project" : "Edit project"}
    >
      <ProjectForm className="border-0 p-0" mode={mode} showHeader={false} {...formProps} />
    </Dialog>
  );
}

export interface SettingsViewProps {
  active: "profile" | "ai";
  aiSettingsProps?: AIProviderSettingsFormProps;
}

export function SettingsView({ active, aiSettingsProps }: SettingsViewProps) {
  return (
    <div className="grid gap-8">
      <PageHeader description="Manage your profile and AI provider configuration." title="Settings" />
      <SectionNavigation
        activeId={active}
        items={[
          { id: "profile", label: "User profile", href: "/settings/profile" },
          { id: "ai", label: "AI provider settings", href: "/settings/ai" },
        ]}
        label="Settings sections"
      />
      {active === "profile" ? (
        <section className="min-h-56 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6">
          <h2 className="text-xl font-semibold">User profile</h2>
          <p className="mt-2 text-sm text-[var(--air-color-text-secondary)]">Profile settings are intentionally empty in this scope.</p>
        </section>
      ) : aiSettingsProps ? <AIProviderSettingsForm {...aiSettingsProps} /> : null}
    </div>
  );
}
