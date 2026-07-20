import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search, X } from "lucide-react";

import { InputField } from "@/components/ui/input";

const meta = {
  title: "Foundations/Text Field/Input",
  component: InputField,
  tags: ["autodocs"],
  args: {
    hint: "Use a descriptive name that will be easy to recognize later.",
    label: "Project name",
    placeholder: "Enter a project name",
  },
  argTypes: {
    leftIcon: { control: false },
    rightIcon: { control: false },
  },
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const Optional: Story = { args: { optional: true } };
export const Filled: Story = { args: { defaultValue: "Navigation research project" } };
export const WithIcons: Story = {
  args: {
    leftIcon: <Search className="h-5 w-5" />,
    rightIcon: <X className="h-5 w-5" />,
  },
};
export const KeyboardFocus: Story = { parameters: { pseudo: { focusWithin: true } } };
export const Error: Story = {
  args: { error: "Enter a project name before continuing.", hint: undefined },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: "Unavailable project" } };
