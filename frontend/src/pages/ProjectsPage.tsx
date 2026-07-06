import { FormEvent, useEffect, useRef, useState } from "react";
import { Eye, FileText, Loader2, Pencil, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";

import type { Project, ProjectPayload, ResearchDocument } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteDocument,
  useDocument,
  useDocuments,
  useRetryDocument,
  useUploadDocument,
} from "@/hooks/useDocuments";
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

function DocumentPanel({ projectId }: { projectId: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const documents = useDocuments(projectId);
  const selectedDocument = useDocument(selectedDocumentId);
  const uploadDocument = useUploadDocument(projectId);
  const retryDocument = useRetryDocument(projectId);
  const deleteDocument = useDeleteDocument(projectId);

  const currentDocumentStillExists = documents.data?.some((document) => document.id === selectedDocumentId);
  useEffect(() => {
    if (selectedDocumentId && documents.data && !currentDocumentStillExists) {
      setSelectedDocumentId(null);
    }
  }, [currentDocumentStillExists, documents.data, selectedDocumentId]);

  function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    uploadDocument.mutate(file, {
      onSuccess: (document) => {
        setSelectedDocumentId(document.id);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  }

  return (
    <div className="grid gap-4 border-t border-border pt-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="grid gap-1">
          <h3 className="font-semibold text-card-foreground">Documents</h3>
          <p className="text-sm text-muted-foreground">Upload transcripts or research notes for this project.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input ref={fileInputRef} type="file" accept=".txt,.md,.docx,.pdf" className="sm:w-64" />
        <Button type="button" size="sm" disabled={uploadDocument.isPending} onClick={handleUpload}>
          {uploadDocument.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </Button>
        </div>
      </div>

      {uploadDocument.isError ? (
        <p className="text-sm text-destructive">Upload failed. Use .txt, .md, .docx, or .pdf files.</p>
      ) : null}

      {documents.isLoading ? <p className="text-sm text-muted-foreground">Loading documents...</p> : null}
      {documents.isError ? (
        <p className="text-sm text-destructive">Could not load documents for this project.</p>
      ) : null}
      {documents.data?.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          No documents uploaded yet.
        </div>
      ) : null}

      <div className="grid gap-2">
        {documents.data?.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            isSelected={document.id === selectedDocumentId}
            isRetrying={retryDocument.isPending}
            isDeleting={deleteDocument.isPending}
            onPreview={() => setSelectedDocumentId(document.id)}
            onRetry={() => retryDocument.mutate(document.id)}
            onDelete={() => deleteDocument.mutate(document.id)}
          />
        ))}
      </div>

      {selectedDocumentId ? (
        <div className="rounded-md border border-border bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Extracted text preview
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDocumentId(null)}>
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
          <div className="max-h-72 overflow-auto whitespace-pre-wrap px-4 py-3 text-sm leading-6 text-muted-foreground">
            {selectedDocument.isLoading ? "Loading extracted text..." : null}
            {selectedDocument.isError ? "Could not load this document." : null}
            {selectedDocument.data?.status === "uploaded" || selectedDocument.data?.status === "processing"
              ? "Extracting text..."
              : selectedDocument.data?.content || "No extracted text is available yet."}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocumentRow({
  document,
  isSelected,
  isRetrying,
  isDeleting,
  onPreview,
  onRetry,
  onDelete,
}: {
  document: ResearchDocument;
  isSelected: boolean;
  isRetrying: boolean;
  isDeleting: boolean;
  onPreview: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const canPreview = document.status === "complete";

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <p className="break-words text-sm font-medium text-foreground">{document.filename}</p>
          <StatusBadge status={document.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Uploaded {new Date(document.uploaded_at).toLocaleString()}</span>
          {document.processed_at ? <span>Processed {new Date(document.processed_at).toLocaleString()}</span> : null}
        </div>
        {document.error_message ? <p className="mt-2 text-sm text-destructive">{document.error_message}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={isSelected ? "secondary" : "outline"} size="sm" disabled={!canPreview} onClick={onPreview}>
          <Eye className="h-4 w-4" />
          View text
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isRetrying} onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ResearchDocument["status"] }) {
  const statusClassName =
    status === "complete"
      ? "bg-emerald-100 text-emerald-800"
      : status === "failed"
        ? "bg-red-100 text-red-800"
        : status === "processing"
          ? "bg-sky-100 text-sky-800"
          : "bg-secondary text-secondary-foreground";

  return <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusClassName}`}>{status}</span>;
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
          <DocumentPanel projectId={project.id} />
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
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Sprint 2</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">AI-Assisted UX Research Repository</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Create research projects, upload transcript files, and preview extracted text before AI analysis begins.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            Project CRUD + document upload
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
