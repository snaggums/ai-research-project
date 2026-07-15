import type { ProjectWorkflowStep } from "@/components/research/project-workflow-summary";

const workflowContent = [
  {
    id: "create-project",
    title: "Create project",
    description: "Project details are ready.",
    action: { href: "#project", label: "Edit project" },
  },
  {
    id: "add-participants",
    title: "Add participants",
    description: "Add the people involved in this research.",
    action: { href: "#participants", label: "Add participants" },
  },
  {
    id: "add-sessions",
    title: "Add sessions",
    description: "Organize interviews, tests, or working sessions.",
    action: { href: "#sessions", label: "Add session" },
  },
  {
    id: "upload-transcripts",
    title: "Upload transcripts",
    description: "Add transcript documents for review.",
    action: { href: "#transcripts", label: "Upload transcript" },
  },
] as const;

export function projectWorkflowAt(completedSteps: number): ProjectWorkflowStep[] {
  return workflowContent.map((step, index) => ({
    ...step,
    status: index < completedSteps
      ? "complete"
      : index === completedSteps
        ? "current"
        : "upcoming",
  }));
}

