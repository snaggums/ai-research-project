import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion } from "@/components/ui/accordion";

const meta = {
  title: "Tier 2/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  args: { content: "Supporting content appears when the accordion section is expanded.", defaultOpen: false, disabled: false, showIcon: true, styleVariant: "fill", title: "Accordion title" },
  argTypes: { styleVariant: { control: "inline-radio", options: ["fill", "line"] } },
  decorators: [(Story) => <div className="w-[343px] max-w-full"><Story /></div>],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FillClosed: Story = {};
export const FillOpen: Story = { args: { defaultOpen: true } };
export const LineClosed: Story = { args: { styleVariant: "line" } };
export const LineOpen: Story = { args: { defaultOpen: true, styleVariant: "line" } };
export const Hover: Story = { parameters: { pseudo: { hover: ".air-accordion > button" } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: ".air-accordion > button" } } };
export const Disabled: Story = { args: { disabled: true } };
