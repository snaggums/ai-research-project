import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextareaField } from "@/components/ui/textarea";

const meta = {
  title: "Foundations/Text Field/Textarea",
  component: TextareaField,
  tags: ["autodocs"],
  args: {
    hint: "Summarize the research goal and intended participants.",
    label: "Project description",
    placeholder: "Enter a description",
  },
} satisfies Meta<typeof TextareaField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = {
  args: { defaultValue: "Evaluate how quickly participants can locate and organize prior projects." },
};
export const Focus: Story = { parameters: { pseudo: { focusVisible: "textarea" } } };
export const Error: Story = {
  args: { error: "Add enough detail to explain the purpose of this project.", hint: undefined },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: "This description cannot be changed." } };
