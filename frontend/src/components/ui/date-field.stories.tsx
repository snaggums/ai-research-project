import type { Meta, StoryObj } from "@storybook/react-vite";

import { DateField } from "@/components/ui/date-field";

const meta = {
  title: "Foundations/Text Field/Date",
  component: DateField,
  tags: ["autodocs"],
  args: {
    hint: "Use the date when the first research session begins.",
    label: "Start date",
  },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "2026-07-21" } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusWithin: true } } };
export const Error: Story = { args: { error: "Choose a valid start date.", hint: undefined } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "2026-07-21" } };
