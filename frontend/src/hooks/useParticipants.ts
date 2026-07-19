import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createParticipant,
  deleteParticipant,
  getParticipant,
  listParticipants,
  updateParticipant,
} from "@/api/participants";
import type { Participant, ParticipantPayload, Session } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";

function participantCollectionKey(projectId: string) {
  return ["projects", projectId, "participants"] as const;
}

function sessionCollectionKey(projectId: string) {
  return ["projects", projectId, "sessions"] as const;
}

function replaceParticipantInSession(session: Session, participant: Participant): Session {
  if (!session.participant_ids.includes(participant.id)) return session;
  return {
    ...session,
    participants: session.participants.map((value) => value.id === participant.id ? participant : value),
  };
}

function replaceParticipantInSessionCache(value: unknown, participant: Participant): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => item && typeof item === "object" && "participant_ids" in item
      ? replaceParticipantInSession(item as Session, participant)
      : item);
  }
  if (value && typeof value === "object" && "participant_ids" in value) {
    return replaceParticipantInSession(value as Session, participant);
  }
  return value;
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
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
      queryClient.setQueriesData<Participant[]>({ queryKey: participantCollectionKey(projectId) }, (current) =>
        Array.isArray(current)
          ? current.map((value) => value.id === participant.id ? participant : value)
          : current,
      );
      queryClient.setQueriesData(
        { queryKey: sessionCollectionKey(projectId) },
        (current) => replaceParticipantInSessionCache(current, participant),
      );
      // The PATCH response is authoritative, and the affected caches have already
      // been updated above. Mark related queries stale without blocking navigation
      // on follow-up network requests. Otherwise a successful first click can look
      // unresponsive while inactive Session queries are being refetched.
      void queryClient.invalidateQueries({
        queryKey: participantCollectionKey(projectId),
        refetchType: "none",
      });
      void queryClient.invalidateQueries({
        queryKey: sessionCollectionKey(projectId),
        refetchType: "none",
      });
    },
  });
}

export function useDeleteParticipant(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => deleteParticipant(projectId, participantId),
    onSuccess: (_value, participantId) => {
      queryClient.removeQueries({ queryKey: queryKeys.participant(projectId, participantId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      return queryClient.invalidateQueries({ queryKey: participantCollectionKey(projectId) });
    },
  });
}
