import type { BadgeProps } from "@/components/ui/badge";
import type {
  LifecycleStatus,
  RecordReadiness,
  RecordSynthesisItemType,
} from "@/domain/types";

export const recordReadinessLabels: Record<RecordReadiness, string> = {
  ready: "Ready to synthesize",
  "needs-data": "Needs more data",
  "up-to-date": "Up to date",
};

export const recordSynthesisItemLabels: Record<RecordSynthesisItemType, string> = {
  requirement: "Requirement",
  decision: "Decision",
  "action-item": "Action Item",
};

export const lifecycleStatusLabels: Record<LifecycleStatus, string> = {
  "ai-generated": "AI Generated",
  "researcher-reviewed": "Researcher Reviewed",
  approved: "Approved",
  superseded: "Superseded",
};

export function recordReadinessTone(readiness: RecordReadiness): NonNullable<BadgeProps["tone"]> {
  if (readiness === "up-to-date") return "success";
  if (readiness === "needs-data") return "warning";
  return "brand";
}

export function recordItemTypeTone(type: RecordSynthesisItemType): NonNullable<BadgeProps["tone"]> {
  if (type === "decision") return "success";
  if (type === "action-item") return "warning";
  return "brand";
}

export function lifecycleStatusTone(status: LifecycleStatus): NonNullable<BadgeProps["tone"]> {
  if (status === "approved") return "success";
  if (status === "researcher-reviewed") return "warning";
  if (status === "superseded") return "neutral";
  return "brand";
}

export function formatRecordSynthesisDate(value?: string, includeTime = true) {
  if (!value) return "Not yet synthesized";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}
