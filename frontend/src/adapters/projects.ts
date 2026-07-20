import type { Project } from "@/api/types";
import type { ProjectSummary } from "@/domain/types";

export function toProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? undefined,
    participantCount: project.participant_count ?? 0,
    sessionCount: project.session_count ?? 0,
    readyTranscriptCount: project.ready_transcript_count ?? 0,
    updatedAt: project.updated_at,
  };
}
