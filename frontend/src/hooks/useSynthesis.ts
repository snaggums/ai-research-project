import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  askSession,
  createSessionReportRevision,
  generateSessionReport,
  generateSessionThemes,
  getSessionConversation,
  getSessionReport,
  listSessionThemes,
  updateSessionReportStatus,
  updateSessionTheme,
} from "@/api/synthesis";
import type { SessionReport, SessionThemePayload } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useSessionThemes(projectId: string, sessionId: string) {
  return useQuery({ queryKey: queryKeys.sessionThemes(projectId, sessionId), queryFn: () => listSessionThemes(projectId, sessionId), enabled: Boolean(projectId && sessionId) });
}

export function useGenerateSessionThemes(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => generateSessionThemes(projectId, sessionId), onSuccess: ({ themes }) => client.setQueryData(queryKeys.sessionThemes(projectId, sessionId), themes) });
}

export function useUpdateSessionTheme(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ themeId, payload }: { themeId: string; payload: SessionThemePayload }) => updateSessionTheme(projectId, sessionId, themeId, payload),
    onSuccess: (updated) => client.setQueryData(queryKeys.sessionThemes(projectId, sessionId), (current: unknown) => Array.isArray(current) ? current.map((theme) => typeof theme === "object" && theme && "id" in theme && theme.id === updated.id ? updated : theme) : [updated]),
  });
}

export function useSessionReport(projectId: string, sessionId: string) {
  return useQuery({ queryKey: queryKeys.sessionReport(projectId, sessionId), queryFn: () => getSessionReport(projectId, sessionId), enabled: Boolean(projectId && sessionId) });
}

export function useGenerateSessionReport(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => generateSessionReport(projectId, sessionId), onSuccess: ({ report }) => client.setQueryData(queryKeys.sessionReport(projectId, sessionId), report) });
}

export function useUpdateSessionReportStatus(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (status: SessionReport["status"]) => updateSessionReportStatus(projectId, sessionId, status), onSuccess: (report) => client.setQueryData(queryKeys.sessionReport(projectId, sessionId), report) });
}

export function useCreateSessionReportRevision(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => createSessionReportRevision(projectId, sessionId), onSuccess: (report) => client.setQueryData(queryKeys.sessionReport(projectId, sessionId), report) });
}

export function useSessionConversation(projectId: string, sessionId: string) {
  return useQuery({ queryKey: queryKeys.sessionConversations(projectId, sessionId), queryFn: () => getSessionConversation(projectId, sessionId), enabled: Boolean(projectId && sessionId) });
}

export function useAskSession(projectId: string, sessionId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (question: string) => askSession(projectId, sessionId, question), onSuccess: ({ conversation }) => client.setQueryData(queryKeys.sessionConversations(projectId, sessionId), conversation) });
}
