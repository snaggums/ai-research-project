import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";

import { ApplicationShell } from "@/components/application/application-shell";
import { EmptyState } from "@/components/application/empty-state";
import { EntityCollection } from "@/components/application/entity-collection";
import { PageHeader } from "@/components/application/page-header";
import { Button } from "@/components/ui/button";
import { alphaProject } from "@/mocks/fixtures/domain";

const meta = {
  title: "Application Foundation/Application Shell",
  component: ApplicationShell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    children: null,
    context: "project",
    project: { id: alphaProject.id, name: alphaProject.name },
    activeProjectItem: "sessions",
    showProjectSearch: false,
  },
  argTypes: {
    activeProjectItem: {
      control: "select",
      options: ["overview", "participants", "sessions", "ask-project"],
    },
    activeGlobalSubItem: {
      control: "select",
      options: [undefined, "record-1", "record-2", "record-3"],
    },
    context: { control: "inline-radio", options: ["workspace", "project"] },
  },
} satisfies Meta<typeof ApplicationShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Project: Story = {
  render: (args) => (
    <ApplicationShell {...args}>
      <div className="grid gap-8">
        <PageHeader
          actions={(
            <Button size="small">
              <Plus aria-hidden="true" className="h-4 w-4" />
              New session
            </Button>
          )}
          breadcrumbs={[
            { href: "/projects", label: "Projects" },
            { href: `/projects/${alphaProject.id}/overview`, label: alphaProject.name },
            { label: "Sessions" },
          ]}
          description="Organize interviews, usability tests, and working sessions in this project."
          title="Sessions"
        />
        <EntityCollection countLabel="0 sessions" title="Sessions">
          <EmptyState
            description="Create a session to organize participants and transcripts."
            primaryAction={<Button size="small">New session</Button>}
            title="No sessions yet"
          />
        </EntityCollection>
      </div>
    </ApplicationShell>
  ),
};

export const Workspace: Story = {
  args: { context: "workspace", project: undefined, activeProjectItem: undefined },
  render: (args) => (
    <ApplicationShell {...args}>
      <PageHeader description="Create and organize UX research projects." title="Projects" />
    </ApplicationShell>
  ),
};

export const WorkspaceRecords: Story = {
  args: {
    activeGlobalItem: "records",
    activeGlobalSubItem: "record-1",
    context: "workspace",
    project: undefined,
    activeProjectItem: undefined,
  },
  render: (args) => (
    <ApplicationShell {...args}>
      <PageHeader
        description="Review record-level research synthesis across related sessions."
        title="Medicare Fraud Documenter"
      />
    </ApplicationShell>
  ),
};

export const ProjectSearchReservedForV3: Story = {
  args: { showProjectSearch: true },
  render: (args) => (
    <ApplicationShell {...args}>
      <PageHeader
        description="The project search control is implemented but hidden by default for V2."
        title="Project search reserved for V3"
      />
    </ApplicationShell>
  ),
};
