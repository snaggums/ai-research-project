import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/ui/card";

const meta = {
  title: "Tier 2/Card/Media",
  component: MediaCard,
  tags: ["autodocs"],
  args: {
    action: <Button size="small">Button label</Button>,
    description: "Supporting content explains the card and gives users enough context to act.",
    disabled: false,
    mediaLabel: "Project thumbnail",
    mediaTreatment: "full-bleed",
    orientation: "vertical",
    title: "Card title",
  },
  argTypes: {
    action: { control: false },
    media: { control: false },
    mediaTreatment: { control: "inline-radio", options: ["full-bleed", "inset", "thumbnail"] },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
  },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof MediaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalFullBleed: Story = {};
export const HorizontalFullBleed: Story = { args: { orientation: "horizontal" } };
export const VerticalInset: Story = { args: { mediaTreatment: "inset" } };
export const HorizontalInset: Story = { args: { mediaTreatment: "inset", orientation: "horizontal" } };
export const VerticalThumbnail: Story = { args: { mediaTreatment: "thumbnail" } };
export const HorizontalThumbnail: Story = { args: { mediaTreatment: "thumbnail", orientation: "horizontal" } };
export const Hover: Story = { parameters: { pseudo: { hover: ".air-card" } } };
export const Active: Story = { parameters: { pseudo: { active: ".air-card" } } };
export const KeyboardFocus: Story = {
  args: { tabIndex: 0 },
  parameters: { pseudo: { focusVisible: ".air-card" } },
};
export const Disabled: Story = { args: { action: <Button disabled size="small">Button label</Button>, disabled: true } };
