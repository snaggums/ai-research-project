import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectCard } from "@/components/research/project-card";
import { ProjectForm } from "@/components/research/project-form";
import { ProjectSummary } from "@/components/research/project-summary";
import { ProjectWorkflowSummary } from "@/components/research/project-workflow-summary";
import { checkoutResearchProject } from "@/mocks/fixtures/domain";
import { projectWorkflowAt } from "@/mocks/fixtures/project";

describe("ProjectCard", () => {
  it("has one primary project link and separate menu actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ProjectCard
        href="/projects/checkout/overview"
        onEdit={onEdit}
        project={checkoutResearchProject}
      />,
    );

    expect(screen.getByRole("link", { name: "Open project" })).toHaveAttribute("href", "/projects/checkout/overview");
    await user.click(screen.getByRole("button", { name: `Actions for ${checkoutResearchProject.name}` }));
    await user.click(screen.getByRole("menuitem", { name: "Edit project" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});

describe("ProjectForm", () => {
  it("validates required data before submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm mode="create" onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(await screen.findByText("Enter a project name.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("normalizes and submits project values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm mode="create" onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox", { name: /Project name/ }), "  Alpha Project  ");
    await user.type(screen.getByRole("textbox", { name: /Description/ }), "  Checkout research  ");
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(onSubmit).toHaveBeenCalledWith(
      { name: "Alpha Project", description: "Checkout research" },
      expect.anything(),
    );
  });

  it("preserves values and exposes request failures", () => {
    render(
      <ProjectForm
        defaultValues={{ name: checkoutResearchProject.name, description: checkoutResearchProject.description }}
        mode="edit"
        onSubmit={() => undefined}
        submitError="Check your connection and try again."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Project could not be saved");
    expect(screen.getByRole("textbox", { name: /Project name/ })).toHaveValue(checkoutResearchProject.name);
  });
});

describe("ProjectSummary", () => {
  it("derives the empty project recommendation", () => {
    render(
      <ProjectSummary
        project={{ ...checkoutResearchProject, participantCount: 0, sessionCount: 0, readyTranscriptCount: 0 }}
      />,
    );
    expect(screen.getByText("No participants added")).toBeInTheDocument();
    expect(screen.getByText("No sessions created")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create first session" })).toBeInTheDocument();
  });
});

describe("ProjectWorkflowSummary", () => {
  it("derives progress and the current action from step data", () => {
    render(
      <ProjectWorkflowSummary
        completionAction={{ href: "#sessions", label: "View sessions" }}
        steps={projectWorkflowAt(2)}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "Project setup progress" })).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByRole("link", { name: "Add session" })).toHaveAttribute("href", "#sessions");
    expect(screen.getAllByText("Complete")).toHaveLength(2);
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("uses the completion action when every step is complete", () => {
    render(
      <ProjectWorkflowSummary
        completionAction={{ href: "#sessions", label: "View sessions" }}
        steps={projectWorkflowAt(4)}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("link", { name: "View sessions" })).toBeInTheDocument();
  });
});

