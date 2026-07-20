import type { Meta, StoryObj } from "@storybook/react-vite";

import { EmptyState } from "@/components/application/empty-state";
import { EntityCollection } from "@/components/application/entity-collection";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Application Foundation/Entity Collection",
  component: EntityCollection,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-6"><Story /></div>],
  args: {
    title: "Sessions",
    countLabel: "4 sessions",
    state: "ready",
    actions: <Button size="small">New session</Button>,
    children: (
      <div className="grid gap-2">
        {["Checkout workflow interview", "Navigation usability test", "Focus group", "Design critique"].map((title) => (
          <div className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4" key={title}>
            <div className="font-semibold">{title}</div>
            <div className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Transcript ready</div>
          </div>
        ))}
      </div>
    ),
  },
  argTypes: {
    state: { control: "select", options: ["ready", "loading", "empty", "no-results", "error"] },
  },
} satisfies Meta<typeof EntityCollection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const Empty: Story = {
  args: {
    state: "empty",
    stateContent: (
      <EmptyState
        description="Create a session to organize participants and transcripts."
        primaryAction={<Button size="small">New session</Button>}
        title="No sessions yet"
      />
    ),
  },
};
export const NoResults: Story = { args: { state: "no-results" } };
export const Error: Story = { args: { state: "error" } };

