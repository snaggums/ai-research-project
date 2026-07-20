import axe from "axe-core";
import { render } from "@testing-library/react";

import { ApplicationShell } from "@/components/application";
import { alphaProject, checkoutResearchProject } from "@/mocks/fixtures/domain";
import { projectWorkflowAt } from "@/mocks/fixtures/project";
import { mockAISettingsValues } from "@/mocks/fixtures/settings";
import { ProjectOverviewView, ProjectsIndexView, SettingsView } from "@/pages/project-views";

describe("Project and settings page accessibility", () => {
  it("has no automated semantic violations in representative page states", async () => {
    const { container } = render(
      <ApplicationShell context="workspace">
        <ProjectsIndexView
          projects={[checkoutResearchProject, alphaProject]}
        />
      </ApplicationShell>,
    );
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });

  it("keeps overview and settings landmarks valid", async () => {
    const { container, rerender } = render(
      <ApplicationShell context="project" project={{ id: alphaProject.id, name: alphaProject.name }}>
        <ProjectOverviewView project={alphaProject} steps={projectWorkflowAt(2)} />
      </ApplicationShell>,
    );
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);

    rerender(
      <ApplicationShell context="workspace">
        <SettingsView
          active="ai"
          aiSettingsProps={{
            initialValues: mockAISettingsValues,
            onSave: () => undefined,
            onTest: () => undefined,
          }}
        />
      </ApplicationShell>,
    );
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });
});
