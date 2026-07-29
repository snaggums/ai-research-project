import * as React from "react";
import { ArrowLeft, Download } from "lucide-react";

import { EmptyState, PageHeader, SharedRouteState } from "@/components/application";
import {
  SessionTranscriptLifecycleWorkspace,
  type TranscriptReplacementPresentation,
} from "@/components/research/session-transcript-lifecycle-workspace";
import { TranscriptContextPassage } from "@/components/research/transcript-context-passage";
import type { TranscriptDependencySummary } from "@/components/research/transcript-lifecycle-dialog";
import { TranscriptPreview } from "@/components/research/transcript-preview";
import { TranscriptSearchResult } from "@/components/research/transcript-search-result";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { TranscriptContext, TranscriptDocumentDetail, TranscriptSearchResult as TranscriptSearchResultValue } from "@/domain/types";
import { formatTranscriptDate, formatTranscriptSize, transcriptFormat } from "@/components/research/transcript-presentation";

export interface SessionTranscriptWorkspaceViewProps {
  actionError?: string;
  deletePendingId?: string;
  dependencies?: TranscriptDependencySummary;
  dependenciesPending?: boolean;
  documents: TranscriptDocumentDetail[];
  errorMessage?: string;
  onDelete: (documentId: string) => void;
  onClearSearch?: () => void;
  onOpenContext?: (href: string) => void;
  onRetry: (documentId: string) => void;
  onRetryLoad?: () => void;
  onReplace?: (file: File) => Promise<void> | void;
  onSearch: (documentId: string, query: string) => void;
  onUpload: (file: File) => Promise<void> | void;
  projectId: string;
  retryingId?: string;
  searchError?: string;
  searchQuery?: string;
  searchResults?: TranscriptSearchResultValue[];
  searching?: boolean;
  sessionId: string;
  state?: "ready" | "loading" | "error";
  uploadError?: string;
  uploading?: boolean;
  replacementError?: string;
  replacing?: boolean;
}

export function SessionTranscriptWorkspaceView({ actionError, deletePendingId, dependencies, dependenciesPending = false, documents, errorMessage, onClearSearch, onDelete, onOpenContext, onReplace, onRetry, onRetryLoad, onSearch, onUpload, projectId, replacementError, replacing = false, retryingId, searchError, searchQuery = "", searchResults, sessionId, state = "ready", uploadError, uploading = false }: SessionTranscriptWorkspaceViewProps) {
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [replacementFile, setReplacementFile] = React.useState<File>();
  const [viewingId, setViewingId] = React.useState<string>();
  const replacementInputRef = React.useRef<HTMLInputElement>(null);
  const replaceTranscript = onReplace ?? onUpload;
  const activeDocument = documents.find((document) => document.isPrimary);
  const replacementDocument = documents.find((document) =>
    document.lifecycleStatus === "replacement-pending" || document.lifecycleStatus === "replacement-failed",
  );
  const legacyDocuments = documents.filter((document) => document.lifecycleStatus === "legacy");
  const removedDocuments = documents.filter((document) => document.lifecycleStatus === "tombstoned");
  const viewing = documents.find((document) => document.id === viewingId);
  const contextHref = (result: TranscriptSearchResultValue) => `/projects/${projectId}/sessions/${sessionId}/documents/${result.documentId}?result=${result.id}`;
  const submitInitialUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      setSelectedFile(undefined);
    } catch {
      // The mutation exposes the request error through uploadError so the
      // uploader can retain the selected file and offer a retry action.
    }
  };
  const submitReplacement = async () => {
    if (!replacementFile) return;
    try {
      await replaceTranscript(replacementFile);
      setReplacementFile(undefined);
    } catch {
      // Recoverable request errors preserve the selected replacement.
    }
  };
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <div className="grid gap-3"><Alert message={errorMessage ?? "Check your connection and try again."} size="large" title="Transcripts could not be loaded" tone="error" />{onRetryLoad ? <Button className="justify-self-start" onClick={onRetryLoad} size="small">Retry</Button> : null}</div>;
  if (viewing) return <div className="grid gap-4"><Button className="justify-self-start" onClick={() => setViewingId(undefined)} size="small" variant="text"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to transcripts</Button><TranscriptPreview actions={<><Button asChild size="small" variant="gray-subtle"><a href={viewing.sourceUrl ?? "#open-source"}>Open source</a></Button><Button asChild size="small" variant="gray-subtle"><a download href={viewing.downloadUrl ?? "#download-source"}>Download source</a></Button></>} document={viewing} /></div>;
  const uploaderState = uploadError ? "request-error" : uploading ? "uploading" : selectedFile ? "file-selected" : "empty";
  if (!activeDocument) return (
    <SessionTranscriptLifecycleWorkspace
      initialFile={selectedFile}
      initialProgress={50}
      initialUploadError={uploadError}
      initialUploaderState={uploaderState}
      legacyDocuments={legacyDocuments}
      onChooseDifferentInitial={() => setSelectedFile(undefined)}
      onInitialFilesSelected={(files) => setSelectedFile(files[0])}
      onInitialRemove={() => setSelectedFile(undefined)}
      onInitialRetry={() => void submitInitialUpload()}
      onInitialUpload={() => void submitInitialUpload()}
      onViewTranscript={setViewingId}
      removedDocuments={removedDocuments}
    />
  );
  const replacement: TranscriptReplacementPresentation | undefined = replacementFile
    ? {
        error: replacementError,
        file: replacementFile,
        progress: 50,
        state: replacementError ? "replacement-request-error" : replacing ? "replacement-uploading" : "replacement-selected",
      }
    : replacementDocument
      ? {
          error: replacementDocument.errorMessage,
          file: {
            name: replacementDocument.filename,
            size: replacementDocument.sizeBytes ?? 0,
            type: replacementDocument.mimeType ?? "",
          },
          progress: 75,
          state: replacementDocument.lifecycleStatus === "replacement-failed"
            ? "replacement-processing-error"
            : "replacement-processing",
        }
      : undefined;
  return <section className="grid gap-4">
    <input accept=".txt,.md,.docx,.pdf" aria-label="Choose replacement transcript" className="sr-only" onChange={(event) => { setReplacementFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} ref={replacementInputRef} type="file" />
    <SessionTranscriptLifecycleWorkspace
      actionError={actionError}
      activeDocument={activeDocument}
      dependencies={dependencies}
      legacyDocuments={legacyDocuments}
      lifecyclePending={Boolean(deletePendingId) || uploading || replacing || dependenciesPending}
      onChooseDifferentReplacement={() => replacementInputRef.current?.click()}
      onConfirmDelete={() => onDelete(activeDocument.id)}
      onConfirmReplacement={() => void submitReplacement()}
      onRemoveReplacement={() => setReplacementFile(undefined)}
      onRequestReplacement={() => replacementInputRef.current?.click()}
      onRetryActive={() => onRetry(activeDocument.id)}
      onRetryReplacement={() => void submitReplacement()}
      onRetryReplacementProcessing={replacementDocument ? () => onRetry(replacementDocument.id) : undefined}
      onClearSearch={onClearSearch}
      onSearch={(query) => onSearch(activeDocument.id, query)}
      onViewTranscript={setViewingId}
      replacement={replacement}
      removedDocuments={removedDocuments}
      retryingActive={retryingId === activeDocument.id}
      searchQuery={searchQuery}
    />
    {searchError ? <Alert message={searchError} size="large" title="Transcript search failed" tone="error" /> : null}
    {searchResults ? <div className="grid gap-2"><p className="text-sm font-medium">{searchResults.length} matching {searchResults.length === 1 ? "excerpt" : "excerpts"}</p>{searchResults.length ? searchResults.map((result) => { const href = contextHref(result); return <TranscriptSearchResult href={href} key={result.id} onOpen={onOpenContext ? (event) => { event.preventDefault(); onOpenContext(href); } : undefined} result={result} />; }) : <EmptyState description="Try another speaker or exact phrase." title="No matching excerpts" />}</div> : null}
  </section>;
}

export interface TranscriptContextViewProps {
  context?: TranscriptContext;
  onRetry?: () => void;
  onReturn?: () => void;
  projectId: string;
  projectName: string;
  returnHref: string;
  returnLabel?: string;
  sessionId: string;
  sessionTitle: string;
  state?: "ready" | "loading" | "unavailable" | "error";
}

export function TranscriptContextView({ context, onRetry, onReturn, projectId, projectName, returnHref, returnLabel = "Transcripts", sessionId, sessionTitle, state = "ready" }: TranscriptContextViewProps) {
  const description = state === "unavailable" ? "The requested source passage is no longer available." : "Review the cited source passage and its surrounding transcript.";
  const sessionHref = `/projects/${projectId}/sessions/${sessionId}/overview`;
  const header = <><Button asChild className="justify-self-start" size="small" variant="text"><a href={returnHref} onClick={onReturn ? (event) => { event.preventDefault(); onReturn(); } : undefined}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to {returnLabel}</a></Button><PageHeader breadcrumbs={[{ href: "/projects", label: "Projects" }, { href: `/projects/${projectId}/overview`, label: projectName }, { href: `/projects/${projectId}/sessions`, label: "Sessions" }, { href: sessionHref, label: sessionTitle }, { label: "Transcript context" }]} description={description} title="Transcript context" /></>;
  if (state === "loading") return <div className="grid gap-6">{header}<SharedRouteState state="loading" /></div>;
  if (state === "error") return <div className="grid gap-6">{header}<div className="grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"><Alert message="The source is still available, but this passage could not be loaded. Retry or return to the Session." size="large" title="Transcript context could not be loaded" tone="error" /><div className="flex gap-2">{onRetry ? <Button onClick={onRetry} size="small">Retry</Button> : null}<Button asChild size="small" variant="gray-subtle"><a href={returnHref}>Return to session</a></Button></div></div></div>;
  if (state === "unavailable" || !context) return <div className="grid gap-6">{header}<div className="grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"><Alert message="The source may still be processing or may have been removed. Return to the Session and choose another result." size="large" title="Transcript context is unavailable" tone="warning" /><Button asChild className="justify-self-start" size="small" variant="gray-subtle"><a href={returnHref}>Return to session</a></Button></div></div>;
  const document = context.document;
  const metadata = `${document.isPrimary ? "Primary transcript · " : ""}${transcriptFormat(document.mimeType, document.filename)} · ${formatTranscriptSize(document.sizeBytes)}${document.processedAt ? ` · ${formatTranscriptDate(document.processedAt, "Extracted")}` : ""}`;
  return <div className="grid gap-6">{header}<article className="grid gap-5 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:p-6"><header className="flex flex-wrap items-start gap-4"><div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-semibold">{document.filename}</h2><p className="text-sm text-[var(--air-color-text-secondary)]">{metadata}</p></div><div className="flex flex-wrap gap-2"><Button asChild size="small" variant="gray-subtle"><a href={document.sourceUrl ?? "#open-source"}>Open source</a></Button><Button asChild size="small" variant="gray-subtle"><a download href={document.downloadUrl ?? "#download-source"}><Download aria-hidden="true" className="h-4 w-4" />Download source</a></Button></div></header><TranscriptContextPassage context={context} /></article></div>;
}
