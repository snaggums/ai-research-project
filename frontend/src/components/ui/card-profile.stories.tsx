import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ProfileCard } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";

const meta = {
  title: "Tier 2/Card/Profile",
  component: ProfileCard,
  tags: ["autodocs"],
  args: {
    avatar: <Avatar alt="Alex Brown" initials="AB" size="large" />,
    disabled: false,
    menuAction: <IconButton icon={<MoreHorizontal />} label="Profile actions" size="small" />,
    subtitle: "Subtitle",
    title: "Card title",
  },
  argTypes: { avatar: { control: false }, menuAction: { control: false } },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof ProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: ".air-card" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-card" } } };
export const KeyboardFocus: Story = {
  args: { tabIndex: 0 },
  parameters: { pseudo: { focusVisible: ".air-card" } },
};
export const Disabled: Story = {
  args: { disabled: true, menuAction: <IconButton disabled icon={<MoreHorizontal />} label="Profile actions" size="small" /> },
};
export const WithoutMenu: Story = { args: { menuAction: undefined } };
