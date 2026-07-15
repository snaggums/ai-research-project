import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "@/components/ui/spinner";

const meta = {
  title: "Feedback & Progress/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  args: { label: "Loading projects", size: "small", tone: "brand" },
  argTypes: {
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
    tone: { control: "inline-radio", options: ["brand", "neutral", "inverse"] },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {};
export const Neutral: Story = { args: { tone: "neutral" } };
export const Inverse: Story = {
  args: { tone: "inverse" },
  decorators: [(Story) => <div className="w-fit rounded-lg bg-[var(--air-color-text-primary)] p-4"><Story /></div>],
};
export const Medium: Story = { args: { size: "medium" } };
export const Large: Story = { args: { size: "large" } };
export const SizeGallery: Story = {
  render: (args) => <div className="flex items-center gap-10"><Spinner {...args} size="small" /><Spinner {...args} size="medium" /><Spinner {...args} size="large" /></div>,
};
