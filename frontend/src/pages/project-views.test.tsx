import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { alphaProject, checkoutResearchProject } from "@/mocks/fixtures/domain";
import { projectWorkflowAt } from "@/mocks/fixtures/project";
import { mockAISettingsValues } from "@/mocks/fixtures/settings";
import { ProjectOverviewView, ProjectsIndexView, SettingsView } from "@/pages/project-views";

describe("ProjectsIndexView", () => {
  it("filters projects and provides a no-results state", async () => {
    const user = userEvent.setup();
    function Example() {
      const [search, setSearch] = React.useState("");
      return (
        <ProjectsIndexView
          onSearchChange={setSearch}
          projects={[alphaProject, checkoutResearchProject]}
          search={search}
        />
      );
    }
    render(<Example />);
    await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "does not exist");
    expect(screen.getByRole("heading", { name: "No matching results" })).toBeInTheDocument();
  });

  it("renders the explicit empty state", () => {
    render(<ProjectsIndexView onSearchChange={() => undefined} projects={[]} search="" state="empty" />);
    expect(screen.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
  });
});

describe("ProjectOverviewView", () => {
  it("keeps project identity consistent across the header and summary", () => {
    render(<ProjectOverviewView project={alphaProject} steps={projectWorkflowAt(1)} />);
    expect(screen.getAllByText("Alpha Project").length).toBeGreaterThan(1);
    expect(screen.getByRole("navigation", { name: "Project sections" })).toBeInTheDocument();
  });
});

describe("SettingsView", () => {
  it("renders the approved AI provider composition", () => {
    render(
      <SettingsView
        active="ai"
        aiSettingsProps={{
          initialValues: mockAISettingsValues,
          onSave: () => undefined,
          onTest: () => undefined,
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "AI provider settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AI provider settings" })).toHaveAttribute("aria-current", "page");
  });
});
