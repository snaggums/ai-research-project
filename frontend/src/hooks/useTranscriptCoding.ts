import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import {
  acceptTranscriptCodeSuggestion,
  createRecordCode,
  createTranscriptHighlight,
  deleteTranscriptHighlight,
  generateTranscriptCodeSuggestions,
  getTranscriptCodingWorkspace,
  rejectTranscriptCodeSuggestion,
  removeTranscriptHighlightCode,
  updateTranscriptHighlight,
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

function useRetryableRequestKey() {
  const requestKey = useRef<string | undefined>(undefined);
  const operationToken = useRef<string | undefined>(undefined);
  return {
    current: (token: string) => {
      if (operationToken.current !== token) {
        operationToken.current = token;
        requestKey.current = undefined;
      }
      requestKey.current ??= crypto.randomUUID();
      return requestKey.current;
    },
    reset: () => {
      requestKey.current = undefined;
      operationToken.current = undefined;
    },
  };
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
  const requestKey = useRetryableRequestKey();
  return useMutation({
    mutationFn: (payload: CreateTranscriptHighlightPayload) =>
      createTranscriptHighlight(
        projectId,
        sessionId,
        payload,
        requestKey.current(
          `${payload.anchor.start_char}:${payload.anchor.end_char}:${payload.anchor.content_checksum}`,
        ),
      ),
    onSuccess: requestKey.reset,
    onSettled: invalidate,
  });
}

export function useSyncTranscriptHighlightCodes(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: async ({
      highlightId,
      nextCodeIds,
    }: {
      highlightId: string;
      nextCodeIds: string[];
      previousCodeIds: string[];
    }) => {
      await updateTranscriptHighlight(projectId, sessionId, highlightId, { code_ids: nextCodeIds });
    },
    onSettled: invalidate,
  });
}

export function useRemoveTranscriptHighlightCode(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: ({ highlightId, codeId }: { highlightId: string; codeId: string }) =>
      removeTranscriptHighlightCode(projectId, sessionId, highlightId, codeId),
    onSettled: invalidate,
  });
}

export function useDeleteTranscriptHighlight(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: (highlightId: string) => deleteTranscriptHighlight(projectId, sessionId, highlightId),
    onSettled: invalidate,
  });
}

export function useCreateRecordCode(projectId: string, sessionId: string, recordId?: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: (payload: CreateRecordCodePayload) => {
      if (!recordId) throw new Error("Assign this Session to a Record before creating a Code.");
      return createRecordCode(recordId, payload);
    },
    onSettled: invalidate,
  });
}

export function useUpdateRecordCode(projectId: string, sessionId: string, recordId?: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: ({ codeId, payload }: { codeId: string; payload: UpdateRecordCodePayload }) => {
      if (!recordId) throw new Error("Assign this Session to a Record before editing a Code.");
      return updateRecordCode(recordId, codeId, payload);
    },
    onSettled: invalidate,
  });
}

export function useUpdateTranscriptCodeSuggestion(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  return useMutation({
    mutationFn: ({ suggestionId, payload }: { suggestionId: string; payload: UpdateTranscriptCodeSuggestionPayload }) =>
      updateTranscriptCodeSuggestion(projectId, sessionId, suggestionId, payload),
    onSettled: invalidate,
  });
}

export function useAcceptTranscriptCodeSuggestion(projectId: string, sessionId: string) {
  const client = useQueryClient();
  const requestKey = useRetryableRequestKey();
  return useMutation({
    mutationFn: (suggestionId: string) =>
      acceptTranscriptCodeSuggestion(projectId, sessionId, suggestionId, requestKey.current(suggestionId)),
    onSuccess: (workspace) => {
      requestKey.reset();
      client.setQueryData(queryKeys.transcriptCoding(projectId, sessionId), workspace);
    },
    onError: () => client.invalidateQueries({ queryKey: queryKeys.transcriptCoding(projectId, sessionId) }),
  });
}

export function useRejectTranscriptCodeSuggestion(projectId: string, sessionId: string) {
  const invalidate = useCodingInvalidation(projectId, sessionId);
  const requestKey = useRetryableRequestKey();
  return useMutation({
    mutationFn: (suggestionId: string) =>
      rejectTranscriptCodeSuggestion(projectId, sessionId, suggestionId, requestKey.current(suggestionId)),
    onSuccess: requestKey.reset,
    onSettled: invalidate,
  });
}

export function useGenerateTranscriptCodeSuggestions(projectId: string, sessionId: string) {
  const client = useQueryClient();
  const requestKey = useRetryableRequestKey();
  return useMutation({
    mutationFn: () => generateTranscriptCodeSuggestions(projectId, sessionId, requestKey.current("generate")),
    onSuccess: (workspace) => {
      requestKey.reset();
      client.setQueryData(queryKeys.transcriptCoding(projectId, sessionId), workspace);
    },
    onError: () => client.invalidateQueries({ queryKey: queryKeys.transcriptCoding(projectId, sessionId) }),
  });
}
