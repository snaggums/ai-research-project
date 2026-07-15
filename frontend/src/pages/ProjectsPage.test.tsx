import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { Project } from "@/api/types";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { API_BASE_URL, server } from "@/test/server";
import { renderWithProviders } from "@/test/render";


const project: Project = {
  id: "00000000-0000-0000-0000-000000000010",
  name: "Checkout usability study",
  description: "Research on the checkout experience",
  created_at: "2026-07-10T12:00:00Z",
  updated_at: "2026-07-10T12:00:00Z",
};

describe("ProjectsPage", () => {
  it("shows a loading state while projects are being fetched", async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, async () => {
        await delay(250);
        return HttpResponse.json([]);
      }),
    );

    renderWithProviders(<ProjectsPage />);

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
    expect(await screen.findByRole("combobox", { name: "Embedding provider" })).toHaveTextContent("mock");
  });

  it("shows the empty state when no projects exist", async () => {
    renderWithProviders(<ProjectsPage />);

    expect(
      await screen.findByText("No projects yet. Create one to begin the research workflow."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 total")).toBeInTheDocument();
  });

  it("shows an actionable error when projects cannot be loaded", async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () =>
        HttpResponse.json({ detail: "Service unavailable" }, { status: 503 }),
      ),
    );

    renderWithProviders(<ProjectsPage />);

    expect(
      await screen.findByText("Could not load projects. Confirm the backend is running at the configured API URL."),
    ).toBeInTheDocument();
  });

  it("creates a project and refreshes the project list", async () => {
    const projects: Project[] = [];
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json(projects)),
      http.post(`${API_BASE_URL}/projects`, async ({ request }) => {
        const payload = (await request.json()) as { name: string; description: string | null };
        const created = { ...project, ...payload };
        projects.push(created);
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    await screen.findByText("No projects yet. Create one to begin the research workflow.");
    await user.type(screen.getByLabelText("Project name"), project.name);
    await user.type(screen.getByLabelText("Description"), project.description ?? "");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    const projectHeading = await screen.findByRole("heading", { name: project.name });
    const projectCard = projectHeading.closest("article");
    expect(projectCard).not.toBeNull();
    expect(within(projectCard as HTMLElement).getByText(project.description ?? "")).toBeInTheDocument();
    expect(screen.getByText("1 total")).toBeInTheDocument();
    expect(projects).toHaveLength(1);
  });
});
