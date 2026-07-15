import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createParticipant,
  deleteParticipant,
  getParticipant,
  listParticipants,
  updateParticipant,
} from "@/api/participants";
import type { ParticipantPayload } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";

function participantCollectionKey(projectId: string) {
  return ["projects", projectId, "participants"] as const;
}

export function useParticipants(projectId: string, search = "") {
  return useQuery({
    queryKey: queryKeys.participants(projectId, search),
    queryFn: () => listParticipants(projectId, search),
    enabled: Boolean(projectId),
  });
}

export function useParticipant(projectId: string, participantId: string) {
  return useQuery({
    queryKey: queryKeys.participant(projectId, participantId),
    queryFn: () => getParticipant(projectId, participantId),
    enabled: Boolean(projectId && participantId),
  });
}

export function useCreateParticipant(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ParticipantPayload) => createParticipant(projectId, payload),
    onSuccess: (participant) => {
      queryClient.setQueryData(queryKeys.participant(projectId, participant.id), participant);
      return queryClient.invalidateQueries({ queryKey: participantCollectionKey(projectId) });
    },
  });
}

export function useUpdateParticipant(projectId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ParticipantPayload) => updateParticipant(projectId, participantId, payload),
    onSuccess: (participant) => {
      queryClient.setQueryData(queryKeys.participant(projectId, participantId), participant);
      return queryClient.invalidateQueries({ queryKey: participantCollectionKey(projectId) });
    },
  });
}

export function useDeleteParticipant(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => deleteParticipant(projectId, participantId),
    onSuccess: (_value, participantId) => {
      queryClient.removeQueries({ queryKey: queryKeys.participant(projectId, participantId) });
      return queryClient.invalidateQueries({ queryKey: participantCollectionKey(projectId) });
    },
  });
}
