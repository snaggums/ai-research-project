import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProjectWorkflowSummary } from "@/components/research/project-workflow-summary";
import { projectWorkflowAt } from "@/mocks/fixtures/project";

const meta = {
  title: "Research Objects/Project/Project Workflow Summary",
  component: ProjectWorkflowSummary,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-3xl p-6"><Story /></div>],
  args: {
    steps: projectWorkflowAt(1),
    completionAction: { href: "#sessions", label: "View sessions" },
  },
  argTypes: { steps: { control: false } },
} satisfies Meta<typeof ProjectWorkflowSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwentyFivePercent: Story = {};
export const FiftyPercent: Story = { args: { steps: projectWorkflowAt(2) } };
export const SeventyFivePercent: Story = { args: { steps: projectWorkflowAt(3) } };
export const Complete: Story = { args: { steps: projectWorkflowAt(4) } };

