import type { Meta, StoryObj } from "@storybook/react-vite";

import { MultiSelectField } from "@/components/ui/multi-select-field";

const options = [
  { label: "Interviews", value: "interviews" },
  { label: "Usability testing", value: "usability" },
  { label: "Survey", value: "survey" },
  { label: "Diary study", value: "diary" },
];

const meta = {
  title: "Foundations/Text Field/Multi-select",
  component: MultiSelectField,
  tags: ["autodocs"],
  args: {
    hint: "Choose every method used in this project.",
    label: "Research methods",
    options,
    placeholder: "Select research methods",
  },
  argTypes: { options: { control: false } },
} satisfies Meta<typeof MultiSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: ["interviews", "usability"] } };
export const TruncatedSummary: Story = {
  args: {
    className: "max-w-xs",
    defaultValue: ["interviews", "usability", "survey", "diary"],
  },
};
export const Active: Story = { args: { defaultOpen: true } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "[aria-haspopup='listbox']" } } };
export const Error: Story = { args: { error: "Select at least one research method.", hint: undefined } };
export const Disabled: Story = { args: { disabled: true, defaultValue: ["survey"] } };
