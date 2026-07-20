import type { Meta, StoryObj } from "@storybook/react-vite";

import { ButtonSet } from "@/components/ui/button-set";

const meta = {
  title: "Tier 2/Button Set",
  component: ButtonSet,
  tags: ["autodocs"],
  args: { cancelLabel: "Cancel", primaryLabel: "Continue", showCancel: true, size: "small" },
  argTypes: { size: { control: "inline-radio", options: ["small", "large"] } },
} satisfies Meta<typeof ButtonSet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoSmall: Story = {};
export const ThreeSmall: Story = { args: { secondaryLabel: "Save and close" } };
export const TwoLarge: Story = { args: { size: "large" } };
export const ThreeLarge: Story = { args: { secondaryLabel: "Save and close", size: "large" } };
