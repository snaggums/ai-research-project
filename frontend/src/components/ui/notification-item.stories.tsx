import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationItem } from "@/components/ui/notification";

const meta = {
  title: "Tier 2/Notifications/Item",
  component: NotificationItem,
  tags: ["autodocs"],
  args: {
    actorName: "Jordan Lee",
    defaultSelected: false,
    details: "Jordan: “The synthesis is ready to review”",
    disabled: false,
    time: "Today 4:45 PM",
    title: "mentioned you in a comment",
    unread: true,
  },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof NotificationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: ".air-notification-item" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-notification-item" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: ".air-notification-item" } } };
export const Selected: Story = { args: { defaultSelected: true } };
export const Read: Story = { args: { unread: false } };
export const WithoutDetails: Story = { args: { details: undefined } };
export const Disabled: Story = { args: { disabled: true } };
