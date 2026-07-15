import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { alphaProject } from "@/mocks/fixtures/domain";
import { projectWorkflowAt } from "@/mocks/fixtures/project";
import { ProjectOverviewView } from "@/pages/project-views";

function ProjectOverviewStory({ completedSteps = 1 }: { completedSteps?: number }) {
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell context="project" project={{ id: alphaProject.id, name: alphaProject.name }}>
        <ProjectOverviewView project={alphaProject} steps={projectWorkflowAt(completedSteps)} />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Projects/Project Overview",
  component: ProjectOverviewStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProjectOverviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GettingStarted: Story = {};
export const WorkflowComplete: Story = { args: { completedSteps: 4 } };
