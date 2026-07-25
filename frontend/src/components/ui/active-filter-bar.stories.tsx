import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ActiveFilterBar } from "@/components/ui/active-filter-bar";

const meta = {
  title: "Status & Supporting/Active Filter Bar",
  component: ActiveFilterBar,
  tags: ["autodocs"],
  args: {
    filters: [
      { id: "status", label: "Accepted coded highlights" },
      { id: "navigation", label: "Navigation terminology" },
    ],
    onRemoveFilter: fn(),
    resultSummary: "2 of 3 highlights match the active filters.",
  },
  parameters: {
    docs: {
      description: {
        component: "Persistent, removable filter context for filtered collections and research workspaces. Render it only when filters are active.",
      },
    },
  },
} satisfies Meta<typeof ActiveFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneFilter: Story = {
  args: {
    filters: [{ id: "status", label: "Accepted coded highlights" }],
    resultSummary: "2 of 3 highlights match the active filters.",
  },
};

export const WithoutResultSummary: Story = {
  args: { resultSummary: undefined },
};
