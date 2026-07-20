import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { delay, http, HttpResponse } from "msw";

import { appRoutes } from "@/app/router";
import { AppProviders } from "@/app/providers";
import { API_BASE_URL, server } from "@/test/server";
import { participantApiFixtures } from "@/mocks/fixtures/participants";

describe("application router foundation", () => {
  const projectResponse = {
    id: "alpha-project",
    name: "Alpha Project",
    description: "Understand the checkout experience.",
    participant_count: 2,
    session_count: 1,
    ready_transcript_count: 1,
    created_at: "2026-07-10T12:00:00Z",
    updated_at: "2026-07-12T12:00:00Z",
  };
  it("composes the Transcript workspace inside the Session route", async () => {
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/transcript"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Mobile checkout usability test" })).toBeInTheDocument();
    const sessionNavigation = screen.getByRole("navigation", { name: "Session sections" });
    expect(within(sessionNavigation).getByRole("link", { name: "Transcript" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("searchbox", { name: "Search this transcript" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search Alpha Project" })).not.toBeInTheDocument();
  });

  it("opens a retrieved excerpt in the Transcript context route", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/transcript"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    const search = await screen.findByRole("searchbox", { name: "Search this transcript" });
    await user.type(search, "navigation confusion");
    await user.click(screen.getByRole("button", { name: "Search transcript" }));
    await user.click((await screen.findAllByRole("link", { name: "Open transcript context" }))[0]);

    expect(await screen.findByRole("heading", { level: 1, name: "Transcript context" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/mobile-checkout-test/documents/checkout-transcript");
    expect(router.state.location.search).toBe("?result=result-1");
  });

  it("redirects the application root to Projects", async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects");
  });

  it("loads a Project Overview through the normalized transport adapter", async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])),
    );
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/overview"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Alpha Project" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Project navigation" })).toBeInTheDocument();
    expect(screen.getByText("2", { selector: ".text-3xl" })).toBeInTheDocument();
    expect(screen.getByText("1", { selector: ".text-3xl" })).toBeInTheDocument();
    expect(screen.getAllByText("Complete")).toHaveLength(4);
  });

  it("links the current Project setup action to the Participant form", async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([{
        ...projectResponse,
        participant_count: 0,
        session_count: 0,
        ready_transcript_count: 0,
      }])),
    );
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/overview"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("link", { name: "Add participants" })).toHaveAttribute(
      "href",
      "/projects/alpha-project/participants/new",
    );
  });

  it("returns to the Projects collection after saving an edit initiated from its card menu", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])),
      http.patch(`${API_BASE_URL}/projects/:projectId`, async ({ params, request }) => {
        const payload = await request.json() as { name: string; description: string | null };
        return HttpResponse.json({
          ...projectResponse,
          id: String(params.projectId),
          name: payload.name,
          description: payload.description,
        });
      }),
    );
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    await user.click(await screen.findByRole("button", { name: "Actions for Alpha Project" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit project" }));
    expect(router.state.location.pathname).toBe("/projects/alpha-project/edit");
    expect(new URLSearchParams(router.state.location.search).get("returnTo")).toBe("/projects");

    const name = await screen.findByRole("textbox", { name: /Project name/ });
    await user.clear(name);
    await user.type(name, "Updated Alpha Project");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/projects"));
    expect(router.state.location.search).toBe("");
  });

  it("loads the Participant collection and navigates from its direct edit action", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/participants"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Participants" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Project sections" })).getByRole("link", { name: "Ask this project" })).toHaveAttribute("href", "/projects/alpha-project/ask");
    expect(await screen.findByRole("link", { name: "Open Alex Morgan" })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Edit Alex Morgan" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Participant Details" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/participants/alex-morgan");
  });

  it("adds a Participant with one submission and returns to the collection", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/participants/new"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    await user.type(await screen.findByRole("textbox", { name: /First name/ }), "Taylor");
    await user.type(screen.getByRole("textbox", { name: /Last name/ }), "Reed");
    await user.click(screen.getByRole("button", { name: "Add participant" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Participants" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/participants");
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });

  it("updates Participant Detail through the API contract and returns to the collection", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/participants/alex-morgan"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    const firstName = await screen.findByRole("textbox", { name: /First name/ });
    await user.clear(firstName);
    await user.type(firstName, "Alexa");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Participants" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Open Alexa Morgan" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/participants");
  });

  it("loads AI settings without marking Projects as the current global destination", async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/settings/ai"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { name: "AI provider settings" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Projects" })[0]).not.toHaveAttribute("aria-current");
  });

  it("loads the Sessions Collection through the Project-scoped API contract", async () => {
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("heading", { level: 1, name: "Sessions" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Project sections" })).getByRole("link", { name: "Ask this project" })).toHaveAttribute("href", "/projects/alpha-project/ask");
    expect((await screen.findAllByRole("link", { name: "Open session" }))[0]).toHaveAttribute("href", "/projects/alpha-project/sessions/mobile-checkout-test/overview");
    expect(screen.getByRole("navigation", { name: "Project navigation" })).toBeInTheDocument();
  });

  it("opens Edit session from a Session collection row", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    await user.click((await screen.findAllByRole("button", { name: "Edit session" }))[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Edit session" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/mobile-checkout-test/edit");
  });

  it("opens Edit session from the Session workspace header", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/overview"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    await user.click(await screen.findByRole("button", { name: "Edit session" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Edit session" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/mobile-checkout-test/edit");
  });

  it("deletes a Session from the collection after destructive confirmation", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    await user.click((await screen.findAllByRole("button", { name: "Delete session" }))[0]);
    const dialog = screen.getByRole("dialog", { name: "Delete session?" });
    await user.click(within(dialog).getByRole("button", { name: "Delete session" }));
    await waitFor(() => expect(screen.queryByRole("heading", { level: 3, name: "Mobile checkout usability test" })).not.toBeInTheDocument());
  });

  it("edits a Session participant and returns to the Session Participants tab", async () => {
    const user = userEvent.setup();
    let participantDetailReads = 0;
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])),
      http.get(`${API_BASE_URL}/projects/:projectId/participants/:participantId`, async ({ params }) => {
        participantDetailReads += 1;
        if (participantDetailReads > 1) await delay(3_000);
        const participant = participantApiFixtures.find((value) =>
          value.project_id === String(params.projectId) && value.id === String(params.participantId),
        );
        return participant
          ? HttpResponse.json(participant)
          : new HttpResponse("Participant not found", { status: 404 });
      }),
    );
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/checkout-interview/participants"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("heading", { level: 1, name: "Checkout workflow interview" })).toBeInTheDocument();
    const sessionNavigation = screen.getByRole("navigation", { name: "Session sections" });
    expect(within(sessionNavigation).getByRole("link", { name: "Participants" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Session participants" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Processing status" })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /Edit participant:/ })[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Participant Details" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/participants/alex-morgan");
    expect(router.state.location.search).toContain("returnTo=");
    const firstName = screen.getByRole("textbox", { name: /First name/ });
    await user.clear(firstName);
    await user.type(firstName, "Alexa");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("heading", { name: "Session participants" })).toBeInTheDocument();
    expect(await screen.findAllByText("Alexa Morgan")).not.toHaveLength(0);
    expect(participantDetailReads).toBe(1);
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/checkout-interview/participants");
    expect(within(screen.getByRole("navigation", { name: "Session sections" })).getByRole("link", { name: "Participants" })).toHaveAttribute("aria-current", "page");
  });

  it("adds a participant from a Session and returns to that Session Participants tab", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/checkout-interview/participants"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    await user.click(await screen.findByRole("button", { name: "Add participant" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Add participant" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /First name/ }), "Taylor");
    await user.type(screen.getByRole("textbox", { name: /Last name/ }), "Reed");
    await user.click(screen.getByRole("button", { name: "Add participant" }));
    expect(await screen.findByRole("heading", { name: "Session participants" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/checkout-interview/participants");
    expect(within(screen.getByRole("navigation", { name: "Session sections" })).getByRole("link", { name: "Participants" })).toHaveAttribute("aria-current", "page");
  });

  it("loads the Session Themes workspace and opens evidence review", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/themes"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    const navigation = await screen.findByRole("navigation", { name: "Session sections" });
    expect(within(navigation).getByRole("link", { name: "Themes" })).toHaveAttribute("aria-current", "page");
    await user.click((await screen.findAllByRole("button", { name: "Review theme" }))[0]);
    expect(await screen.findByRole("heading", { name: "Theme evidence" })).toBeInTheDocument();
  });

  it("loads the canonical Session Report sections", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/report"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("heading", { name: "Session Report" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Key Insights" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const editDialog = await screen.findByRole("dialog", { name: "Edit report item" });
    expect(editDialog).toBeInTheDocument();
    const summary = within(editDialog).getAllByRole("textbox")[1];
    await user.clear(summary);
    await user.type(summary, "Updated by the researcher during report review.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Updated by the researcher during report review.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Open evidence" })[0]);
    expect(await screen.findByRole("heading", { level: 2, name: "Evidence" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/mobile-checkout-test/report");
    expect(within(screen.getByRole("navigation", { name: "Session sections" })).getByRole("link", { name: "Session Report" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Back to Session Report" }));
    expect(await screen.findByRole("heading", { name: "Session Report" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/mobile-checkout-test/report");
  });

  it("loads the workspace Record catalog and follows the Record synthesis workflow", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/records"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Records" })).toBeInTheDocument();
    const globalNavigation = screen.getByRole("navigation", { name: "Global navigation" });
    expect(within(globalNavigation).getByRole("link", { name: "Records" })).toHaveAttribute("aria-current", "page");
    expect(within(globalNavigation).getByRole("link", { name: "Record 1" })).not.toHaveAttribute("aria-current");
    await user.click(await screen.findByRole("link", { name: "Open Record 1" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Record 1" })).toBeInTheDocument();
    expect(within(globalNavigation).getByRole("link", { name: "Record 1" })).toHaveAttribute("aria-current", "page");
      await user.click(screen.getByRole("button", { name: "Review synthesis" }));
      expect(await screen.findByRole("heading", { level: 1, name: "Record 1 synthesis" })).toBeInTheDocument();
      await user.click((await screen.findAllByRole("button", { name: "Mark reviewed" }))[0]);
      expect(await screen.findAllByText("Researcher Reviewed")).not.toHaveLength(0);
      await user.click((await screen.findAllByRole("button", { name: /Open evidence/ }))[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Synthesis evidence" })).toBeInTheDocument();
    expect(router.state.location.pathname).toContain("/records/record-1/synthesis/items/");
  });

  it("asks a Session-scoped question and renders cited transcript context", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/ask"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    await user.click(await screen.findByRole("button", { name: "What caused participants to lose confidence during checkout?" }));
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByRole("heading", { name: "AIR answer" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open transcript context/ })).toHaveLength(2);
  });
});
