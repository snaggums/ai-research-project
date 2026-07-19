import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  generateRecordSynthesis,
  getLatestRecordSynthesis,
  getRecord,
  getRecordSynthesisEligibility,
  getRecordSynthesisEvidence,
  listRecords,
  listRecordSessions,
  updateRecordSynthesisItem,
} from "@/api/records";
import type { RecordSynthesisItem } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useRecords() {
  return useQuery({ queryKey: queryKeys.records(), queryFn: listRecords });
}

export function useRecord(recordId: string) {
  return useQuery({ queryKey: queryKeys.record(recordId), queryFn: () => getRecord(recordId), enabled: Boolean(recordId) });
}

export function useRecordSessions(recordId: string) {
  return useQuery({ queryKey: queryKeys.recordSessions(recordId), queryFn: () => listRecordSessions(recordId), enabled: Boolean(recordId) });
}

export function useRecordSynthesisEligibility(recordId: string) {
  return useQuery({ queryKey: queryKeys.recordSynthesisEligibility(recordId), queryFn: () => getRecordSynthesisEligibility(recordId), enabled: Boolean(recordId) });
}

export function useLatestRecordSynthesis(recordId: string) {
  return useQuery({ queryKey: queryKeys.recordSynthesis(recordId), queryFn: () => getLatestRecordSynthesis(recordId), enabled: Boolean(recordId) });
}

export function useGenerateRecordSynthesis(recordId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => generateRecordSynthesis(recordId),
    onSuccess: (synthesis) => {
      client.setQueryData(queryKeys.recordSynthesis(recordId), synthesis);
      return client.invalidateQueries({ queryKey: queryKeys.record(recordId) });
    },
  });
}

export function useUpdateRecordSynthesisItem(recordId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: RecordSynthesisItem["status"] }) => updateRecordSynthesisItem(recordId, itemId, status),
    onSuccess: (updated) => client.setQueryData(queryKeys.recordSynthesis(recordId), (current: unknown) => {
      if (!current || typeof current !== "object" || !("items" in current) || !Array.isArray(current.items)) return current;
      return { ...current, items: current.items.map((item) => typeof item === "object" && item && "id" in item && item.id === updated.id ? updated : item) };
    }),
  });
}

export function useRecordSynthesisEvidence(recordId: string, itemId: string, evidenceId: string) {
  return useQuery({
    queryKey: queryKeys.recordSynthesisEvidence(recordId, itemId, evidenceId),
    queryFn: () => getRecordSynthesisEvidence(recordId, itemId, evidenceId),
    enabled: Boolean(recordId && itemId && evidenceId),
  });
}
