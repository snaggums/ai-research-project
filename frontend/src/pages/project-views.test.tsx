import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { alphaProject, checkoutResearchProject } from "@/mocks/fixtures/domain";
import { projectWorkflowAt } from "@/mocks/fixtures/project";
import { mockAISettingsValues } from "@/mocks/fixtures/settings";
import { ProjectOverviewView, ProjectsIndexView, SettingsView } from "@/pages/project-views";

describe("ProjectsIndexView", () => {
  it("shows all projects without the deferred global search control", () => {
    render(<ProjectsIndexView projects={[alphaProject, checkoutResearchProject]} />);
    expect(screen.getByText(alphaProject.name)).toBeInTheDocument();
    expect(screen.getByText(checkoutResearchProject.name)).toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search projects" })).not.toBeInTheDocument();
  });

  it("renders the explicit empty state", () => {
    render(<ProjectsIndexView projects={[]} state="empty" />);
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
