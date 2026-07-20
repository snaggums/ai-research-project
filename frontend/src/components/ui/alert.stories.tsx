import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert } from "@/components/ui/alert";

const meta = {
  title: "Feedback & Progress/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: {
    dismissible: false,
    message: "Helpful context explains the status and what the user should do next.",
    presentation: "contained",
    showIcon: true,
    size: "large",
    title: "Notification title",
    tone: "info",
  },
  argTypes: {
    presentation: { control: "inline-radio", options: ["full-bleed", "contained"] },
    size: { control: "inline-radio", options: ["small", "large"] },
    tone: { control: "select", options: ["info", "success", "warning", "error"] },
  },
  decorators: [(Story) => <div className="w-[560px] max-w-full"><Story /></div>],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning" } };
export const Error: Story = { args: { tone: "error" } };
export const Small: Story = { args: { size: "small" } };
export const FullBleed: Story = { args: { presentation: "full-bleed" } };
export const Dismissible: Story = { args: { dismissible: true } };
export const ToneGallery: Story = {
  render: (args) => (
    <div className="grid gap-4">
      {(["info", "success", "warning", "error"] as const).map((tone) => <Alert {...args} key={tone} tone={tone} />)}
    </div>
  ),
};
