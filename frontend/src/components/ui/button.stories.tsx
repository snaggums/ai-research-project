import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";

const meta = {
  title: "Foundations/Button",
  component: Button,
  tags: ["autodocs"],
  render: ({ asChild, children, ...args }) =>
    asChild ? (
      <Button {...args} asChild>
        <a href="#button-link-example" onClick={(event) => event.preventDefault()}>
          {children}
        </a>
      </Button>
    ) : (
      <Button {...args}>{children}</Button>
    ),
  args: {
    asChild: false,
    children: "Button label",
    size: "large",
    variant: "brand",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["brand", "brand-subtle", "gray", "gray-subtle", "text", "danger", "danger-subtle"],
    },
    size: {
      control: "inline-radio",
      options: ["small", "large"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {};
export const GraySubtle: Story = { args: { variant: "gray-subtle" } };
export const TextOnly: Story = { args: { variant: "text" } };
export const Disabled: Story = { args: { disabled: true } };
export const Hover: Story = {
  args: { variant: "gray-subtle" },
  parameters: { pseudo: { hover: true } },
};
export const Active: Story = {
  args: { variant: "gray-subtle" },
  parameters: { pseudo: { active: true } },
};
export const KeyboardFocus: Story = {
  args: { variant: "gray-subtle" },
  parameters: { pseudo: { focusVisible: "button" } },
};
export const AsLink: Story = {
  args: {
    asChild: true,
    children: "Open destination",
    variant: "gray-subtle",
  },
};
