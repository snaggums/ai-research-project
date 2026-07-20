import type { Meta, StoryObj } from "@storybook/react-vite";

import { SharedRouteState } from "@/components/application/shared-route-state";

const meta = {
  title: "Application Foundation/Shared Route State",
  component: SharedRouteState,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { state: "loading", onRetry: () => undefined },
  argTypes: {
    state: {
      control: "select",
      options: ["loading", "recoverable-error", "not-found", "unavailable-source"],
    },
  },
} satisfies Meta<typeof SharedRouteState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
export const RecoverableError: Story = { args: { state: "recoverable-error" } };
export const NotFound: Story = { args: { state: "not-found" } };
export const UnavailableSource: Story = { args: { state: "unavailable-source" } };

