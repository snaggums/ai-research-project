import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { ParticipantForm } from "@/components/research/participant-form";
import { jordanMoore, recordOptions } from "@/mocks/fixtures/participants";

const editValues = {
  firstName: jordanMoore.firstName,
  lastName: jordanMoore.lastName,
  email: jordanMoore.email ?? "",
  recordIds: jordanMoore.recordIds,
  organization: jordanMoore.organization ?? "",
  role: jordanMoore.role ?? "",
  researcherNotes: jordanMoore.researcherNotes ?? "",
};

const meta = {
  title: "Research Objects/Participant/Participant Form",
  component: ParticipantForm,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-full max-w-4xl p-6"><Story /></div>],
  args: {
    mode: "create",
    onSubmit: () => undefined,
    recordOptions,
  },
} satisfies Meta<typeof ParticipantForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddParticipant: Story = {};
export const AddValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add participant" }));
  },
};
export const AddDisabled: Story = { args: { isSubmitting: true } };
export const AddRequestError: Story = { args: { submitError: "Check your connection and try again. Your entered details are still available." } };
export const EditParticipant: Story = { args: { defaultValues: editValues, mode: "edit" } };
export const EditRequestError: Story = {
  args: { defaultValues: editValues, mode: "edit", submitError: "Check your connection and try again. Your entered details are still available." },
};
