import type { LifecycleStatus, ProductReference, SessionSummary, SessionType } from "@/domain/types";

export const sessionTypeLabels: Record<SessionType, string> = {
  interview: "Interview",
  "usability-test": "Usability test",
  "focus-group": "Focus group",
  "working-session": "Working session",
  "design-critique": "Design critique",
  other: "Other",
};

export function participantName(participant: SessionSummary["participants"][number]) {
  return `${participant.firstName} ${participant.lastName}`.trim();
}

export function participantInitials(participant: SessionSummary["participants"][number]) {
  return `${participant.firstName.at(0) ?? ""}${participant.lastName.at(0) ?? ""}`.toUpperCase();
}

export function formatSessionDate(value?: string, includeTime = true) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatDuration(minutes?: number) {
  if (minutes === undefined) return "Not recorded";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function referenceNames(references: ProductReference[]) {
  return references.length ? references.map((reference) => reference.name).join(", ") : "None";
}

export function workflowStatusLabel(status: "not-generated" | "generating" | LifecycleStatus | "failed") {
  const labels = {
    "not-generated": "Not generated",
    generating: "Generating",
    "ai-generated": "AI generated",
    "researcher-reviewed": "Researcher reviewed",
    approved: "Approved",
    superseded: "Superseded",
    failed: "Failed",
  } as const;
  return labels[status];
}
