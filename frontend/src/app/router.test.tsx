import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { appRoutes } from "@/app/router";
import { AppProviders } from "@/app/providers";
import { API_BASE_URL, server } from "@/test/server";

describe("application router foundation", () => {
  const projectResponse = {
    id: "alpha-project",
    name: "Alpha Project",
    description: "Understand the checkout experience.",
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
  });

  it("loads the Participant collection and navigates from its direct edit action", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/projects/alpha-project/participants"],
    });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);

    expect(await screen.findByRole("heading", { level: 1, name: "Participants" })).toBeInTheDocument();
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
    expect((await screen.findAllByRole("link", { name: "Open session" }))[0]).toHaveAttribute("href", "/projects/alpha-project/sessions/mobile-checkout-test/overview");
    expect(screen.getByRole("navigation", { name: "Project navigation" })).toBeInTheDocument();
  });

  it("loads Session Participants and opens membership editing", async () => {
    const user = userEvent.setup();
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/participants"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("heading", { level: 1, name: "Mobile checkout usability test" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit participants" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Edit session" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects/alpha-project/sessions/mobile-checkout-test/edit");
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
    server.use(http.get(`${API_BASE_URL}/projects`, () => HttpResponse.json([projectResponse])));
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/projects/alpha-project/sessions/mobile-checkout-test/report"] });
    render(<AppProviders><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("heading", { name: "Session Report" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Key Insights" })).toBeInTheDocument();
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
