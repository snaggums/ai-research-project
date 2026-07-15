import type { Meta, StoryObj } from "@storybook/react-vite";

import { Toggle } from "@/components/ui/toggle";

const meta = {
  title: "Foundations/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: {
    checked: false,
    description: "Send an alert when synthesis is ready for review.",
    label: "Synthesis notifications",
  },
  argTypes: {
    checked: { control: "boolean", name: "Selected" },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { checked: true } };
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Active: Story = { parameters: { pseudo: { active: true } } };
export const KeyboardFocus: Story = {
  parameters: { pseudo: { focusVisible: '[data-control="toggle"]' } },
};
export const Disabled: Story = { args: { disabled: true } };
export const DisabledSelected: Story = { args: { checked: true, disabled: true } };
