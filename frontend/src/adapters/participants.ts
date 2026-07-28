import type { Participant, ParticipantPayload } from "@/api/types";
import type { ParticipantFormValues } from "@/components/research/participant-form";
import type { ParticipantSummary } from "@/domain/types";

const participantNameCollator = new Intl.Collator("en", {
  sensitivity: "base",
});

export function compareParticipantsByLastName(
  left: Pick<ParticipantSummary, "firstName" | "id" | "lastName">,
  right: Pick<ParticipantSummary, "firstName" | "id" | "lastName">,
) {
  return participantNameCollator.compare(left.lastName, right.lastName)
    || participantNameCollator.compare(left.firstName, right.firstName)
    || participantNameCollator.compare(left.id, right.id);
}

export function toParticipantSummary(participant: Participant): ParticipantSummary {
  return {
    id: participant.id,
    projectId: participant.project_id,
    firstName: participant.first_name,
    lastName: participant.last_name,
    email: participant.email ?? undefined,
    organization: participant.organization ?? undefined,
    role: participant.role ?? undefined,
    recordIds: participant.record_ids,
    sessionCount: participant.session_count,
    researcherNotes: participant.researcher_notes ?? undefined,
  };
}

export function toParticipantFormValues(participant: Participant): ParticipantFormValues {
  return {
    firstName: participant.first_name,
    lastName: participant.last_name,
    email: participant.email ?? "",
    organization: participant.organization ?? "",
    role: participant.role ?? "",
    recordIds: participant.record_ids,
    researcherNotes: participant.researcher_notes ?? "",
  };
}

export function toParticipantPayload(values: ParticipantFormValues): ParticipantPayload {
  return {
    first_name: values.firstName,
    last_name: values.lastName,
    email: values.email || null,
    organization: values.organization || null,
    role: values.role || null,
    record_ids: values.recordIds,
    researcher_notes: values.researcherNotes || null,
  };
}
