import type { Meta, StoryObj } from "@storybook/react-vite";

import { ParticipantListItem } from "@/components/research/participant-list-item";
import { jordanMoore } from "@/mocks/fixtures/participants";

const meta = {
  title: "Research Objects/Participant/Participant List Item",
  component: ParticipantListItem,
  tags: ["autodocs"],
  decorators: [(Story) => (
    <div className="mx-auto w-full max-w-6xl p-6" onClickCapture={(event) => {
      if ((event.target as HTMLElement).closest("a")) event.preventDefault();
    }}>
      <Story />
    </div>
  )],
  args: {
    href: "#jordan-moore",
    onDelete: () => undefined,
    onEdit: () => undefined,
    participant: jordanMoore,
  },
  parameters: { pseudo: { active: false, focusVisible: false, hover: false } },
} satisfies Meta<typeof ParticipantListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { layout: "default" } };
export const Hover: Story = { args: { layout: "default" }, parameters: { pseudo: { hover: ".air-participant-list-item-link" } } };
export const Active: Story = { args: { layout: "default" }, parameters: { pseudo: { active: ".air-participant-list-item-link" } } };
export const KeyboardFocus: Story = { args: { layout: "default" }, parameters: { pseudo: { focusVisible: ".air-participant-list-item-link" } } };
export const Compact: Story = {
  args: { layout: "compact" },
  decorators: [(Story) => <div className="w-[22rem]"><Story /></div>],
};
export const MinimalMetadata: Story = {
  args: {
    participant: { ...jordanMoore, persona: undefined, referenceId: undefined, researcherNotes: undefined },
  },
};

