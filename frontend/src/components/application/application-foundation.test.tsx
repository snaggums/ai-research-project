import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil, Trash2 } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { ApplicationShell } from "@/components/application/application-shell";
import { DropdownMenu } from "@/components/application/dropdown-menu";
import { EntityCollection } from "@/components/application/entity-collection";
import { ErrorSummary } from "@/components/application/error-summary";
import { FileDropzone } from "@/components/application/file-dropzone";
import { PageHeader } from "@/components/application/page-header";
import { ProcessingStatus } from "@/components/application/processing-status";
import { SectionNavigation } from "@/components/application/section-navigation";
import { SharedRouteState } from "@/components/application/shared-route-state";

describe("ApplicationShell", () => {
  it("provides skip navigation and project destinations without showing V3 search", () => {
    render(
      <ApplicationShell
        activeProjectItem="sessions"
        context="project"
        project={{ id: "alpha-project", name: "Alpha Project" }}
      >
        <h1>Sessions</h1>
      </ApplicationShell>,
    );

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("link", { name: "Sessions, 0 items" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Records, 3 items" })).toHaveAttribute("href", "/projects/alpha-project/records");
    expect(screen.queryByRole("searchbox", { name: "Search Alpha Project" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings/ai");
    expect(screen.getByRole("banner").firstElementChild).toHaveClass("mx-auto", "max-w-[100rem]");
  });

  it("opens and closes mobile navigation with Escape", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationShell context="workspace"><div>Content</div></ApplicationShell>,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("complementary", { name: "Mobile navigation panel" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("complementary", { name: "Mobile navigation panel" })).not.toBeInTheDocument();
  });

  it("shows only Projects in Workspace navigation", () => {
    render(
      <ApplicationShell context="workspace">
        <div>Workspace content</div>
      </ApplicationShell>,
    );

    const navigation = screen.getByRole("navigation", { name: "Global navigation" });
    expect(within(navigation).getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).queryByRole("link", { name: "Records" })).not.toBeInTheDocument();
    expect(navigation).not.toHaveTextContent("Alpha Project");
  });
});

describe("DropdownMenu", () => {
  it("supports keyboard navigation, selection, and trigger focus restoration", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu
        items={[
          { id: "edit", label: "Edit project", icon: Pencil },
          { id: "delete", label: "Delete project", icon: Trash2, tone: "destructive" },
        ]}
        onSelect={onSelect}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open actions" });
    await user.click(trigger);
    const edit = screen.getByRole("menuitem", { name: "Edit project" });
    await waitFor(() => expect(edit).toHaveFocus());
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "delete" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes when focus remains elsewhere after an outside pointer interaction", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DropdownMenu items={[{ id: "edit", label: "Edit project" }]} onSelect={() => undefined} />
        <button type="button">Outside</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Open actions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("shared application support", () => {
  it("marks the selected section as the current page", () => {
    render(
      <SectionNavigation
        activeId="participants"
        items={[
          { id: "overview", label: "Overview", href: "#overview" },
          { id: "participants", label: "Participants", href: "#participants" },
        ]}
        label="Project sections"
      />,
    );
    expect(screen.getByRole("link", { name: "Participants" })).toHaveAttribute("aria-current", "page");
  });

  it("renders page hierarchy with a single heading", () => {
    render(
      <PageHeader
        breadcrumbs={[{ href: "/projects", label: "Projects" }, { label: "Participants" }]}
        description="Manage project participants."
        title="Participants"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Participants" })).toBeInTheDocument();
    expect(screen.getByText("Participants", { selector: "span[aria-current='page']" })).toBeInTheDocument();
  });

  it("shows deterministic collection states", () => {
    const { rerender } = render(<EntityCollection state="loading" title="Sessions" />);
    expect(screen.getByRole("status", { name: "Loading sessions" })).toBeInTheDocument();
    rerender(<EntityCollection state="no-results" title="Sessions" />);
    expect(screen.getByRole("heading", { name: "No matching results" })).toBeInTheDocument();
  });

  it("announces processing progress", () => {
    render(<ProcessingStatus progress={64} status="processing" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "64");
  });

  it("focuses an error summary and links to invalid fields", async () => {
    render(
      <>
        <ErrorSummary errors={[{ fieldId: "project-name", message: "Enter a project name" }]} />
        <input id="project-name" />
      </>,
    );
    const summary = screen.getByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByRole("link", { name: "Enter a project name" })).toHaveAttribute("href", "#project-name");
  });

  it("passes accepted files to the owning form", async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();
    const { container } = render(<FileDropzone onFilesSelected={onFilesSelected} />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["Transcript"], "interview.txt", { type: "text/plain" });
    await user.upload(input, file);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("renders recoverable route actions", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<SharedRouteState onRetry={onRetry} state="recoverable-error" />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Return to projects" })).toHaveAttribute("href", "/projects");
  });
});
