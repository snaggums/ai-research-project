import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProjectSummary } from "@/components/research/project-summary";
import { checkoutResearchProject } from "@/mocks/fixtures/domain";

const meta = {
  title: "Research Objects/Project/Project Summary",
  component: ProjectSummary,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-6"><Story /></div>],
  args: { project: checkoutResearchProject },
} satisfies Meta<typeof ProjectSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = {
  args: {
    project: {
      ...checkoutResearchProject,
      participantCount: 0,
      sessionCount: 0,
      readyTranscriptCount: 0,
    },
  },
};

