import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar } from "@/components/ui/avatar";

const portrait = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23cffafe'/%3E%3Ccircle cx='20' cy='14' r='7' fill='%2300448c'/%3E%3Ccircle cx='20' cy='38' r='15' fill='%2300448c'/%3E%3C/svg%3E";

const meta = {
  title: "Tier 2/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { alt: "Alex Brown", initials: "AB", notificationCount: 2, showNotification: false, showStatus: false, size: "small" },
  argTypes: { size: { control: "inline-radio", options: ["small", "medium", "large"] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const Image: Story = { args: { size: "large", src: portrait } };
export const Online: Story = { args: { showStatus: true, size: "large" } };
export const WithNotification: Story = { args: { showNotification: true, size: "large" } };
export const SizeGallery: Story = {
  render: (args) => <div className="flex items-center gap-6"><Avatar {...args} size="small" /><Avatar {...args} size="medium" /><Avatar {...args} size="large" /></div>,
};
