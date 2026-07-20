import axe from "axe-core";
import { render } from "@testing-library/react";

import {
  ApplicationShell,
  EntityCollection,
  MetadataList,
  PageHeader,
  ProcessingStatus,
  SectionNavigation,
} from "@/components/application";

describe("shared application foundation accessibility", () => {
  it("has no automated semantic violations in the representative project shell", async () => {
    const { container } = render(
      <ApplicationShell
        activeProjectItem="sessions"
        context="project"
        project={{ id: "alpha-project", name: "Alpha Project" }}
      >
        <div className="grid gap-6">
          <PageHeader
            breadcrumbs={[
              { href: "/projects", label: "Projects" },
              { href: "/projects/alpha-project/overview", label: "Alpha Project" },
              { label: "Sessions" },
            ]}
            description="Organize interviews, usability tests, and working sessions in this project."
            title="Sessions"
          />
          <SectionNavigation
            activeId="overview"
            items={[
              { id: "overview", label: "Overview", href: "#overview" },
              { id: "participants", label: "Participants", href: "#participants" },
            ]}
            label="Session sections"
          />
          <EntityCollection countLabel="1 session" title="Sessions">
            <div>
              <h2>Checkout workflow interview</h2>
              <ProcessingStatus progress={64} status="processing" />
              <MetadataList items={[{ label: "Session type", value: "Interview" }]} />
            </div>
          </EntityCollection>
        </div>
      </ApplicationShell>,
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

