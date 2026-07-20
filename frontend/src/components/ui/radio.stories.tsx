import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Radio } from "@/components/ui/radio";

const meta = {
  title: "Foundations/Radio",
  component: Radio,
  tags: ["autodocs"],
  args: {
    checked: false,
    description: "Use moderated sessions with a facilitator.",
    label: "Moderated",
    name: "project-format",
    value: "moderated",
  },
  argTypes: {
    checked: { control: "boolean", name: "Selected" },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

function RadioGroupExample() {
  const [selected, setSelected] = React.useState("moderated");
  return (
    <div className="grid gap-4" role="radiogroup" aria-label="Project format">
      <Radio
        checked={selected === "moderated"}
        label="Moderated"
        name="format-example"
        value="moderated"
        onCheckedChange={() => setSelected("moderated")}
      />
      <Radio
        checked={selected === "unmoderated"}
        label="Unmoderated"
        name="format-example"
        value="unmoderated"
        onCheckedChange={() => setSelected("unmoderated")}
      />
    </div>
  );
}

export const Default: Story = {};
export const Selected: Story = { args: { checked: true } };
export const Group: Story = { render: () => <RadioGroupExample /> };
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Active: Story = { parameters: { pseudo: { active: true } } };
export const KeyboardFocus: Story = {
  parameters: { pseudo: { focusVisible: '[data-control="radio"]' } },
};
export const Disabled: Story = { args: { disabled: true } };
export const DisabledSelected: Story = { args: { checked: true, disabled: true } };
