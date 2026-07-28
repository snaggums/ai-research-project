import type { Session } from "@/api/types";
import { participantApiFixtures } from "./participants";

const records = [
  { id: "record-1", name: "Medicare Fraud Documenter" },
  { id: "record-2", name: "Medicaid Fraud Documenter" },
  { id: "record-3", name: "Medicare Fraud Finder" },
];
const commonComponents = [
  { id: "component-payment", name: "Payment form" },
  { id: "component-summary", name: "Order summary" },
  { id: "component-navigation", name: "Navigation" },
];

export const sessionApiFixtures: Session[] = [
  {
    id: "mobile-checkout-test", project_id: "alpha-project", title: "Mobile checkout usability test", type: "usability-test",
    starts_at: "2026-07-10T14:00:00.000Z", duration_minutes: 45, description: "Observe mobile checkout completion and recovery behavior.",
    participants: participantApiFixtures.slice(0, 4), participant_ids: participantApiFixtures.slice(0, 4).map(({ id }) => id),
    document_count: 1, transcript_names: ["mobile-checkout-session.txt"], transcript_status: "complete", has_primary_transcript: true,
    theme_status: "ai-generated", report_status: "ai-generated", related_records: [records[0]], related_common_components: commonComponents.slice(0, 2),
    created_at: "2026-07-01T12:00:00Z", updated_at: "2026-07-12T16:30:00Z",
  },
  {
    id: "checkout-interview", project_id: "alpha-project", title: "Checkout workflow interview", type: "interview",
    starts_at: "2026-07-08T14:00:00.000Z", duration_minutes: 45, description: "Understand checkout expectations and decision points.",
    participants: participantApiFixtures.slice(0, 1), participant_ids: [participantApiFixtures[0].id],
    document_count: 1, transcript_names: ["checkout-workflow-interview.txt"], transcript_status: "complete", has_primary_transcript: true,
    theme_status: "researcher-reviewed", report_status: "approved", related_records: [records[0]], related_common_components: [commonComponents[0]],
    created_at: "2026-07-01T12:00:00Z", updated_at: "2026-07-12T16:30:00Z",
  },
  {
    id: "navigation-focus-group", project_id: "alpha-project", title: "Navigation terminology focus group", type: "focus-group",
    starts_at: "2026-07-11T17:30:00.000Z", duration_minutes: 75, description: "Compare navigation labels and information scent.",
    participants: participantApiFixtures.slice(1, 3), participant_ids: participantApiFixtures.slice(1, 3).map(({ id }) => id),
    document_count: 0, transcript_names: [], transcript_status: "none", has_primary_transcript: false,
    theme_status: "not-generated", report_status: "not-generated", related_records: [records[1]], related_common_components: [commonComponents[2]],
    created_at: "2026-07-02T12:00:00Z", updated_at: "2026-07-11T19:00:00Z",
  },
  {
    id: "checkout-working-session", project_id: "alpha-project", title: "Checkout synthesis working session", type: "working-session",
    starts_at: "2026-07-12T15:00:00.000Z", duration_minutes: 60, description: "Synthesize findings and identify follow-up work.",
    participants: participantApiFixtures.slice(0, 2), participant_ids: participantApiFixtures.slice(0, 2).map(({ id }) => id),
    document_count: 1, transcript_names: ["synthesis-working-session.txt"], transcript_status: "failed", has_primary_transcript: false,
    theme_status: "generating", report_status: "not-generated", related_records: [records[1]], related_common_components: commonComponents,
    created_at: "2026-07-03T12:00:00Z", updated_at: "2026-07-14T09:15:00Z",
  },
];

export const sessionRecordOptions = records.map(({ id: value, name: label }) => ({ value, label }));
export const sessionCommonComponentOptions = commonComponents.map(({ id: value, name: label }) => ({ value, label }));
