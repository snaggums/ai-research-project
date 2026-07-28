import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import { projectNavigationItems } from "@/components/application/navigation-model";
import { recordOptions } from "@/mocks/fixtures/participants";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import {
  SessionParticipantCreateView,
  type SessionParticipantCreateViewProps,
} from "./session-views";

const session = toSessionSummary(sessionApiFixtures[0]);
const eligibleParticipants = [
  { label: "Riley Chen", value: "riley-chen" },
  { label: "Samir Kaur", value: "samir-kaur" },
  { label: "Jordan Lee", value: "jordan-lee" },
];

function StoryPage(props: SessionParticipantCreateViewProps) {
  const navigationEntries = projectNavigationItems(
    props.projectId,
    [{
      href: `/projects/${props.projectId}/sessions/${session.id}/overview`,
      id: session.id,
      label: session.title,
    }],
  );

  return (
    <div onClickCapture={(event) => {
      if ((event.target as HTMLElement).closest("a")) event.preventDefault();
    }}>
      <ApplicationShell
        activeProjectChildId={session.id}
        activeProjectItem="sessions"
        context="project"
        project={{ id: props.projectId, name: props.projectName }}
        projectNavigationEntries={navigationEntries}
      >
        <SessionParticipantCreateView {...props} />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Sessions/Add Participant",
  component: StoryPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
Session-owned participant assignment task. The current Session remains active in the expanded left navigation, the Session summary remains visible, and Participants remains the active Session tab.

- The canonical route is \`/projects/:projectId/sessions/:sessionId/participants/new\`.
- Cancel and successful assignment return to the Session Participants collection.
- [Approved Desktop Figma state](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1101-67286)
        `,
      },
    },
    layout: "fullscreen",
  },
  args: {
    eligibleParticipants,
    onCancel: fn(),
    onEditSession: fn(),
    onSubmitExisting: fn(),
    onSubmitNew: fn(),
    projectId: "alpha-project",
    projectName: "Alpha Project",
    recordOptions,
    routeState: "ready",
    session,
  },
  argTypes: {
    eligibleParticipants: { control: false },
    onCancel: { control: false },
    onEditSession: { control: false },
    onRetry: { control: false },
    onSubmitExisting: { control: false },
    onSubmitNew: { control: false },
    recordOptions: { control: false },
    session: { control: false },
  },
} satisfies Meta<typeof StoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: session.title })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Collapse Sessions" })).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: session.title })).toHaveAttribute("aria-current", "page");
    await expect(
      within(canvas.getByRole("navigation", { name: "Session sections" }))
        .getByRole("link", { name: "Participants" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("heading", { level: 2, name: "Add participant" })).toBeVisible();
    await expect(canvas.getByRole("heading", { level: 3, name: "Add an existing participant" })).toBeVisible();
    await expect(canvas.getByRole("combobox", { name: "Project participant" })).toBeVisible();
  },
};

export const SearchProjectParticipants: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const combobox = canvas.getByRole("combobox", { name: "Project participant" });
    await userEvent.type(combobox, "samir");
    const listbox = canvas.getByRole("listbox", { name: "Project participant" });
    await expect(within(listbox).getAllByRole("option")).toHaveLength(1);
    await userEvent.click(within(listbox).getByRole("option", { name: "Samir Kaur" }));
    await expect(combobox).toHaveValue("Samir Kaur");
    await expect(canvas.getByRole("textbox", { name: /First name/ })).toBeDisabled();
  },
};

export const RequestFailure: Story = {
  args: {
    submitError: "Check your connection and try again. Your entered details are still available.",
  },
};

export const Loading: Story = {
  args: {
    routeState: "loading",
    session: undefined,
  },
};

export const Error: Story = {
  args: {
    onRetry: fn(),
    routeState: "error",
    session: undefined,
  },
};

export const NotFound: Story = {
  args: {
    routeState: "not-found",
    session: undefined,
  },
};
