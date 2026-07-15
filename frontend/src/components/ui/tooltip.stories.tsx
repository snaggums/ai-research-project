import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";

const meta = {
  title: "Status & Supporting/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="flex min-h-[240px] min-w-[420px] items-center justify-center p-20"><Story /></div>],
  render: (args) => (
    <Tooltip {...args}>
      <IconButton icon={<Info />} label="More information" variant="gray-subtle" />
    </Tooltip>
  ),
  args: {
    children: <button type="button">Tooltip trigger</button>,
    content: "Helpful context",
    delayDuration: 300,
    open: true,
    placement: "top",
    size: "small",
  },
  argTypes: {
    children: { control: false },
    placement: { control: "select", options: ["top-start", "top", "top-end", "bottom-start", "bottom", "bottom-end", "left", "right"] },
    size: { control: "inline-radio", options: ["small", "large"] },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {};
export const Large: Story = { args: { content: undefined, description: "Tooltips provide concise supporting information without interrupting the current task.", size: "large", title: "Tooltip title" } };
export const TopStart: Story = { args: { placement: "top-start" } };
export const TopEnd: Story = { args: { placement: "top-end" } };
export const BottomStart: Story = { args: { placement: "bottom-start" } };
export const Bottom: Story = { args: { placement: "bottom" } };
export const BottomEnd: Story = { args: { placement: "bottom-end" } };
export const Left: Story = { args: { placement: "left" } };
export const Right: Story = { args: { placement: "right" } };
export const Interactive: Story = {
  args: { open: undefined },
  render: (args) => (
    <Tooltip {...args}>
      <IconButton icon={<Info />} label="More information" variant="gray-subtle" />
    </Tooltip>
  ),
};
