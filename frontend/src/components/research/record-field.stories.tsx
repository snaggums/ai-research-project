import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { RecordField } from "./record-field";

const meta = {
  title: "Research Objects/Record/Record Field",
  component: RecordField,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-full max-w-xl p-6"><Story /></div>],
  args: { defaultValue: "record-1" },
} satisfies Meta<typeof RecordField>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Record1: Story = {};
export const Record2: Story = { args: { defaultValue: "record-2" } };
export const Record3: Story = { args: { defaultValue: "record-3" } };
export const Open: Story = { args: { defaultOpen: true } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "[aria-haspopup='listbox']" } } };
export const SelectRecord2: Story = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("combobox", { name: /Record/ })); await userEvent.click(canvas.getByRole("option", { name: "Record 2" })); } };
export const Disabled: Story = { args: { disabled: true } };
