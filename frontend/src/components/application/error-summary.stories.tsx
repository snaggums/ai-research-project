import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorSummary } from "@/components/application/error-summary";
import { InputField } from "@/components/ui/input";

const errors = [
  { fieldId: "first-name", message: "Enter a first name" },
  { fieldId: "last-name", message: "Enter a last name" },
];

const meta = {
  title: "Application Foundation/Error Summary",
  component: ErrorSummary,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-3xl p-6"><Story /></div>],
  args: { errors, focusOnMount: false },
} satisfies Meta<typeof ErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid gap-5">
      <ErrorSummary {...args} />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField error="Enter a first name" id="first-name" label="First name" />
        <InputField error="Enter a last name" id="last-name" label="Last name" />
      </div>
    </div>
  ),
};
