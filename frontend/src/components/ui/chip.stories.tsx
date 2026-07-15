import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "lucide-react";

import { Chip } from "@/components/ui/chip";

const meta = {
  title: "Status & Supporting/Chip",
  component: Chip,
  tags: ["autodocs"],
  args: { children: "Chip label", disabled: false, removable: true, size: "small" },
  argTypes: { size: { control: "inline-radio", options: ["small", "large"] } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Selected: Story = { args: { selected: true } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "[data-control='chip']" } } };
export const Disabled: Story = { args: { disabled: true } };
export const WithLeadingIcon: Story = { args: { leadingIcon: <Tag /> } };
export const Large: Story = { args: { leadingIcon: <Tag />, size: "large" } };
export const NotRemovable: Story = { args: { removable: false, selected: true } };
