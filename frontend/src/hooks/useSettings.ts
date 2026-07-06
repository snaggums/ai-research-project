import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAISettings, testAISettings, updateAISettings } from "@/api/settings";
import type { AISettingsPayload } from "@/api/types";

const aiSettingsKey = ["settings", "ai"];

export function useAISettings() {
  return useQuery({
    queryKey: aiSettingsKey,
    queryFn: getAISettings,
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AISettingsPayload) => updateAISettings(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiSettingsKey }),
  });
}

export function useTestAISettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testAISettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiSettingsKey }),
  });
}
