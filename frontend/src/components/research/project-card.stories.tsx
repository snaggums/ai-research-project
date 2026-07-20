import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProjectCard } from "@/components/research/project-card";
import { checkoutResearchProject } from "@/mocks/fixtures/domain";

const meta = {
  title: "Research Objects/Project/Project Card",
  component: ProjectCard,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-full max-w-md p-6"><Story /></div>],
  args: {
    href: "#checkout-project",
    project: checkoutResearchProject,
    onDelete: () => undefined,
    onEdit: () => undefined,
  },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: ".air-project-card-link" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-project-card-link" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: ".air-project-card-link" } } };
export const WithoutDescription: Story = {
  args: { project: { ...checkoutResearchProject, description: undefined } },
};
export const WithoutTranscriptStatus: Story = {
  args: { project: { ...checkoutResearchProject, readyTranscriptCount: undefined } },
};

