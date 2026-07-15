import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteSessionTranscript,
  getSessionTranscript,
  getTranscriptContext,
  listSessionTranscripts,
  retrySessionTranscript,
  searchSessionTranscript,
  setPrimaryTranscript,
  uploadSessionTranscript,
} from "@/api/transcripts";
import { queryKeys } from "@/lib/query-keys";

export function useSessionTranscripts(projectId: string, sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionDocuments(projectId, sessionId),
    queryFn: () => listSessionTranscripts(projectId, sessionId),
    enabled: Boolean(projectId && sessionId),
    refetchInterval: (query) => query.state.data?.some((document) => document.status === "uploaded" || document.status === "processing") ? 1000 : false,
  });
}

export function useSessionTranscript(projectId: string, sessionId: string, documentId: string) {
  return useQuery({ queryKey: queryKeys.sessionDocument(projectId, sessionId, documentId), queryFn: () => getSessionTranscript(projectId, sessionId, documentId), enabled: Boolean(projectId && sessionId && documentId) });
}

export function useUploadTranscript(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (file: File) => uploadSessionTranscript(projectId, sessionId, file), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.sessionDocuments(projectId, sessionId) }) });
}

export function useRetryTranscript(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (documentId: string) => retrySessionTranscript(projectId, sessionId, documentId), onSuccess: (document) => { client.setQueryData(queryKeys.sessionDocument(projectId, sessionId, document.id), document); return client.invalidateQueries({ queryKey: queryKeys.sessionDocuments(projectId, sessionId) }); } });
}

export function useSetPrimaryTranscript(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (documentId: string) => setPrimaryTranscript(projectId, sessionId, documentId), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.sessionDocuments(projectId, sessionId) }) });
}

export function useDeleteTranscript(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (documentId: string) => deleteSessionTranscript(projectId, sessionId, documentId), onSuccess: (_data, documentId) => { client.removeQueries({ queryKey: queryKeys.sessionDocument(projectId, sessionId, documentId) }); return client.invalidateQueries({ queryKey: queryKeys.sessionDocuments(projectId, sessionId) }); } });
}

export function useTranscriptSearch(projectId: string, sessionId: string, documentId: string) {
  return useMutation({ mutationFn: (query: string) => searchSessionTranscript(projectId, sessionId, documentId, query) });
}

export function useTranscriptContext(projectId: string, sessionId: string, documentId: string, resultId: string) {
  return useQuery({ queryKey: queryKeys.transcriptContext(projectId, sessionId, documentId, resultId), queryFn: () => getTranscriptContext(projectId, sessionId, documentId, resultId), enabled: Boolean(projectId && sessionId && documentId && resultId) });
}
