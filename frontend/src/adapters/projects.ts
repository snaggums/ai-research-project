import type { Project } from "@/api/types";
import type { ProjectSummary } from "@/domain/types";

export function toProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? undefined,
    participantCount: 0,
    sessionCount: 0,
    readyTranscriptCount: 0,
    updatedAt: project.updated_at,
  };
}

