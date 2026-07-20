import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { ParticipantPicker, type ParticipantPickerProps } from "@/components/research/participant-picker";
import { participantOptions } from "@/mocks/fixtures/participants";

function ParticipantPickerStory(props: Omit<ParticipantPickerProps, "onValueChange" | "value"> & { initialValue?: string[] }) {
  const [value, setValue] = React.useState(props.initialValue ?? []);
  return <ParticipantPicker {...props} onValueChange={setValue} value={value} />;
}

const meta = {
  title: "Research Objects/Participant/Participant Picker",
  component: ParticipantPickerStory,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-full max-w-xl p-6"><Story /></div>],
  args: { onAddParticipant: () => undefined, participants: participantOptions },
} satisfies Meta<typeof ParticipantPickerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Open: Story = { args: { defaultOpen: true, initialValue: ["jordan-moore"] } };
export const Selected: Story = { args: { initialValue: ["jordan-moore", "avery-chen"] } };
export const NoResults: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox", { name: "Participants" }), "Morgan");
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const Error: Story = { args: { error: "Select at least one participant." } };
