import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import type { ProjectFormProps } from "@/components/research/project-form";
import { alphaProject, checkoutResearchProject } from "@/mocks/fixtures/domain";
import { ProjectFormDialogView, ProjectsIndexView } from "@/pages/project-views";

function CreateEditProjectStory(props: ProjectFormProps) {
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell context="workspace">
        <ProjectsIndexView
          onSearchChange={() => undefined}
          projects={[checkoutResearchProject, alphaProject]}
          search=""
        />
        <ProjectFormDialogView {...props} />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Projects/Create and Edit Project",
  component: CreateEditProjectStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { mode: "create", onSubmit: () => undefined },
} satisfies Meta<typeof CreateEditProjectStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};
export const CreateError: Story = { args: { submitError: "The project could not be created." } };
export const Edit: Story = {
  args: {
    defaultValues: { name: alphaProject.name, description: alphaProject.description ?? "" },
    mode: "edit",
  },
};
export const Saving: Story = {
  args: {
    defaultValues: { name: alphaProject.name, description: alphaProject.description ?? "" },
    isSubmitting: true,
    mode: "edit",
  },
};
