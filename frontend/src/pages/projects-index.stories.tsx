import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { alphaProject, checkoutResearchProject } from "@/mocks/fixtures/domain";
import { ProjectsIndexView, type ProjectsIndexViewProps } from "@/pages/project-views";

const projects = [
  checkoutResearchProject,
  alphaProject,
  { ...alphaProject, id: "navigation-project", name: "Navigation research", description: "Understand navigation and wayfinding behavior." },
  { ...alphaProject, id: "onboarding-project", name: "Onboarding research", description: "Evaluate the first-run product experience." },
];

function ProjectsIndexStory(props: Omit<ProjectsIndexViewProps, "onSearchChange" | "search">) {
  const [search, setSearch] = React.useState("");
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell context="workspace">
        <ProjectsIndexView {...props} onSearchChange={setSearch} search={search} />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Projects/Projects Index",
  component: ProjectsIndexStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { projects, state: "ready" },
} satisfies Meta<typeof ProjectsIndexStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const Empty: Story = { args: { projects: [], state: "empty" } };
export const Error: Story = { args: { projects: [], state: "error" } };
