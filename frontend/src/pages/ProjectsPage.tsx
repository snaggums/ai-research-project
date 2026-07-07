import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  Eye,
  FileSearch,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import type { AISettingsPayload, Project, ProjectPayload, ResearchDocument, Theme, ThemeEvidence, ThemeEvidencePayload, ThemePayload } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteDocument,
  useDocument,
  useDocuments,
  useRetryDocument,
  useUploadDocument,
} from "@/hooks/useDocuments";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useProjectSearch } from "@/hooks/useSearch";
import { useAISettings, useTestAISettings, useUpdateAISettings } from "@/hooks/useSettings";
import {
  useDeleteEvidence,
  useDeleteTheme,
  useGenerateThemes,
  useThemes,
  useUpdateEvidence,
  useUpdateTheme,
} from "@/hooks/useThemes";

const emptyForm: ProjectPayload = { name: "", description: "" };
const providers = ["openai", "anthropic", "gemini", "openrouter", "azure_openai", "ollama", "mock"];
const embeddingProviders = ["mock", "openai", "ollama"];

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

function SearchPanel({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("");
  const searchProject = useProjectSearch(projectId);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    searchProject.mutate({ query: cleanQuery });
  }

  return (
    <div className="grid gap-4 border-t border-border pt-5">
      <div className="grid gap-1">
        <h3 className="font-semibold text-card-foreground">Search extracted text</h3>
        <p className="text-sm text-muted-foreground">Find relevant transcript chunks using local mock embeddings.</p>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearch}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="navigation confusion, onboarding, settings..."
        />
        <Button type="submit" disabled={searchProject.isPending || !query.trim()}>
          {searchProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </form>
      {searchProject.isError ? (
        <p className="text-sm text-destructive">Search failed. Confirm documents are processed and the backend is running.</p>
      ) : null}
      {searchProject.data?.results.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          No matching chunks found.
        </div>
      ) : null}
      <div className="grid gap-3">
        {searchProject.data?.results.map((result) => (
          <article key={result.chunk_id} className="rounded-md border border-border bg-background px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <FileSearch className="h-4 w-4 text-primary" />
              <span>{result.document_name}</span>
              <span>Chunk {result.chunk_index + 1}</span>
              <span>Score {result.score.toFixed(2)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{result.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ThemesPanel({ projectId }: { projectId: string }) {
  const themes = useThemes(projectId);
  const generateThemes = useGenerateThemes(projectId);
  const updateTheme = useUpdateTheme(projectId);
  const deleteTheme = useDeleteTheme(projectId);
  const updateEvidence = useUpdateEvidence(projectId);
  const deleteEvidence = useDeleteEvidence(projectId);

  return (
    <div className="grid gap-4 border-t border-border pt-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="grid gap-1">
          <h3 className="font-semibold text-card-foreground">Evidence-backed themes</h3>
          <p className="text-sm text-muted-foreground">Generate and review themes grounded in extracted chunks.</p>
        </div>
        <Button type="button" size="sm" disabled={generateThemes.isPending} onClick={() => generateThemes.mutate()}>
          {generateThemes.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate themes
        </Button>
      </div>

      {generateThemes.data ? (
        <p className="text-sm text-muted-foreground">
          {generateThemes.data.message} {generateThemes.data.used_mock ? "Switch provider settings to OpenAI for live generation." : null}
        </p>
      ) : null}
      {generateThemes.isError ? (
        <p className="text-sm text-destructive">
          Theme generation failed. Confirm documents are processed and AI settings are configured.
        </p>
      ) : null}
      {themes.isLoading ? <p className="text-sm text-muted-foreground">Loading themes...</p> : null}
      {themes.isError ? <p className="text-sm text-destructive">Could not load themes for this project.</p> : null}
      {themes.data?.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          No themes generated yet.
        </div>
      ) : null}

      <div className="grid gap-3">
        {themes.data?.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isUpdating={updateTheme.isPending}
            isDeleting={deleteTheme.isPending}
            isUpdatingEvidence={updateEvidence.isPending}
            isDeletingEvidence={deleteEvidence.isPending}
            onUpdate={(payload) => updateTheme.mutate({ themeId: theme.id, payload })}
            onDelete={() => deleteTheme.mutate(theme.id)}
            onUpdateEvidence={(evidenceId, payload) => updateEvidence.mutate({ evidenceId, payload })}
            onDeleteEvidence={(evidenceId) => deleteEvidence.mutate(evidenceId)}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isUpdating,
  isDeleting,
  isUpdatingEvidence,
  isDeletingEvidence,
  onUpdate,
  onDelete,
  onUpdateEvidence,
  onDeleteEvidence,
}: {
  theme: Theme;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingEvidence: boolean;
  isDeletingEvidence: boolean;
  onUpdate: (payload: ThemePayload) => void;
  onDelete: () => void;
  onUpdateEvidence: (evidenceId: string, payload: ThemeEvidencePayload) => void;
  onDeleteEvidence: (evidenceId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ThemePayload>({
    title: theme.title,
    description: theme.description,
    confidence: theme.confidence,
    user_notes: theme.user_notes ?? "",
  });

  useEffect(() => {
    setForm({
      title: theme.title,
      description: theme.description,
      confidence: theme.confidence,
      user_notes: theme.user_notes ?? "",
    });
  }, [theme]);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    onUpdate({
      title: form.title.trim(),
      description: form.description.trim(),
      confidence: form.confidence,
      user_notes: form.user_notes?.trim() || null,
    });
    setIsEditing(false);
  }

  return (
    <article className="rounded-md border border-border bg-background px-4 py-3">
      {isEditing ? (
        <form className="grid gap-3" onSubmit={handleSave}>
          <Input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Theme title"
          />
          <Textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Theme description"
          />
          <Textarea
            value={form.user_notes ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, user_notes: event.target.value }))}
            placeholder="Researcher notes"
          />
          <div className="grid gap-2 sm:w-56">
            <label className="text-sm font-medium text-foreground">Confidence</label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={form.confidence}
              onChange={(event) =>
                setForm((current) => ({ ...current, confidence: Number(event.target.value) }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={isUpdating || !form.title.trim() || !form.description.trim()}>
              Save theme
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-3">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Tags className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">{theme.title}</h4>
                <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {theme.evidence_count} evidence
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{theme.description}</p>
              {theme.user_notes ? <p className="text-sm leading-6 text-foreground">Notes: {theme.user_notes}</p> : null}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Confidence {theme.confidence.toFixed(2)}</span>
                <span>Created by {theme.created_by}</span>
                {theme.model ? <span>Model {theme.model}</span> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {theme.evidence.map((evidence) => (
              <EvidenceCard
                key={evidence.id}
                evidence={evidence}
                isUpdating={isUpdatingEvidence}
                isDeleting={isDeletingEvidence}
                onUpdate={(payload) => onUpdateEvidence(evidence.id, payload)}
                onDelete={() => onDeleteEvidence(evidence.id)}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function EvidenceCard({
  evidence,
  isUpdating,
  isDeleting,
  onUpdate,
  onDelete,
}: {
  evidence: ThemeEvidence;
  isUpdating: boolean;
  isDeleting: boolean;
  onUpdate: (payload: ThemeEvidencePayload) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ThemeEvidencePayload>({
    quote: evidence.quote,
    reasoning: evidence.reasoning,
    relevance_score: evidence.relevance_score,
    evidence_type: evidence.evidence_type,
  });

  useEffect(() => {
    setForm({
      quote: evidence.quote,
      reasoning: evidence.reasoning,
      relevance_score: evidence.relevance_score,
      evidence_type: evidence.evidence_type,
    });
  }, [evidence]);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.quote?.trim() || !form.reasoning?.trim()) return;
    onUpdate({
      quote: form.quote.trim(),
      reasoning: form.reasoning.trim(),
      relevance_score: form.relevance_score,
      evidence_type: form.evidence_type?.trim() || "supporting",
    });
    setIsEditing(false);
  }

  return (
    <div className="rounded-md border border-border px-3 py-3">
      {isEditing ? (
        <form className="grid gap-2" onSubmit={handleSave}>
          <Textarea
            value={form.quote ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))}
            placeholder="Evidence quote"
          />
          <Textarea
            value={form.reasoning ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, reasoning: event.target.value }))}
            placeholder="Why this evidence supports the theme"
          />
          <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={form.relevance_score ?? 0}
              onChange={(event) =>
                setForm((current) => ({ ...current, relevance_score: Number(event.target.value) }))
              }
            />
            <Input
              value={form.evidence_type ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, evidence_type: event.target.value }))}
              placeholder="supporting"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={isUpdating || !form.quote?.trim() || !form.reasoning?.trim()}>
              Save evidence
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <FileSearch className="h-4 w-4 text-primary" />
            <span>{evidence.document_name ?? "Document"}</span>
            <span>{evidence.evidence_type}</span>
            <span>Relevance {evidence.relevance_score.toFixed(2)}</span>
          </div>
          <blockquote className="border-l-2 border-primary pl-3 text-sm leading-6 text-foreground">
            {evidence.quote}
          </blockquote>
          <p className="text-sm leading-6 text-muted-foreground">{evidence.reasoning}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit evidence
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Remove evidence
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AISettingsPanel() {
  const settings = useAISettings();
  const updateSettings = useUpdateAISettings();
  const testSettings = useTestAISettings();
  const [form, setForm] = useState<AISettingsPayload>({
    provider: "openai",
    model: "gpt-4.1-mini",
    base_url: "",
    embedding_provider: "mock",
    embedding_model: "mock-hash-64",
  });

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      provider: settings.data.provider,
      model: settings.data.model,
      base_url: settings.data.base_url ?? "",
      embedding_provider: settings.data.embedding_provider,
      embedding_model: settings.data.embedding_model,
    });
  }, [settings.data]);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettings.mutate({
      provider: form.provider,
      model: form.model,
      base_url: form.base_url?.trim() || null,
      embedding_provider: form.embedding_provider,
      embedding_model: form.embedding_model,
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">AI provider settings</h2>
            <p className="text-sm text-muted-foreground">Store provider metadata; keep real keys in backend/.env.</p>
          </div>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">Sprint 4</span>
      </div>

      {settings.isLoading ? <p className="text-sm text-muted-foreground">Loading settings...</p> : null}
      {settings.isError ? <p className="text-sm text-destructive">Could not load AI settings.</p> : null}

      <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSave}>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="provider">
            Provider
          </label>
          <Select
            id="provider"
            value={form.provider}
            onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
          >
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="model">
            Model
          </label>
          <Input
            id="model"
            value={form.model}
            onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
            placeholder="gpt-4.1-mini"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="base-url">
            Base URL
          </label>
          <Input
            id="base-url"
            value={form.base_url ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, base_url: event.target.value }))}
            placeholder="Optional for OpenRouter, Azure, Ollama, or gateways"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="embedding-provider">
            Embedding provider
          </label>
          <Select
            id="embedding-provider"
            value={form.embedding_provider}
            onChange={(event) => setForm((current) => ({ ...current, embedding_provider: event.target.value }))}
          >
            {embeddingProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="embedding-model">
            Embedding model
          </label>
          <Input
            id="embedding-model"
            value={form.embedding_model}
            onChange={(event) => setForm((current) => ({ ...current, embedding_model: event.target.value }))}
            placeholder="mock-hash-64"
          />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            Key env var: {settings.data?.api_key_env_var ?? "none required"} ·{" "}
            {settings.data?.has_api_key ? "present" : "not detected"}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={updateSettings.isPending || !form.provider || !form.model}>
              Save settings
            </Button>
            <Button type="button" variant="outline" disabled={testSettings.isPending} onClick={() => testSettings.mutate()}>
              {testSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Test config
            </Button>
          </div>
        </div>
      </form>

      {updateSettings.isSuccess ? <p className="mt-3 text-sm text-muted-foreground">Settings saved.</p> : null}
      {updateSettings.isError ? <p className="mt-3 text-sm text-destructive">Could not save settings.</p> : null}
      {testSettings.data ? (
        <p className={`mt-3 text-sm ${testSettings.data.ok ? "text-muted-foreground" : "text-destructive"}`}>
          {testSettings.data.message}
        </p>
      ) : null}
    </section>
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
          <DocumentPanel projectId={project.id} />
          <SearchPanel projectId={project.id} />
          <ThemesPanel projectId={project.id} />
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
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Sprint 5</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">AI-Assisted UX Research Repository</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Create projects, upload transcripts, search extracted chunks, and generate evidence-backed themes.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            Project CRUD + documents + search + themes
          </div>
        </header>

        <AISettingsPanel />

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
                No projects yet. Create one to begin the research workflow.
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
