import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createSession, deleteSession, getSession, listSessions, updateSession } from "@/api/sessions";
import type { SessionFilters, SessionPayload } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";

const collectionKey = (projectId: string) => ["projects", projectId, "sessions"] as const;

export function useSessions(projectId: string, filters: SessionFilters = {}) {
  return useQuery({ queryKey: [...collectionKey(projectId), filters], queryFn: () => listSessions(projectId, filters), enabled: Boolean(projectId) });
}

export function useSession(projectId: string, sessionId: string) {
  return useQuery({ queryKey: queryKeys.session(projectId, sessionId), queryFn: () => getSession(projectId, sessionId), enabled: Boolean(projectId && sessionId) });
}

export function useCreateSession(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (payload: SessionPayload) => createSession(projectId, payload), onSuccess: (session) => { client.setQueryData(queryKeys.session(projectId, session.id), session); return client.invalidateQueries({ queryKey: collectionKey(projectId) }); } });
}

export function useUpdateSession(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (payload: SessionPayload) => updateSession(projectId, sessionId, payload), onSuccess: (session) => { client.setQueryData(queryKeys.session(projectId, sessionId), session); return client.invalidateQueries({ queryKey: collectionKey(projectId) }); } });
}

export function useDeleteSession(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (sessionId: string) => deleteSession(projectId, sessionId), onSuccess: (_data, sessionId) => { client.removeQueries({ queryKey: queryKeys.session(projectId, sessionId) }); return client.invalidateQueries({ queryKey: collectionKey(projectId) }); } });
}
