import * as React from "react";
import { Search } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import type { TranscriptDocumentSummary } from "@/domain/types";
import { TranscriptDocumentItem } from "./transcript-document-item";
import {
  TranscriptLifecycleDialog,
  type TranscriptDependencySummary,
  type TranscriptLifecycleAction,
} from "./transcript-lifecycle-dialog";
import { TranscriptUploader, type TranscriptFileSummary, type TranscriptUploaderState } from "./transcript-uploader";

export type TranscriptReplacementPresentation = {
  error?: string;
  file: TranscriptFileSummary;
  progress?: number;
  state:
    | "replacement-selected"
    | "replacement-uploading"
    | "replacement-processing"
    | "replacement-request-error"
    | "replacement-processing-error";
};

export interface SessionTranscriptLifecycleWorkspaceProps {
  actionError?: string;
  activeDocument?: TranscriptDocumentSummary;
  dependencies?: TranscriptDependencySummary;
  initialFile?: File;
  initialProgress?: number;
  initialUploadError?: string;
  initialUploaderState?: Extract<TranscriptUploaderState, "empty" | "file-selected" | "uploading" | "processing" | "rejected" | "request-error">;
  legacyDocuments?: TranscriptDocumentSummary[];
  removedDocuments?: TranscriptDocumentSummary[];
  lifecyclePending?: boolean;
  onCancelReplacementUpload?: () => void;
  onChooseDifferentReplacement?: () => void;
  onConfirmDelete?: () => void;
  onConfirmReplacement?: () => void;
  onChooseDifferentInitial?: () => void;
  onInitialFilesSelected?: (files: File[]) => void;
  onInitialRemove?: () => void;
  onInitialRetry?: () => void;
  onInitialUpload?: () => void;
  onRemoveReplacement?: () => void;
  onRequestReplacement?: () => void;
  onRetryActive?: () => void;
  onRetryReplacement?: () => void;
  onRetryReplacementProcessing?: () => void;
  onClearSearch?: () => void;
  onSearch?: (query: string) => void;
  onViewTranscript?: (documentId: string) => void;
  replacement?: TranscriptReplacementPresentation;
  retryingActive?: boolean;
  searchQuery?: string;
}

export function SessionTranscriptLifecycleWorkspace({
  actionError,
  activeDocument,
  dependencies,
  initialFile,
  initialProgress,
  initialUploadError,
  initialUploaderState = "empty",
  legacyDocuments = [],
  removedDocuments = [],
  lifecyclePending = false,
  onCancelReplacementUpload,
  onChooseDifferentReplacement,
  onConfirmDelete,
  onConfirmReplacement,
  onChooseDifferentInitial,
  onInitialFilesSelected,
  onInitialRemove,
  onInitialRetry,
  onInitialUpload,
  onRemoveReplacement,
  onRequestReplacement,
  onRetryActive,
  onRetryReplacement,
  onRetryReplacementProcessing,
  onClearSearch,
  onSearch,
  onViewTranscript,
  replacement,
  retryingActive = false,
  searchQuery = "",
}: SessionTranscriptLifecycleWorkspaceProps) {
  const [confirmAction, setConfirmAction] = React.useState<TranscriptLifecycleAction>();
  const [query, setQuery] = React.useState(searchQuery);
  const replacementBusy = replacement
    ? ["replacement-uploading", "replacement-processing"].includes(replacement.state)
    : false;
  const hasTranscriptHistory = removedDocuments.length > 0 || legacyDocuments.length > 0;

  React.useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const transcriptHistory = hasTranscriptHistory ? (
    <section aria-labelledby="transcript-history-heading" className="grid gap-3">
      <div className="grid gap-1">
        <h3 className="text-lg font-semibold" id="transcript-history-heading">Transcript history</h3>
        <p className="text-sm text-[var(--air-color-text-secondary)]">
          Retained for research traceability. These Transcripts and their evidence do not contribute to current Session or Record results.
        </p>
      </div>
      {removedDocuments.map((document) => (
        <TranscriptDocumentItem
          document={document}
          href="#view-removed-transcript"
          key={document.id}
          lifecycle="removed"
          onView={onViewTranscript ? (event) => {
            event.preventDefault();
            onViewTranscript(document.id);
          } : undefined}
          viewLabel="View transcript"
        />
      ))}
      {legacyDocuments.map((document) => (
        <TranscriptDocumentItem
          document={document}
          href="#view-legacy-transcript"
          key={document.id}
          lifecycle="legacy"
          onView={onViewTranscript ? (event) => {
            event.preventDefault();
            onViewTranscript(document.id);
          } : undefined}
          viewLabel="View transcript"
        />
      ))}
    </section>
  ) : null;

  if (!activeDocument) {
    return (
      <section aria-label="Session Transcript lifecycle" className="grid gap-8">
        <div className="flex justify-center">
          <TranscriptUploader
            file={initialFile}
            onChooseDifferentFile={onChooseDifferentInitial}
            onFilesSelected={onInitialFilesSelected}
            onRemove={onInitialRemove}
            onRetryUpload={onInitialRetry}
            onUpload={onInitialUpload}
            progress={initialProgress}
            requestError={initialUploadError}
            state={initialUploaderState}
          />
        </div>
        {transcriptHistory}
      </section>
    );
  }

  return (
    <section aria-labelledby="session-transcript-heading" className="grid gap-4">
      <h2 className="text-xl font-semibold" id="session-transcript-heading">Transcript</h2>
      {actionError ? (
        <Alert
          message={actionError}
          size="large"
          title="Transcript action could not be completed"
          tone="error"
        />
      ) : null}

      <TranscriptDocumentItem
        document={activeDocument}
        href="#view-transcript"
        lifecycle="active"
        onDelete={replacementBusy || lifecyclePending ? undefined : () => setConfirmAction("delete")}
        onReplace={replacementBusy || lifecyclePending ? undefined : onRequestReplacement}
        onRetry={lifecyclePending ? undefined : onRetryActive}
        onView={onViewTranscript ? (event) => {
          event.preventDefault();
          onViewTranscript(activeDocument.id);
        } : undefined}
        retrying={retryingActive}
        viewLabel="View transcript"
      />

      {replacement ? (
        <TranscriptUploader
          file={replacement.file}
          onCancelUpload={onCancelReplacementUpload}
          onChooseDifferentFile={onChooseDifferentReplacement}
          onRemove={onRemoveReplacement}
          onReplace={() => setConfirmAction("replace")}
          onRetryProcessing={onRetryReplacementProcessing}
          onRetryUpload={onRetryReplacement}
          progress={replacement.progress}
          requestError={replacement.error}
          state={replacement.state}
        />
      ) : null}

      {transcriptHistory}

      {!replacement && activeDocument.status === "complete" ? (
        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) onSearch?.(query.trim());
          }}
        >
          <SearchField
            hint="Find exact source excerpts by speaker or phrase."
            label="Search this transcript"
            onChange={(event) => {
              const nextQuery = event.currentTarget.value;
              setQuery(nextQuery);
              if (!nextQuery) onClearSearch?.();
            }}
            placeholder="Search this transcript"
            value={query}
          />
          <Button className="sm:mt-7" disabled={!query.trim()} size="large" type="submit">
            <Search aria-hidden="true" className="h-4 w-4" />
            Search transcript
          </Button>
        </form>
      ) : null}

      <TranscriptLifecycleDialog
        action="delete"
        dependencies={dependencies}
        filename={activeDocument.filename}
        onConfirm={onConfirmDelete}
        onOpenChange={(open) => setConfirmAction(open ? "delete" : undefined)}
        open={confirmAction === "delete"}
      />
      {replacement ? (
        <TranscriptLifecycleDialog
          action="replace"
          dependencies={dependencies}
          filename={activeDocument.filename}
          onConfirm={onConfirmReplacement}
          onOpenChange={(open) => setConfirmAction(open ? "replace" : undefined)}
          open={confirmAction === "replace"}
        />
      ) : null}
    </section>
  );
}
