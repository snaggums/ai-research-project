import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import {
  ApplicationShell,
  PageHeader,
  SectionNavigation,
  SharedRouteState,
  type ProjectNavigationItem,
} from "@/components/application";
import { Button } from "@/components/ui/button";
import { alphaProject } from "@/mocks/fixtures/domain";
import { useProjects } from "@/hooks/useProjects";
import { useRecords } from "@/hooks/useRecords";
import { useSessions } from "@/hooks/useSessions";
import { projectNavigationItems } from "@/components/application/navigation-model";

const routeCopy: Record<string, { description: string; title: string }> = {
  "/projects": {
    title: "Projects",
    description: "Create and organize UX research projects.",
  },
  overview: {
    title: "Alpha Project",
    description: alphaProject.description ?? "Project overview",
  },
  participants: {
    title: "Participants",
    description: "Manage the people who take part in this project's research sessions.",
  },
  sessions: {
    title: "Sessions",
    description: "Organize interviews, usability tests, and working sessions in this project.",
  },
  ask: {
    title: "Ask this project",
    description: "Ask grounded questions across the project's research with source citations.",
  },
};

function activeProjectItem(pathname: string): ProjectNavigationItem {
  if (pathname.includes("/participants")) return "participants";
  if (pathname.includes("/sessions")) return "sessions";
  if (pathname.includes("/records")) return "records";
  if (pathname.includes("/ask")) return "ask-project";
  return "overview";
}

export function WorkspaceLayout() {
  const location = useLocation();
  const activeRecordId = location.pathname.match(/^\/records\/([^/]+)/)?.[1];
  const activeGlobalItem = location.pathname.startsWith("/records")
    ? "records"
    : location.pathname.startsWith("/settings")
      ? null
      : "projects";
  return (
    <ApplicationShell
      activeGlobalItem={activeGlobalItem}
      activeGlobalSubItem={activeRecordId}
      context="workspace"
    >
      <Outlet />
    </ApplicationShell>
  );
}

export function ProjectLayout() {
  const { projectId = alphaProject.id } = useParams();
  const location = useLocation();
  const projects = useProjects();
  const sessions = useSessions(projectId);
  const records = useRecords();
  const projectName = projects.data?.find((project) => project.id === projectId)?.name ?? alphaProject.name;
  const activeSessionId = location.pathname.match(/\/sessions\/([^/]+)/)?.[1];
  const activeRecordId = location.pathname.match(/\/records\/([^/]+)/)?.[1];
  const navigationEntries = projectNavigationItems(
    projectId,
    (sessions.data ?? []).map((session) => ({
      href: `/projects/${projectId}/sessions/${session.id}/overview`,
      id: session.id,
      label: session.title,
    })),
    records.data?.map((record) => ({
      href: `/projects/${projectId}/records/${record.id}`,
      id: record.id,
      label: record.name,
    })),
  );
  return (
    <ApplicationShell
      activeProjectChildId={activeSessionId ?? activeRecordId}
      activeProjectItem={activeProjectItem(location.pathname)}
      context="project"
      project={{ id: projectId, name: projectName }}
      projectNavigationEntries={navigationEntries}
      showProjectSearch={false}
    >
      <Outlet />
    </ApplicationShell>
  );
}

export function ProjectsFoundationPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        actions={<Button asChild><a href="/projects/new">Create project</a></Button>}
        description={routeCopy["/projects"].description}
        title={routeCopy["/projects"].title}
      />
      <div className="rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6">
        <h2 className="text-lg font-semibold">Shared application foundation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--air-color-text-secondary)]">
          The application shell and route boundaries are ready. Project collection content will be connected in implementation scope I2.
        </p>
        <Button asChild className="mt-4" size="small" variant="gray-subtle">
          <a href="/legacy-v1">Open temporary V1 workspace</a>
        </Button>
      </div>
    </div>
  );
}

export function ProjectFoundationPage() {
  const { projectId = alphaProject.id } = useParams();
  const location = useLocation();
  const section = activeProjectItem(location.pathname);
  const routeKey = section === "ask-project" ? "ask" : section;
  const copy = routeCopy[routeKey];
  const root = `/projects/${projectId}`;
  const sessionPath = location.pathname.includes("/sessions/");

  return (
    <div className="grid gap-6">
      <PageHeader
        breadcrumbs={[
          { href: "/projects", label: "Projects" },
          { href: `${root}/overview`, label: alphaProject.name },
          { label: copy.title },
        ]}
        description={copy.description}
        title={copy.title}
      />
      {sessionPath ? (
        <SectionNavigation
          activeId={location.pathname.split("/").at(-1) ?? "overview"}
          items={[
            { id: "overview", label: "Overview", href: `${location.pathname.replace(/\/(overview|participants|transcript|themes|report|ask)$/, "")}/overview` },
            { id: "participants", label: "Participants", href: `${location.pathname.replace(/\/(overview|participants|transcript|themes|report|ask)$/, "")}/participants` },
            { id: "transcript", label: "Transcript", href: `${location.pathname.replace(/\/(overview|participants|transcript|themes|report|ask)$/, "")}/transcript` },
            { id: "themes", label: "Themes", href: `${location.pathname.replace(/\/(overview|participants|transcript|themes|report|ask)$/, "")}/themes` },
            { id: "report", label: "Session Report", href: `${location.pathname.replace(/\/(overview|participants|transcript|themes|report|ask)$/, "")}/report` },
            { id: "ask", label: "Ask this session", href: `${location.pathname.replace(/\/(overview|participants|transcript|themes|report|ask)$/, "")}/ask` },
          ]}
          label="Session sections"
        />
      ) : null}
      <div className="rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6">
        <h2 className="text-lg font-semibold">Route foundation ready</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)]">
          This destination is reserved for its approved Storybook composition and live data integration.
        </p>
      </div>
    </div>
  );
}

export function RouteNotFoundPage() {
  return <SharedRouteState state="not-found" />;
}

export function RootRedirect() {
  return <Navigate replace to="/projects" />;
}
