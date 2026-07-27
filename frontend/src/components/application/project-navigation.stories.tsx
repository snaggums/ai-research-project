import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  ProjectNavigation,
  type ProjectNavigationEntry,
} from "@/components/application/project-navigation";

const items: ProjectNavigationEntry[] = [
  { href: "#overview", id: "overview", label: "Overview", type: "link" },
  { href: "#participants", id: "participants", label: "Participants", type: "link" },
  {
    href: "#sessions",
    id: "sessions",
    items: [
      { href: "#second-session", id: "second-session", label: "Second Session" },
      { href: "#first-session", id: "first-session", label: "First Session" },
      { href: "#working-session", id: "working-session", label: "Working Session" },
      { href: "#interview", id: "interview", label: "Interview" },
    ],
    label: "Sessions",
    type: "group",
  },
  {
    href: "#records",
    id: "records",
    items: [
      { href: "#record-1", id: "record-1", label: "Record 1" },
      { href: "#record-2", id: "record-2", label: "Record 2" },
      { href: "#record-3", id: "record-3", label: "Record 3" },
    ],
    label: "Records",
    type: "group",
  },
  { href: "#ask", id: "ask-project", label: "Ask this project", type: "link" },
];

const meta = {
  title: "Application Foundation/Project Navigation",
  component: ProjectNavigation,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        className="w-[216px] bg-[var(--air-color-bg-surface)] p-2"
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a")) event.preventDefault();
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    items,
    label: "Project navigation",
  },
  argTypes: {
    activeId: {
      control: "select",
      options: [undefined, "overview", "participants", "sessions", "records", "ask-project"],
    },
    expandedId: {
      control: "select",
      options: [null, "sessions", "records"],
    },
    defaultExpandedId: {
      control: "select",
      options: [null, "sessions", "records"],
    },
  },
} satisfies Meta<typeof ProjectNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: { expandedId: null },
  name: "No active route — collapsed",
};
export const OverviewActive: Story = {
  args: { activeId: "overview", expandedId: null },
};
export const ParticipantsActive: Story = {
  args: { activeId: "participants", expandedId: null },
};
export const SessionsActiveCollapsed: Story = {
  args: { activeId: "sessions", expandedId: null },
};
export const SessionsExpanded: Story = {
  args: { expandedId: "sessions" },
  name: "Sessions — default expanded",
};
export const SessionsActiveExpanded: Story = {
  args: { activeId: "sessions", expandedId: "sessions" },
};
export const SessionDetailActive: Story = {
  args: { activeChildId: "second-session", activeId: "sessions", expandedId: "sessions" },
};
export const RecordsActiveCollapsed: Story = {
  args: { activeId: "records", expandedId: null },
};
export const RecordsExpanded: Story = {
  args: { expandedId: "records" },
  name: "Records — default expanded",
};
export const RecordsActiveExpanded: Story = {
  args: { activeId: "records", expandedId: "records" },
};
export const RecordDetailActive: Story = {
  args: { activeChildId: "record-1", activeId: "records", expandedId: "records" },
};
export const AskThisProjectActive: Story = {
  args: { activeId: "ask-project", expandedId: null },
};

export const InteractiveAccordion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Expand Sessions" }));
    await expect(canvas.getByRole("list", { name: "Sessions list" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Collapse Sessions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await userEvent.click(canvas.getByRole("button", { name: "Expand Records" }));
    await expect(canvas.getByRole("list", { name: "Records list" })).toBeVisible();
    await expect(canvasElement.querySelector("#project-navigation-sessions-list")).not.toBeVisible();
  },
};
