import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs } from "@/components/ui/tabs";

const items = [
  { content: "Overview content", label: "Overview", value: "overview" },
  { content: "Sessions content", label: "Sessions", value: "sessions" },
  { content: "Insights content", label: "Insights", value: "insights" },
];

const meta = {
  title: "Feedback & Progress/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: { "aria-label": "Project sections", defaultValue: "overview", items, styleVariant: "line" },
  argTypes: {
    items: { control: false },
    styleVariant: { control: "inline-radio", options: ["line", "pill"] },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};
export const Pill: Story = { args: { styleVariant: "pill" } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "[role='tab']:first-child" } } };
export const Hover: Story = { parameters: { pseudo: { hover: "[role='tab']:nth-child(2)" } } };
export const Disabled: Story = {
  args: { items: [items[0], { ...items[1], disabled: true }, items[2]] },
};
