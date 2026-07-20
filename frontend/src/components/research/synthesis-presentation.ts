import type { BadgeProps } from "@/components/ui/badge";
import type { SessionReportItemType, SessionReportStatus, ThemeStatus } from "@/domain/types";

export const themeStatusLabels: Record<ThemeStatus, string> = {
  "ai-generated": "AI Generated",
  "researcher-reviewed": "Researcher Reviewed",
  approved: "Approved",
  rejected: "Rejected",
};

export const reportStatusLabels: Record<SessionReportStatus, string> = {
  "ai-generated": "AI Generated",
  "researcher-reviewed": "Researcher Reviewed",
  approved: "Approved",
  superseded: "Superseded",
};

export const reportItemLabels: Record<SessionReportItemType, string> = {
  requirement: "Requirement",
  decision: "Decision",
  "action-item": "Action Item",
  "open-question": "Open Question",
  "key-insight": "Key Insight",
};

export function themeStatusTone(status: ThemeStatus): NonNullable<BadgeProps["tone"]> {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "ai-generated") return "brand";
  return "warning";
}

export function reportStatusTone(status: SessionReportStatus): NonNullable<BadgeProps["tone"]> {
  if (status === "approved") return "success";
  if (status === "ai-generated") return "brand";
  return "neutral";
}

export function reportItemTone(type: SessionReportItemType): NonNullable<BadgeProps["tone"]> {
  if (type === "decision") return "success";
  if (type === "action-item") return "warning";
  if (type === "open-question") return "neutral";
  return "brand";
}
