import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { ProjectForm } from "@/components/research/project-form";
import { checkoutResearchProject } from "@/mocks/fixtures/domain";

const meta = {
  title: "Research Objects/Project/Project Form",
  component: ProjectForm,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-full max-w-2xl p-6"><Story /></div>],
  args: {
    mode: "create",
    onSubmit: () => undefined,
    onCancel: () => undefined,
  },
  argTypes: {
    mode: { control: "inline-radio", options: ["create", "edit"] },
  },
} satisfies Meta<typeof ProjectForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreatePristine: Story = {};
export const CreateValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create project" }));
    await expect(canvas.getByText("Enter a project name.")).toBeInTheDocument();
  },
};
export const CreateSubmitting: Story = { args: { isSubmitting: true } };
export const CreateRequestFailure: Story = {
  args: { submitError: "Check your connection and try again. Your details are still available." },
};
export const EditPristine: Story = {
  args: {
    mode: "edit",
    defaultValues: {
      name: checkoutResearchProject.name,
      description: checkoutResearchProject.description,
    },
  },
};
export const EditValidationError: Story = {
  args: { mode: "edit", defaultValues: { name: "", description: checkoutResearchProject.description } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByText("Enter a project name.")).toBeInTheDocument();
  },
};
export const EditSubmitting: Story = {
  args: {
    ...EditPristine.args,
    isSubmitting: true,
  },
};
export const EditRequestFailure: Story = {
  args: {
    ...EditPristine.args,
    submitError: "Check your connection and try again. Your changes are still available.",
  },
};

