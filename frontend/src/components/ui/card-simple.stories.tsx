import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { SimpleCard } from "@/components/ui/card";

const meta = {
  title: "Tier 2/Card/Simple",
  component: SimpleCard,
  tags: ["autodocs"],
  args: {
    action: <Button size="small">Button label</Button>,
    description: "Helpful supporting content gives users enough context to understand the card.",
    disabled: false,
    title: "Card title",
  },
  argTypes: { action: { control: false } },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof SimpleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: ".air-card" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-card" } } };
export const KeyboardFocus: Story = {
  args: { tabIndex: 0 },
  parameters: { pseudo: { focusVisible: ".air-card" } },
};
export const Disabled: Story = { args: { action: <Button disabled size="small">Button label</Button>, disabled: true } };
export const WithoutAction: Story = { args: { action: undefined } };
