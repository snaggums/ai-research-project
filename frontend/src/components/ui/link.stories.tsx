import type { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "@/components/ui/link";

const meta = {
  title: "Foundations/Link",
  component: Link,
  tags: ["autodocs"],
  render: (args) => <Link {...args} onClick={(event) => event.preventDefault()} />,
  args: {
    children: "Link label",
    href: "#link-example",
    size: "medium",
    variant: "inline",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["small", "medium"] },
    variant: { control: "select", options: ["inline", "standalone", "subtle"] },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};
export const Standalone: Story = { args: { variant: "standalone" } };
export const External: Story = { args: { external: true, children: "External resource" } };
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Active: Story = { parameters: { pseudo: { active: true } } };
export const KeyboardFocus: Story = { parameters: { pseudo: { focusVisible: "a" } } };
