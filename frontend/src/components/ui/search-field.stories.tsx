import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchField } from "@/components/ui/search-field";

const meta = {
  title: "Foundations/Text Field/Search",
  component: SearchField,
  tags: ["autodocs"],
  args: {
    label: "Search projects",
    placeholder: "Search by title, tag, or researcher",
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "navigation" } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusWithin: true } } };
export const Error: Story = { args: { error: "Search is temporarily unavailable." } };
export const Disabled: Story = { args: { disabled: true } };
