import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { delay, http, HttpResponse } from "msw";

import { createAppQueryClient } from "@/app/query-client";
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
    const projectNavigation = screen.getByRole("navigation", { name: "Project navigation" });
    expect(within(projectNavigation).getByRole("button", { name: "Collapse Sessions" })).toHaveAttribute("aria-expanded", "true");
    expect(await within(projectNavigation).findByRole("link", { name: "Mobile checkout usability test" })).toHaveAttribute("aria-current", "page");
    expect(within(projectNavigation).getByRole("link", { name: "Records, 3 items" })).toHaveAttribute("href", "/projects/alpha-project/records");
    expect(await screen.findByRole("searchbox", { name: "Search this transcript" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Transcript coding" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suggestions awaiting review" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search Alpha Project" })).not.toBeInTheDocument();
  });

  it("confirms linked evidence and returns to upload after preserving a deleted Transcript", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/transcript"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    const deleteButton = await screen.findByRole("button", { name: "Delete transcript" });
    await waitFor(() => expect(deleteButton).toBeEnabled());
    await user.click(deleteButton);

    const dialog = screen.getByRole("dialog", { name: "Delete transcript with linked evidence?" });
    expect(within(dialog).getByText("accepted Highlights")).toBeInTheDocument();
    expect(within(dialog).getByText("3")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete transcript" }));

    expect(await screen.findByRole("heading", { name: "Upload transcript" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transcript history" })).toBeInTheDocument();
    expect(screen.getByText("Removed transcript")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View transcript" })).toBeInTheDocument();
  });

  it("persists Transcript Coding highlights and suggestion review in the live Session route", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/transcript"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { name: "Transcript coding" })).toBeInTheDocument();

    const suggestion = screen
      .getByRole("button", { name: /Navigation terminology Labels for uploaded research/ })
      .closest("article");
    if (!suggestion) throw new Error("Expected the Navigation terminology suggestion card.");
    await user.click(within(suggestion).getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Suggestions" })).toHaveTextContent("(1)");
      expect(screen.getByRole("tab", { name: "Uncoded highlights" })).toHaveTextContent("(0)");
    });

    await user.click(screen.getByText("Where would you expect to find uploaded research after a session?"));
    await user.click(screen.getByRole("button", { name: "Highlight" }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Uncoded highlights" })).toHaveTextContent("(1)");
    });

    await user.click(screen.getByRole("button", { name: "Apply code" }));
    await user.click(screen.getByRole("option", { name: /Navigation terminology/ }));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Uncoded highlights" })).toHaveTextContent("(0)");
      expect(screen.getByRole("heading", { name: "Accepted highlights" })).toBeInTheDocument();
    });

    await act(() => router.navigate("/projects/alpha-project/sessions/mobile-checkout-test/overview"));
    await screen.findByRole("link", { name: "Transcript" });
    await act(() => router.navigate("/projects/alpha-project/sessions/mobile-checkout-test/transcript"));

    expect(await screen.findByRole("heading", { name: "Transcript coding" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Suggestions" })).toHaveTextContent("(1)");
      expect(screen.getByRole("tab", { name: "Uncoded highlights" })).toHaveTextContent("(0)");
    });
  });

  it("persists Transcript Coding view and status controls in route search parameters", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/transcript"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { name: "Transcript coding" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Highlight list" }));
    expect(router.state.location.search).toContain("view=list");

    await user.click(screen.getByRole("tab", { name: "Uncoded highlights" }));
    expect(router.state.location.search).toContain("panel=accepted");
    expect(router.state.location.search).toContain("highlight_status=uncoded");

    await act(() => router.navigate(-1));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Suggestions" })).toHaveAttribute("aria-selected", "true");
    });
    expect(router.state.location.search).toContain("view=list");
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

  it("opens Edit session from the Session summary strip", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/overview"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    const summary = await screen.findByRole("region", { name: "Session summary" });
    await user.click(within(summary).getByRole("button", { name: "Edit session" }));
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

  it("removes a participant from the Session while preserving the Project participant", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/checkout-interview/participants"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    const removeActions = await screen.findAllByRole("button", { name: "Remove participant from Session: Alex Morgan" });
    await user.click(removeActions[0]);
    const dialog = screen.getByRole("dialog", { name: "Remove participant from Session?" });
    expect(within(dialog).getByText(/remain in Project participants/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Remove participant" }));

    await waitFor(() => {
      expect(screen.queryAllByRole("button", { name: "Remove participant from Session: Alex Morgan" })).toHaveLength(0);
    });
    expect(screen.getByText("0 participants")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add participant" }));
    const participantSelect = await screen.findByRole("combobox", { name: "Project participant" });
    await user.click(participantSelect);
    expect(screen.getByRole("option", { name: "Alex Morgan" })).toBeInTheDocument();
  });

  it("keeps the participant assigned and shows feedback when Session removal fails", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])),
      http.patch(`${API_BASE_URL}/projects/:projectId/sessions/:sessionId`, () =>
        HttpResponse.json({ detail: "The Session could not be updated." }, { status: 500 }),
      ),
    );
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/checkout-interview/participants"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    await user.click((await screen.findAllByRole("button", { name: "Remove participant from Session: Alex Morgan" }))[0]);
    await user.click(within(screen.getByRole("dialog", { name: "Remove participant from Session?" })).getByRole("button", { name: "Remove participant" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Participant could not be removed");
    expect(screen.getAllByRole("button", { name: "Remove participant from Session: Alex Morgan" })).not.toHaveLength(0);
    expect(screen.getByText("1 participants")).toBeInTheDocument();
  });

  it("adds a participant from a Session and returns to that Session Participants tab", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/checkout-interview/participants"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    await user.click(await screen.findByRole("button", { name: "Add participant" }));
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/checkout-interview/participants/new");
    expect(await screen.findByRole("heading", { level: 1, name: "Checkout workflow interview" })).toBeInTheDocument();
    const projectNavigation = screen.getByRole("navigation", { name: "Project navigation" });
    expect(within(projectNavigation).getByRole("button", { name: "Collapse Sessions" })).toHaveAttribute("aria-expanded", "true");
    expect(within(projectNavigation).getByRole("link", { name: "Checkout workflow interview" })).toHaveAttribute("aria-current", "page");
    expect(
      within(screen.getByRole("navigation", { name: "Session sections" }))
        .getByRole("link", { name: "Participants" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 2, name: "Add participant" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Add an existing participant" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Project participant" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /First name/ }), "Taylor");
    await user.type(screen.getByRole("textbox", { name: /Last name/ }), "Reed");
    await user.click(screen.getByRole("button", { name: "Add participant" }));
    expect(await screen.findByRole("heading", { name: "Session participants" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/checkout-interview/participants");
    expect(within(screen.getByRole("navigation", { name: "Session sections" })).getByRole("link", { name: "Participants" })).toHaveAttribute("aria-current", "page");
  });

  it("redirects the legacy Session returnTo participant URL to the Session-owned route", async () => {
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const legacyReturnTo = encodeURIComponent("/projects/alpha-project/sessions/checkout-interview/participants");
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [`/projects/alpha-project/participants/new?returnTo=${legacyReturnTo}`],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 2, name: "Add participant" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/checkout-interview/participants/new");
    expect(router.state.location.search).toBe("");
  });

  it("assigns an eligible Project participant from a Session and excludes existing Session participants", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/sessions/checkout-interview/participants"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    await user.click(await screen.findByRole("button", { name: "Add participant" }));
    const participantSelect = await screen.findByRole("combobox", { name: "Project participant" });
    await user.click(participantSelect);

    expect(screen.queryByRole("option", { name: "Alex Morgan" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("listbox", { name: "Project participant" }))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Riley Chen", "Samir Kaur", "Jordan Lee"]);
    await user.type(participantSelect, "samir");
    expect(within(screen.getByRole("listbox", { name: "Project participant" })).getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "Samir Kaur" }));
    expect(participantSelect).toHaveValue("Samir Kaur");
    expect(screen.getByRole("textbox", { name: /First name/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Add participant" }));

    expect(await screen.findByRole("heading", { name: "Session participants" })).toBeInTheDocument();
    expect(await screen.findAllByText("Samir Kaur")).not.toHaveLength(0);
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/checkout-interview/participants");
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
    await user.click(screen.getByRole("button", { name: "Use a persistent progress indicator" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const editDialog = await screen.findByRole("dialog", { name: "Edit report item" });
    expect(editDialog).toBeInTheDocument();
    const summary = within(editDialog).getAllByRole("textbox")[1];
    await user.clear(summary);
    await user.type(summary, "Updated by the researcher during report review.");
    await user.click(within(editDialog).getByRole("combobox", { name: "Decision maker (required)" }));
    await user.click(screen.getByRole("option", { name: "Alex Morgan" }));
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
    expect(within(globalNavigation).getByRole("link", { name: "Medicare Fraud Documenter" })).not.toHaveAttribute("aria-current");
    await user.click(await screen.findByRole("link", { name: "Open Medicare Fraud Documenter" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Medicare Fraud Documenter" })).toBeInTheDocument();
    expect(within(globalNavigation).getByRole("link", { name: "Medicare Fraud Documenter" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("tab", { name: "Knowledge" }));
    expect(new URLSearchParams(router.state.location.search).get("view")).toBe("knowledge");
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "knowledge");
    expect(await screen.findByText("3 items")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Requirements" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    expect(router.state.location.search).toBe("");
    await user.click(screen.getByRole("button", { name: "Review synthesis" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Medicare Fraud Documenter synthesis" })).toBeInTheDocument();
    await user.click((await screen.findAllByRole("button", { name: "Mark reviewed" }))[0]);
    expect(await screen.findAllByText("Researcher Reviewed")).not.toHaveLength(0);
    await user.click((await screen.findAllByRole("button", { name: /Open evidence/ }))[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Synthesis evidence" })).toBeInTheDocument();
    expect(router.state.location.pathname).toContain("/records/record-1/synthesis/items/");
  });

  it("preserves Project navigation when opening a Record from a Project", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/records"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Records" })).toBeInTheDocument();
    const projectNavigation = screen.getByRole("navigation", { name: "Project navigation" });
    expect(await within(projectNavigation).findByRole("link", { name: "Records, 3 items" })).toHaveAttribute("aria-current", "page");
    expect(within(projectNavigation).getByRole("button", { name: "Expand Records" })).toHaveAttribute("aria-expanded", "false");

    await user.click(await screen.findByRole("link", { name: "Open Medicare Fraud Documenter" }));

    expect(router.state.location.pathname).toBe("/projects/alpha-project/records/record-1");
    expect(await within(projectNavigation).findByRole("link", { name: "Medicare Fraud Documenter" })).toHaveAttribute("aria-current", "page");
    expect(within(projectNavigation).getByRole("button", { name: "Collapse Records" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the Record shell available when Knowledge cannot load", async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/records/record-1/synthesis/latest`,
        () => HttpResponse.json({ detail: "Knowledge is temporarily unavailable." }, { status: 500 }),
      ),
    );
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/records/record-1?view=knowledge"],
    });
    const queryClient = createAppQueryClient();
    queryClient.setDefaultOptions({
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    });
    render(<AppProviders queryClient={queryClient}><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Medicare Fraud Documenter" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Knowledge" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Requirements could not be loaded")).toBeInTheDocument();
    expect(screen.getByText("Decisions could not be loaded")).toBeInTheDocument();
    expect(screen.getByText("Action items could not be loaded")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(3);
    expect(screen.queryByText("Checkout must confirm payment success")).not.toBeInTheDocument();
  });

  it("keeps one active Ask Record thread and opens primary transcript evidence", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/records/record-1?view=ask-record"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(
      await screen.findByRole("heading", { name: "Ask Medicare Fraud Documenter" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ask Record" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(new URLSearchParams(router.state.location.search).get("view")).toBe(
      "ask-record",
    );

    await user.click(
      screen.getByRole("button", {
        name: "What prevents participants from feeling confident after checkout?",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByRole("heading", { name: "AIR answer" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Ask Record conversation" }))
        .getAllByRole("listitem"),
    ).toHaveLength(2);

    await user.click(
      screen.getByRole("button", {
        name: "Which requirements appear across multiple Sessions?",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => {
      expect(
        within(screen.getByRole("list", { name: "Ask Record conversation" }))
          .getAllByRole("listitem"),
      ).toHaveLength(4);
    });

    await user.click(
      screen.getAllByRole("link", {
        name: "Open transcript context for citation 1",
      })[0],
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Transcript context" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      "/projects/alpha-project/sessions/mobile-checkout-test/documents/checkout-transcript",
    );
    expect(router.state.location.search).toBe("?result=result-1");
  });

  it("shows the production Ask Record no-sources state without a composer", async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/records/record-2?view=ask-record"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(
      await screen.findByText("No searchable Record sources"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source availability" })).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.queryByRole("textbox", { name: "Ask Medicaid Fraud Documenter" })).not.toBeInTheDocument();
  });

  it("withholds an Ask Record conclusion when only partial evidence is returned", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/records/record-1?view=ask-record"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    const composer = await screen.findByRole("textbox", { name: "Ask Medicare Fraud Documenter" });
    await user.type(
      composer,
      "Did participants prefer biometric verification over one-time passcodes?",
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText("Not enough evidence")).toBeInTheDocument();
    expect(screen.getByText("No conclusion was generated.", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Partially relevant")).toBeInTheDocument();
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
