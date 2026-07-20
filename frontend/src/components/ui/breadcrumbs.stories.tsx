import type { Meta, StoryObj } from "@storybook/react-vite";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const items = [
  { href: "#projects", label: "Projects" },
  { href: "#project-details", label: "Project details" },
  { href: "#sessions", label: "Sessions" },
  { label: "Session" },
];

const meta = {
  title: "Tier 2/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  args: { items, label: "Project location" },
  argTypes: { items: { control: false } },
  render: (args) => (
    <div
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest("a")) event.preventDefault();
      }}
    >
      <Breadcrumbs {...args} />
    </div>
  ),
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourItems: Story = {};
export const TwoItems: Story = { args: { items: [items[0], { label: "Project details" }] } };
export const FiveItems: Story = { args: { items: [...items.slice(0, 3), { href: "#session", label: "Session" }, { label: "Notes" }] } };
export const Hover: Story = { parameters: { pseudo: { hover: "li:first-child a" } } };
export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    (canvasElement.querySelector("li:first-child a") as HTMLElement | null)?.focus();
  },
};
export const DisabledItem: Story = { args: { items: [items[0], { disabled: true, label: "Project details" }, { label: "Sessions" }] } };
