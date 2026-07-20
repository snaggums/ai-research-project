import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Pencil, Trash2 } from "lucide-react";

import { DropdownMenu, type DropdownMenuItem } from "@/components/application/dropdown-menu";

const items: DropdownMenuItem[] = [
  { id: "edit", label: "Edit project", icon: Pencil },
  { id: "duplicate", label: "Duplicate project", icon: Copy },
  { id: "delete", label: "Delete project", icon: Trash2, tone: "destructive" },
];

function MenuExample() {
  const [selection, setSelection] = React.useState("No action selected");
  return (
    <div className="flex min-h-64 items-start justify-between gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5">
      <div>
        <div className="font-semibold">Alpha Project</div>
        <div aria-live="polite" className="mt-2 text-sm text-[var(--air-color-text-secondary)]">{selection}</div>
      </div>
      <DropdownMenu items={items} onSelect={(item) => setSelection(item.label)} />
    </div>
  );
}

const meta = {
  title: "Application Foundation/Dropdown Menu",
  component: DropdownMenu,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
  args: { items, onSelect: () => undefined },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <MenuExample /> };

export const StartAligned: Story = { args: { align: "start" } };

