import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";

const meta = {
  title: "Foundations/Icon Button",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    label: "Add item",
    icon: <Plus aria-hidden="true" className="h-5 w-5" />,
    size: "small",
    variant: "gray-subtle",
  },
  argTypes: {
    icon: { control: false },
    size: { control: "inline-radio", options: ["small", "large"] },
    variant: {
      control: "select",
      options: ["brand", "brand-subtle", "gray", "gray-subtle", "text", "danger", "danger-subtle"],
    },
  },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Brand: Story = { args: { variant: "brand" } };
export const Hover: Story = { parameters: { pseudo: { hover: "button" } } };
export const Active: Story = { parameters: { pseudo: { active: "button" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "button" } } };
export const Disabled: Story = { args: { disabled: true } };
