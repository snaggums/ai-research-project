import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from "@/components/ui/progress";

const meta = {
  title: "Feedback & Progress/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: { label: "Project upload", showValue: true, size: "small", value: 25 },
  argTypes: {
    size: { control: "inline-radio", options: ["small", "large"] },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  decorators: [(Story) => <div className="w-[300px]"><Story /></div>],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwentyFive: Story = {};
export const Fifty: Story = { args: { value: 50 } };
export const SeventyFive: Story = { args: { value: 75 } };
export const Complete: Story = { args: { value: 100 } };
export const Large: Story = { args: { size: "large", value: 50 } };
export const WithoutValue: Story = { args: { showValue: false, value: 75 } };

export const ValueComparison: Story = {
  render: (args) => (
    <div className="grid gap-6">
      {[25, 50, 75, 100].map((value) => (
        <Progress {...args} key={value} label={`${value}% progress example`} value={value} />
      ))}
    </div>
  ),
};
