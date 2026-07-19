import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { Dialog, DialogErrorFeedback } from "@/components/ui/dialog";

const meta = {
  title: "Tier 2/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  args: {
    defaultOpen: true,
    description: "Explain what the user needs to know before choosing an action.",
    dismissible: true,
    primaryLabel: "Continue",
    showActions: true,
    size: "small",
    title: "Dialog title",
    trigger: <Button variant="brand">Open dialog</Button>,
  },
  argTypes: {
    children: { control: false },
    feedback: { control: false },
    trigger: { control: false },
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallTwoButtons: Story = {};
export const SmallThreeButtons: Story = { args: { secondaryLabel: "Save and close" } };
export const LargeTwoButtons: Story = { args: { size: "large" } };
export const LargeThreeButtons: Story = { args: { secondaryLabel: "Save and close", size: "large" } };
export const WithFeedback: Story = { args: { feedback: <DialogErrorFeedback /> } };
export const NonDismissible: Story = { args: { dismissible: false } };
export const NonDismissibleThreeButtons: Story = {
  args: { dismissible: false, secondaryLabel: "Save and close" },
};
export const Destructive: Story = {
  args: {
    description: "Delete this Session and its transcript, themes, and Session Report? Any Record synthesis generated from this Session will also be removed.",
    intent: "destructive",
    primaryLabel: "Delete session",
    title: "Delete session?",
  },
};
export const WithoutActions: Story = { args: { showActions: false } };
