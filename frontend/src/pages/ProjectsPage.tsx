import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import type { Project, ProjectPayload } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks/useProjects";

const emptyForm: ProjectPayload = { name: "", description: "" };

function ProjectForm({
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  initialValue?: ProjectPayload;
  submitLabel: string;
  onSubmit: (payload: ProjectPayload) => void;
  onCancel?: () => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState<ProjectPayload>(initialValue ?? emptyForm);

  useEffect(() => {
    setForm(initialValue ?? emptyForm);
  }, [initialValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    onSubmit({ name, description: form.description?.trim() || null });
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="project-name">
          Project name
        </label>
        <Input
          id="project-name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Usability study synthesis"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="project-description">
          Description
        </label>
        <Textarea
          id="project-description"
          value={form.description ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Research goal, dataset, or sprint notes"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending || !form.name.trim()}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      {isEditing ? (
        <ProjectForm
          initialValue={{ name: project.name, description: project.description ?? "" }}
          submitLabel="Save changes"
          isPending={updateProject.isPending}
          onCancel={() => setIsEditing(false)}
          onSubmit={(payload) => {
            updateProject.mutate(
              { projectId: project.id, payload },
              { onSuccess: () => setIsEditing(false) },
            );
          }}
        />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-card-foreground">{project.name}</h2>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                Project
              </span>
            </div>
            <p className="min-h-6 text-sm leading-6 text-muted-foreground">
              {project.description || "No description yet."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Updated {new Date(project.updated_at).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleteProject.isPending}
                onClick={() => deleteProject.mutate(project.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function ProjectsPage() {
  const projects = useProjects();
  const createProject = useCreateProject();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 md:px-8">
        <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 md:flex-row md:items-end">
          <div className="grid gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Sprint 1</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">AI-Assisted UX Research Repository</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Create a research project to group transcripts, notes, generated themes, and evidence as the MVP grows.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            Project CRUD only
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-card-foreground">Create project</h2>
                <p className="text-sm text-muted-foreground">Start a focused analysis workspace.</p>
              </div>
            </div>
            <ProjectForm
              submitLabel="Create project"
              isPending={createProject.isPending}
              onSubmit={(payload) => createProject.mutate(payload)}
            />
            {createProject.isError ? (
              <p className="mt-3 text-sm text-destructive">Could not create the project. Check the backend connection.</p>
            ) : null}
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Projects</h2>
              <span className="text-sm text-muted-foreground">{projects.data?.length ?? 0} total</span>
            </div>

            {projects.isLoading ? <p className="text-sm text-muted-foreground">Loading projects...</p> : null}
            {projects.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Could not load projects. Confirm the backend is running at the configured API URL.
              </div>
            ) : null}
            {projects.data?.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No projects yet. Create one to begin the Sprint 1 workflow.
              </div>
            ) : null}
            <div className="grid gap-4">
              {projects.data?.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
