import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "@/components/ui/checkbox";

const meta = {
  title: "Foundations/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: {
    checked: false,
    indeterminate: false,
    description: "Include archived sessions in repository results.",
    label: "Include archived sessions",
  },
  argTypes: {
    checked: { control: "boolean", name: "Selected" },
    indeterminate: { control: "boolean", name: "Indeterminate" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const IndeterminateHover: Story = {
  args: { indeterminate: true },
  parameters: { pseudo: { hover: true } },
};
export const IndeterminateActive: Story = {
  args: { indeterminate: true },
  parameters: { pseudo: { active: true } },
};
export const IndeterminateKeyboardFocus: Story = {
  args: { indeterminate: true },
  parameters: { pseudo: { focusVisible: '[data-control="checkbox"]' } },
};
export const IndeterminateDisabled: Story = { args: { disabled: true, indeterminate: true } };
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Active: Story = { parameters: { pseudo: { active: true } } };
export const KeyboardFocus: Story = {
  parameters: { pseudo: { focusVisible: '[data-control="checkbox"]' } },
};
export const Disabled: Story = { args: { disabled: true } };
export const DisabledSelected: Story = { args: { checked: true, disabled: true } };
