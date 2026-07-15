import type { Meta, StoryObj } from "@storybook/react-vite";

import { SelectField } from "@/components/ui/select";

const options = [
  { label: "Planning", value: "planning" },
  { label: "Active", value: "active" },
  { label: "Complete", value: "complete" },
];

const meta = {
  title: "Foundations/Text Field/Select",
  component: SelectField,
  tags: ["autodocs"],
  args: {
    hint: "Status determines where the project appears in the repository.",
    label: "Project status",
    options,
    placeholder: "Choose a status",
  },
  argTypes: { options: { control: false } },
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "active" } };
export const Active: Story = { args: { defaultOpen: true } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "[aria-haspopup='listbox']" } } };
export const Error: Story = { args: { error: "Select a project status.", hint: undefined } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "complete" } };
