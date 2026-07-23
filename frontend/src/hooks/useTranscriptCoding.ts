import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptTranscriptCodeSuggestion,
  addTranscriptHighlightCodes,
  createRecordCode,
  createTranscriptHighlight,
  deleteTranscriptHighlight,
  generateTranscriptCodeSuggestions,
  getTranscriptCodingWorkspace,
  rejectTranscriptCodeSuggestion,
  removeTranscriptHighlightCode,
  updateRecordCode,
  updateTranscriptCodeSuggestion,
} from "@/api/transcript-coding";
import type {
  CreateRecordCodePayload,
  CreateTranscriptHighlightPayload,
  UpdateRecordCodePayload,
  UpdateTranscriptCodeSuggestionPayload,
} from "@/api/types";
import { queryKeys } from "@/lib/query-keys";

function useCodingInvalidation(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.transcriptCoding(projectId, sessionId) });
}

export function useTranscriptCodingWorkspace(projectId: string, sessionId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.transcriptCoding(projectId, sessionId),
    queryFn: () => getTranscriptCodingWorkspace(projectId, sessionId),
    enabled: Boolean(projectId && sessionId && enabled),
    refetchInterval: (query) => {
      const status = query.state.data?.suggestion_run.status;
      return status === "queued" || status === "processing" ? 1000 : false;
    },
  });
}

export function useCreateTranscriptHighlight(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: (payload: CreateTranscriptHighlightPayload) =>
      createTranscriptHighlight(projectId, sessionId, payload),
    onSuccess: invalidate,
  });
}

export function useSyncTranscriptHighlightCodes(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: async ({
      highlightId,
      nextCodeIds,
      previousCodeIds,
    }: {
      highlightId: string;
      nextCodeIds: string[];
      previousCodeIds: string[];
    }) => {
      const added = nextCodeIds.filter((codeId) => !previousCodeIds.includes(codeId));
      const removed = previousCodeIds.filter((codeId) => !nextCodeIds.includes(codeId));
      if (added.length > 0) {
        await addTranscriptHighlightCodes(projectId, sessionId, highlightId, added);
      }
      await Promise.all(removed.map((codeId) =>
        removeTranscriptHighlightCode(projectId, sessionId, highlightId, codeId),
      ));
    },
    onSuccess: invalidate,
  });
}

export function useRemoveTranscriptHighlightCode(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: ({ highlightId, codeId }: { highlightId: string; codeId: string }) =>
      removeTranscriptHighlightCode(projectId, sessionId, highlightId, codeId),
    onSuccess: invalidate,
  });
}

export function useDeleteTranscriptHighlight(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: (highlightId: string) => deleteTranscriptHighlight(projectId, sessionId, highlightId),
    onSuccess: invalidate,
  });
}

export function useCreateRecordCode(projectId: string, sessionId: string, recordId?: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: (payload: CreateRecordCodePayload) => {
      if (!recordId) throw new Error("Assign this Session to a Record before creating a Code.");
      return createRecordCode(recordId, payload);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateRecordCode(projectId: string, sessionId: string, recordId?: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: ({ codeId, payload }: { codeId: string; payload: UpdateRecordCodePayload }) => {
      if (!recordId) throw new Error("Assign this Session to a Record before editing a Code.");
      return updateRecordCode(recordId, codeId, payload);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateTranscriptCodeSuggestion(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: ({ suggestionId, payload }: { suggestionId: string; payload: UpdateTranscriptCodeSuggestionPayload }) =>
      updateTranscriptCodeSuggestion(projectId, sessionId, suggestionId, payload),
    onSuccess: invalidate,
  });
}

export function useAcceptTranscriptCodeSuggestion(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (suggestionId: string) => acceptTranscriptCodeSuggestion(projectId, sessionId, suggestionId),
    onSuccess: (workspace) => client.setQueryData(queryKeys.transcriptCoding(projectId, sessionId), workspace),
  });
}

export function useRejectTranscriptCodeSuggestion(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: (suggestionId: string) => rejectTranscriptCodeSuggestion(projectId, sessionId, suggestionId),
    onSuccess: invalidate,
  });
}

export function useGenerateTranscriptCodeSuggestions(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => generateTranscriptCodeSuggestions(projectId, sessionId),
    onSuccess: (workspace) => client.setQueryData(queryKeys.transcriptCoding(projectId, sessionId), workspace),
  });
}
