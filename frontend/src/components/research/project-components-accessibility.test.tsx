import axe from "axe-core";
import { render } from "@testing-library/react";

import { ProjectCard } from "@/components/research/project-card";
import { ProjectForm } from "@/components/research/project-form";
import { ProjectSummary } from "@/components/research/project-summary";
import { ProjectWorkflowSummary } from "@/components/research/project-workflow-summary";
import { checkoutResearchProject } from "@/mocks/fixtures/domain";
import { projectWorkflowAt } from "@/mocks/fixtures/project";

describe("Project components accessibility", () => {
  it("has no automated semantic violations in representative states", async () => {
    const { container } = render(
      <main className="grid gap-8">
        <ProjectCard href="#project" onDelete={() => undefined} onEdit={() => undefined} project={checkoutResearchProject} />
        <ProjectForm mode="create" onSubmit={() => undefined} />
        <ProjectSummary project={checkoutResearchProject} />
        <ProjectWorkflowSummary
          completionAction={{ href: "#sessions", label: "View sessions" }}
          steps={projectWorkflowAt(2)}
        />
      </main>,
    );

    const result = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });
    expect(result.violations).toEqual([]);
  });
});

