import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteEvidence,
  deleteTheme,
  generateProjectThemes,
  listProjectThemes,
  updateEvidence,
  updateTheme,
} from "@/api/themes";
import type { ThemeEvidencePayload, ThemePayload } from "@/api/types";

const themesKey = (projectId: string) => ["themes", projectId];

export function useThemes(projectId: string) {
  return useQuery({
    queryKey: themesKey(projectId),
    queryFn: () => listProjectThemes(projectId),
  });
}

export function useGenerateThemes(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateProjectThemes(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: themesKey(projectId) }),
  });
}

export function useUpdateTheme(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ themeId, payload }: { themeId: string; payload: ThemePayload }) => updateTheme(themeId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: themesKey(projectId) }),
  });
}

export function useDeleteTheme(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTheme,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: themesKey(projectId) }),
  });
}

export function useDeleteEvidence(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvidence,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: themesKey(projectId) }),
  });
}

export function useUpdateEvidence(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ evidenceId, payload }: { evidenceId: string; payload: ThemeEvidencePayload }) =>
      updateEvidence(evidenceId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: themesKey(projectId) }),
  });
}
