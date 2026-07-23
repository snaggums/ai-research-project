import * as React from "react";
import { useSearchParams } from "react-router-dom";

import {
  toTranscriptCode,
  toTranscriptCodeSuggestion,
  toTranscriptHighlight,
  toTranscriptReaderBlocks,
} from "@/adapters/transcript-coding";
import type { CreateTranscriptHighlightPayload } from "@/api/types";
import type { TranscriptHighlightValue, TranscriptTextSelectionValue } from "@/components/research";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  useAcceptTranscriptCodeSuggestion,
  useCreateRecordCode,
  useCreateTranscriptHighlight,
  useDeleteTranscriptHighlight,
  useGenerateTranscriptCodeSuggestions,
  useRejectTranscriptCodeSuggestion,
  useRemoveTranscriptHighlightCode,
  useSyncTranscriptHighlightCodes,
  useTranscriptCodingWorkspace,
  useUpdateRecordCode,
  useUpdateTranscriptCodeSuggestion,
} from "@/hooks/useTranscriptCoding";
import {
  TranscriptCodingWorkspaceView,
  type TranscriptCodingRouteState,
  type TranscriptCodingWorkspaceState,
} from "@/pages/transcript-coding-views";
import { SharedRouteState } from "@/components/application";

export interface TranscriptCodingRouteContentProps {
  enabled: boolean;
  projectId: string;
  sessionId: string;
}

function mutationMessage(errors: Array<Error | null>) {
  return errors.find(Boolean)?.message;
}

export function TranscriptCodingRouteContent({ enabled, projectId, sessionId }: TranscriptCodingRouteContentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const coding = useTranscriptCodingWorkspace(projectId, sessionId, enabled);
  const workspace = coding.data;
  const createHighlight = useCreateTranscriptHighlight(projectId, sessionId);
  const syncCodes = useSyncTranscriptHighlightCodes(projectId, sessionId);
  const removeCode = useRemoveTranscriptHighlightCode(projectId, sessionId);
  const deleteHighlight = useDeleteTranscriptHighlight(projectId, sessionId);
  const createCode = useCreateRecordCode(projectId, sessionId, workspace?.record?.id);
  const updateCode = useUpdateRecordCode(projectId, sessionId, workspace?.record?.id);
  const updateSuggestion = useUpdateTranscriptCodeSuggestion(projectId, sessionId);
  const acceptSuggestion = useAcceptTranscriptCodeSuggestion(projectId, sessionId);
  const rejectSuggestion = useRejectTranscriptCodeSuggestion(projectId, sessionId);
  const generateSuggestions = useGenerateTranscriptCodeSuggestions(projectId, sessionId);
  const currentMutationError = mutationMessage([
    createHighlight.error,
    syncCodes.error,
    removeCode.error,
    deleteHighlight.error,
    createCode.error,
    updateCode.error,
    updateSuggestion.error,
    acceptSuggestion.error,
    rejectSuggestion.error,
    generateSuggestions.error,
  ]);

  const codes = React.useMemo(
    () => workspace?.codes.filter((code) => code.status === "active").map(toTranscriptCode) ?? [],
    [workspace?.codes],
  );
  const highlights = React.useMemo(
    () => workspace?.highlights.filter((highlight) => !highlight.deleted_at).map(toTranscriptHighlight) ?? [],
    [workspace?.highlights],
  );
  const suggestions = React.useMemo(
    () => workspace?.suggestions
      .filter((suggestion) => suggestion.status === "awaiting-review")
      .map(toTranscriptCodeSuggestion) ?? [],
    [workspace?.suggestions],
  );
  const visibleCodes = currentMutationError ? codes.map((code) => ({ ...code })) : codes;
  const visibleHighlights = currentMutationError
    ? highlights.map((highlight) => ({
      ...highlight,
      codes: highlight.codes.map((code) => ({ ...code })),
      evidence: { ...highlight.evidence },
    }))
    : highlights;
  const visibleSuggestions = currentMutationError
    ? suggestions.map((suggestion) => ({
      ...suggestion,
      evidence: suggestion.evidence.map((evidence) => ({ ...evidence })),
    }))
    : suggestions;
  const blocks = React.useMemo(() => workspace ? toTranscriptReaderBlocks(workspace) : [], [workspace]);
  const routeState = React.useMemo<TranscriptCodingRouteState>(() => ({
    view: searchParams.get("view") === "list" ? "list" : "transcript",
    panel: searchParams.get("panel") === "accepted" ? "accepted" : "suggestions",
    highlightStatus: searchParams.get("highlight_status") === "uncoded"
      ? "uncoded"
      : searchParams.get("highlight_status") === "all"
        ? "all"
        : "accepted-coded",
    codeIds: searchParams.getAll("code"),
  }), [searchParams]);
  const updateRouteState = React.useCallback((nextState: Partial<TranscriptCodingRouteState>) => {
    const next = new URLSearchParams(searchParams);
    if (nextState.view) next.set("view", nextState.view);
    if (nextState.panel) next.set("panel", nextState.panel);
    if (nextState.highlightStatus) next.set("highlight_status", nextState.highlightStatus);
    if (nextState.codeIds) {
      next.delete("code");
      for (const codeId of nextState.codeIds) next.append("code", codeId);
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  if (!enabled) return null;
  if (coding.isPending) {
    return <section aria-label="Transcript coding"><SharedRouteState state="loading" /></section>;
  }
  if (coding.isError || !workspace) {
    return (
      <section className="grid gap-3" aria-label="Transcript coding error">
        <Alert
          message={coding.error?.message ?? "Check your connection and try again. Existing Highlights and Codes have not been changed."}
          size="large"
          title="Transcript coding could not be loaded"
          tone="error"
        />
        <Button className="justify-self-start" onClick={() => void coding.refetch()} size="small">Retry</Button>
      </section>
    );
  }

  const generationStatus = workspace.suggestion_run.status;
  const state: TranscriptCodingWorkspaceState = generateSuggestions.isPending
    || generationStatus === "queued"
    || generationStatus === "processing"
    ? "processing"
    : generationStatus === "failed"
      ? "error"
      : suggestions.length === 0 && highlights.length === 0
        ? "no-suggestions"
        : suggestions.length === 0
          ? "accepted-highlights"
          : "review-suggestions";
  function createHighlightPayload(
    highlight: TranscriptHighlightValue,
    selection: TranscriptTextSelectionValue,
  ): CreateTranscriptHighlightPayload | undefined {
    const block = workspace?.transcript.blocks.find((candidate) => candidate.id === selection.blockId);
    if (!workspace || !block) return undefined;
    return {
      anchor: {
        chunk_id: block.chunk_id,
        block_id: selection.blockId,
        start_char: block.start_char + selection.startOffset,
        end_char: block.start_char + selection.endOffset,
        excerpt_snapshot: selection.text,
        speaker: selection.speaker ?? null,
        location: selection.location,
        content_checksum: workspace.transcript.content_checksum,
      },
      code_ids: highlight.codes.map((code) => code.id),
      new_code: null,
    };
  }

  return (
    <div className="grid gap-4">
      {!workspace.record ? (
        <Alert
          message="You can save uncoded Highlights now. Assign this Session to a Record before creating or applying Codes."
          size="large"
          title="A Record is required for Codes"
          tone="warning"
        />
      ) : null}
      {currentMutationError ? (
        <Alert
          message={`${currentMutationError} Refresh the workspace before retrying if the visible state does not match the saved result.`}
          size="large"
          title="Transcript coding changes could not be saved"
          tone="error"
        />
      ) : null}
      <TranscriptCodingWorkspaceView
        acceptedHighlights={visibleHighlights}
        availableCodes={visibleCodes}
        blocks={blocks}
        onAcceptSuggestion={(suggestionId) => acceptSuggestion.mutate(suggestionId)}
        onApplyCodes={({ codeIds, highlightId, selection }) => {
          // New selections are persisted atomically by onCreateHighlight with
          // their selected Code IDs. Existing Highlights use assignment diffs.
          if (selection) return;
          const previousCodeIds = workspace.highlights
            .find((highlight) => highlight.id === highlightId)
            ?.codes.map((code) => code.id) ?? [];
          syncCodes.mutate({ highlightId, nextCodeIds: codeIds, previousCodeIds });
        }}
        onCreateCode={async (code) => toTranscriptCode(await createCode.mutateAsync({
          name: code.name,
          description: code.description ?? null,
        }))}
        onCreateHighlight={(highlight, selection) => {
          const payload = createHighlightPayload(highlight, selection);
          if (payload) createHighlight.mutate(payload);
        }}
        onDeleteHighlight={(highlightId) => {
          if (window.confirm("Delete this Highlight? Its source Transcript and Record Codes will not be deleted.")) {
            deleteHighlight.mutate(highlightId);
          }
        }}
        onEditCode={(codeId, value) => {
          if (value) updateCode.mutate({ codeId, payload: { name: value.name, description: value.description } });
        }}
        onEditSuggestion={(suggestionId, value) => {
          if (value) updateSuggestion.mutate({
            suggestionId,
            payload: { proposed_name: value.codeName, proposed_description: value.description },
          });
        }}
        onRegenerate={() => generateSuggestions.mutate()}
        onRejectSuggestion={(suggestionId) => rejectSuggestion.mutate(suggestionId)}
        onRemoveAcceptedCode={(codeId, highlightIds) => {
          for (const highlightId of highlightIds) removeCode.mutate({ highlightId, codeId });
        }}
        onRemoveCode={(highlightId, codeId) => removeCode.mutate({ highlightId, codeId })}
        onRouteStateChange={updateRouteState}
        routeState={routeState}
        state={state}
        suggestions={visibleSuggestions}
      />
    </div>
  );
}
