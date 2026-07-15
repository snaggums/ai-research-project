import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const meta = {
  title: "Status & Supporting/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Badge label", showIcon: true, size: "small", tone: "neutral" },
  argTypes: {
    size: { control: "inline-radio", options: ["small", "large"] },
    tone: { control: "select", options: ["neutral", "brand", "success", "warning", "error", "inverse"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Brand: Story = { args: { tone: "brand" } };
export const Success: Story = { args: { icon: <CheckCircle2 />, tone: "success" } };
export const Warning: Story = { args: { tone: "warning" } };
export const Error: Story = { args: { tone: "error" } };
export const Inverse: Story = { args: { tone: "inverse" } };
export const Large: Story = { args: { size: "large", tone: "brand" } };
export const WithoutIcon: Story = { args: { showIcon: false, tone: "brand" } };
export const ToneGallery: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      {(["neutral", "brand", "success", "warning", "error", "inverse"] as const).map((tone) => (
        <Badge {...args} key={tone} tone={tone}>{tone[0].toUpperCase() + tone.slice(1)}</Badge>
      ))}
    </div>
  ),
};
