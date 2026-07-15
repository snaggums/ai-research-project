import type { Meta, StoryObj } from "@storybook/react-vite";

import { PasswordField } from "@/components/ui/password-field";

const meta = {
  title: "Foundations/Text Field/Password",
  component: PasswordField,
  tags: ["autodocs"],
  args: {
    disabled: false,
    hint: "Use at least eight characters.",
    label: "Password label",
    placeholder: "Enter password",
    showVisibilityToggle: true,
  },
  argTypes: {
    visible: { control: "boolean" },
  },
  parameters: { pseudo: { active: false, focusWithin: false, hover: false } },
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "research" } };
export const Visible: Story = { args: { defaultValue: "research", defaultVisible: true } };
export const Hover: Story = { parameters: { pseudo: { hover: "input" } } };
export const Active: Story = { parameters: { pseudo: { active: "input" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusWithin: true } } };
export const Error: Story = { args: { defaultValue: "short", error: "Password must contain at least eight characters.", hint: undefined } };
export const Disabled: Story = { args: { defaultValue: "research", disabled: true } };
export const WithoutVisibilityToggle: Story = { args: { showVisibilityToggle: false } };
