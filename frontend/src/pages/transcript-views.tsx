import * as React from "react";
import { ArrowLeft, Download, Search, Upload } from "lucide-react";

import { EmptyState, PageHeader, SharedRouteState } from "@/components/application";
import { TranscriptContextPassage } from "@/components/research/transcript-context-passage";
import { TranscriptDocumentItem } from "@/components/research/transcript-document-item";
import { TranscriptPreview } from "@/components/research/transcript-preview";
import { TranscriptSearchResult } from "@/components/research/transcript-search-result";
import { TranscriptUploader } from "@/components/research/transcript-uploader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import type { TranscriptContext, TranscriptDocumentDetail, TranscriptSearchResult as TranscriptSearchResultValue } from "@/domain/types";
import { formatTranscriptDate, formatTranscriptSize, transcriptFormat } from "@/components/research/transcript-presentation";

export interface SessionTranscriptWorkspaceViewProps {
  actionError?: string;
  deletePendingId?: string;
  documents: TranscriptDocumentDetail[];
  errorMessage?: string;
  onDelete: (documentId: string) => void;
  onOpenContext?: (href: string) => void;
  onRetry: (documentId: string) => void;
  onRetryLoad?: () => void;
  onSearch: (documentId: string, query: string) => void;
  onSetPrimary: (documentId: string) => void;
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
}

export function SessionTranscriptWorkspaceView({ actionError, deletePendingId, documents, errorMessage, onDelete, onOpenContext, onRetry, onRetryLoad, onSearch, onSetPrimary, onUpload, projectId, retryingId, searchError, searchQuery = "", searchResults, searching = false, sessionId, state = "ready", uploadError, uploading = false }: SessionTranscriptWorkspaceViewProps) {
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [showUploader, setShowUploader] = React.useState(false);
  const [viewingId, setViewingId] = React.useState<string>();
  const [query, setQuery] = React.useState(searchQuery);
  const primary = documents.find((document) => document.isPrimary && document.status === "complete") ?? documents.find((document) => document.status === "complete");
  const viewing = documents.find((document) => document.id === viewingId);
  const contextHref = (result: TranscriptSearchResultValue) => `/projects/${projectId}/sessions/${sessionId}/documents/${result.documentId}?result=${result.id}`;
  const submitUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      setSelectedFile(undefined);
      setShowUploader(false);
    } catch {
      // The mutation exposes the request error through uploadError so the
      // uploader can retain the selected file and offer a retry action.
    }
  };
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <div className="grid gap-3"><Alert message={errorMessage ?? "Check your connection and try again."} size="large" title="Transcripts could not be loaded" tone="error" />{onRetryLoad ? <Button className="justify-self-start" onClick={onRetryLoad} size="small">Retry</Button> : null}</div>;
  if (viewing) return <div className="grid gap-4"><Button className="justify-self-start" onClick={() => setViewingId(undefined)} size="small" variant="text"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to transcripts</Button><TranscriptPreview actions={<><Button asChild size="small" variant="gray-subtle"><a href={viewing.sourceUrl ?? "#open-source"}>Open source</a></Button><Button asChild size="small" variant="gray-subtle"><a download href={viewing.downloadUrl ?? "#download-source"}>Download source</a></Button></>} document={viewing} /></div>;
  const uploaderState = uploadError ? "request-error" : uploading ? "uploading" : selectedFile ? "file-selected" : "empty";
  if (!documents.length || showUploader) return <div className="grid gap-4"><div className="flex justify-center"><TranscriptUploader file={selectedFile} onChooseDifferentFile={() => setSelectedFile(undefined)} onFilesSelected={(files) => setSelectedFile(files[0])} onRemove={() => setSelectedFile(undefined)} onRetryUpload={() => void submitUpload()} onUpload={() => void submitUpload()} progress={50} requestError={uploadError} state={uploaderState} /></div>{documents.length ? <Button className="justify-self-center" onClick={() => setShowUploader(false)} size="small" variant="text">Cancel</Button> : null}</div>;
  return <section aria-labelledby="transcripts-heading" className="grid gap-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold" id="transcripts-heading">Transcripts</h2><Button onClick={() => { setSelectedFile(undefined); setShowUploader(true); }} size="small" variant="gray-subtle"><Upload aria-hidden="true" className="h-4 w-4" />Upload transcript</Button></header>
    {actionError ? <Alert message={actionError} size="large" title="Transcript action could not be completed" tone="error" /> : null}
    <div className="grid gap-4">{documents.map((document) => <TranscriptDocumentItem document={document} href="#view-transcript" isPrimary={document.isPrimary} key={document.id} onDelete={deletePendingId === document.id ? undefined : () => onDelete(document.id)} onRetry={() => onRetry(document.id)} onSetPrimary={() => onSetPrimary(document.id)} retrying={retryingId === document.id} viewLabel="View transcript" onClickCapture={(event) => { const anchor = (event.target as HTMLElement).closest("a[href='#view-transcript']"); if (anchor) { event.preventDefault(); setViewingId(document.id); } }} />)}</div>
    {primary ? <form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => { event.preventDefault(); if (query.trim()) onSearch(primary.id, query); }}><SearchField hint="Find relevant source excerpts by speaker, phrase, or topic." label="Search this transcript" onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search this transcript" value={query} /><Button className="sm:mt-7" disabled={!query.trim() || searching} size="large" type="submit"><Search aria-hidden="true" className="h-4 w-4" />{searching ? "Searching…" : "Search transcript"}</Button></form> : null}
    {searchError ? <Alert message={searchError} size="large" title="Transcript search failed" tone="error" /> : null}
    {searchResults ? <div className="grid gap-2"><p className="text-sm font-medium">{searchResults.length} relevant {searchResults.length === 1 ? "excerpt" : "excerpts"}</p>{searchResults.length ? searchResults.map((result) => { const href = contextHref(result); return <TranscriptSearchResult href={href} key={result.id} onOpen={onOpenContext ? (event) => { event.preventDefault(); onOpenContext(href); } : undefined} result={result} />; }) : <EmptyState description="Try another speaker, phrase, or topic." title="No relevant excerpts" />}</div> : null}
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
