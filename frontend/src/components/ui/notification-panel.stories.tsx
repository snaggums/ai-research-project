import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationPanel, type NotificationData } from "@/components/ui/notification";

const items: NotificationData[] = [
  {
    actorName: "Jordan Lee",
    details: "Jordan: “The synthesis is ready to review”",
    id: "synthesis",
    time: "Today 4:45 PM",
    title: "mentioned you in a comment",
    unread: true,
  },
  {
    actorName: "Maya Chen",
    details: "Repository project plan",
    id: "project",
    time: "Today 2:10 PM",
    title: "shared a project with you",
    unread: true,
  },
  {
    actorName: "Alex Rivera",
    details: "Moderated session notes",
    id: "session",
    time: "Yesterday 11:30 AM",
    title: "completed a session",
    unread: false,
  },
];

const meta = {
  title: "Tier 2/Notifications/Panel",
  component: NotificationPanel,
  tags: ["autodocs"],
  args: {
    defaultSelectedIds: [],
    items,
    showSettings: true,
    title: "Notifications",
  },
  argTypes: { items: { control: false } },
  parameters: { layout: "centered" },
} satisfies Meta<typeof NotificationPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeItems: Story = {};
export const WithSelectedItem: Story = { args: { defaultSelectedIds: ["synthesis"] } };
export const WithoutSettings: Story = { args: { showSettings: false } };
export const FiveItems: Story = {
  args: {
    items: [
      ...items,
      { actorName: "Priya Shah", id: "invite", time: "Monday", title: "invited you to a project", unread: false },
      { actorName: "Sam Wright", disabled: true, id: "archived", time: "Friday", title: "archived a project", unread: false },
    ],
  },
};
export const Empty: Story = { args: { items: [] } };
