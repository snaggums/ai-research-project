import type { MultiSelectOption } from "@/components/ui/multi-select-field";
import type { ParticipantOption } from "@/components/research/participant-picker";
import type { ParticipantSummary } from "@/domain/types";
import type { Participant } from "@/api/types";

export const recordOptions: MultiSelectOption[] = [
  { label: "Medicare Fraud Documenter", value: "record-1" },
  { label: "Medicaid Fraud Documenter", value: "record-2" },
  { label: "Medicare Fraud Finder", value: "record-3" },
];

export const jordanMoore: ParticipantSummary = {
  id: "jordan-moore",
  projectId: "alpha-project",
  firstName: "Jordan",
  lastName: "Moore",
  email: "jordan.moore@example.com",
  organization: "Midwest",
  persona: "Frequent mobile shopper",
  referenceId: "P-014",
  role: "Supervisor",
  recordIds: ["record-1", "record-2"],
  sessionCount: 3,
  researcherNotes: "Prefers one-handed mobile checkout and avoids account creation.",
};

export const participantOptions: ParticipantOption[] = [
  { id: "jordan-moore", firstName: "Jordan", lastName: "Moore", referenceId: "P-014" },
  { id: "avery-chen", firstName: "Avery", lastName: "Chen", referenceId: "P-022" },
  { id: "priya-shah", firstName: "Priya", lastName: "Shah", referenceId: "P-031" },
];

export const participantApiFixtures: Participant[] = [
  {
    id: "alex-morgan",
    project_id: "alpha-project",
    first_name: "Alex",
    last_name: "Morgan",
    email: "alex.morgan@example.com",
    organization: "Midwest",
    role: "Supervisor",
    record_ids: ["record-1", "record-2"],
    researcher_notes: "Prefers one-handed mobile checkout and avoids account creation.",
    session_count: 4,
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-12T15:30:00Z",
  },
  {
    id: "samir-kaur",
    project_id: "alpha-project",
    first_name: "Samir",
    last_name: "Kaur",
    email: "samir.kaur@example.com",
    organization: "Midwest",
    role: "Contractor",
    record_ids: ["record-1"],
    researcher_notes: null,
    session_count: 3,
    created_at: "2026-07-02T12:00:00Z",
    updated_at: "2026-07-11T10:15:00Z",
  },
  {
    id: "jordan-lee",
    project_id: "alpha-project",
    first_name: "Jordan",
    last_name: "Lee",
    email: "jordan.lee@example.com",
    organization: "Northeast",
    role: "Contractor",
    record_ids: ["record-2"],
    researcher_notes: null,
    session_count: 2,
    created_at: "2026-07-03T12:00:00Z",
    updated_at: "2026-07-10T09:45:00Z",
  },
  {
    id: "riley-chen",
    project_id: "alpha-project",
    first_name: "Riley",
    last_name: "Chen",
    email: "riley.chen@example.com",
    organization: "Southwest",
    role: "Contractor",
    record_ids: [],
    researcher_notes: null,
    session_count: 4,
    created_at: "2026-07-04T12:00:00Z",
    updated_at: "2026-07-09T14:20:00Z",
  },
];

export const participantSummaries = participantApiFixtures.map((participant): ParticipantSummary => ({
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
}));
