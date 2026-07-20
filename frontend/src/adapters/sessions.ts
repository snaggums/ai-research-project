import type { Session, SessionPayload } from "@/api/types";
import type { SessionFormValues } from "@/components/research/session-form";
import type { SessionSummary } from "@/domain/types";
import { toParticipantSummary } from "./participants";

export function toSessionSummary(session: Session): SessionSummary {
  return {
    id: session.id,
    projectId: session.project_id,
    title: session.title,
    type: session.type,
    startsAt: session.starts_at ?? undefined,
    durationMinutes: session.duration_minutes ?? undefined,
    participants: session.participants.map(toParticipantSummary),
    documentCount: session.document_count,
    transcriptStatus: session.transcript_status,
    hasPrimaryTranscript: session.has_primary_transcript,
    themeStatus: session.theme_status,
    reportStatus: session.report_status,
    relatedRecords: session.related_records,
    relatedCommonComponents: session.related_common_components,
    updatedAt: session.updated_at,
  };
}

export function toSessionFormValues(session: Session): SessionFormValues {
  const startsAt = session.starts_at ? new Date(session.starts_at) : undefined;
  return {
    title: session.title,
    type: session.type,
    date: startsAt ? startsAt.toISOString().slice(0, 10) : "",
    time: startsAt ? startsAt.toISOString().slice(11, 16) : "",
    description: session.description ?? "",
    recordId: session.related_records[0]?.id ?? "",
    participantIds: session.participant_ids,
  };
}

export function toSessionPayload(values: SessionFormValues): SessionPayload {
  const startsAt = values.date
    ? `${values.date}T${values.time || "00:00"}:00.000Z`
    : null;
  return {
    title: values.title,
    type: values.type,
    starts_at: startsAt,
    description: values.description || null,
    participant_ids: values.participantIds,
    related_record_ids: values.recordId ? [values.recordId] : [],
  };
}
