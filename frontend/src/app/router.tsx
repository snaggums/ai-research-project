import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";

import { ProjectsPage } from "@/pages/ProjectsPage";
import {
  ProjectFoundationPage,
  ProjectLayout,
  RootRedirect,
  RouteNotFoundPage,
  WorkspaceLayout,
} from "@/routes/route-layouts";
import {
  CreateProjectRoute,
  EditProjectRoute,
  ProjectOverviewRoute,
  ParticipantCreateRoute,
  ParticipantDetailRoute,
  ParticipantsCollectionRoute,
  ProjectsIndexRoute,
  SettingsAIRoute,
  SettingsProfileRoute,
  SessionCreateRoute,
  SessionDetailRoute,
  SessionEditRoute,
  SessionTranscriptRoute,
  SessionThemesRoute,
  SessionReportRoute,
  SessionAskRoute,
  SessionsCollectionRoute,
  TranscriptContextRoute,
} from "@/routes/project-routes";

export const appRoutes = [
  { path: "/", element: <RootRedirect /> },
  {
    element: <WorkspaceLayout />,
    errorElement: <RouteNotFoundPage />,
    children: [
      { path: "/projects", element: <ProjectsIndexRoute /> },
      { path: "/projects/new", element: <CreateProjectRoute /> },
      { path: "/projects/:projectId/edit", element: <EditProjectRoute /> },
      { path: "/settings/profile", element: <SettingsProfileRoute /> },
      { path: "/settings/ai", element: <SettingsAIRoute /> },
    ],
  },
  {
    path: "/projects/:projectId",
    element: <ProjectLayout />,
    errorElement: <RouteNotFoundPage />,
    children: [
      { index: true, element: <Navigate replace to="overview" /> },
      { path: "overview", element: <ProjectOverviewRoute /> },
      { path: "participants", element: <ParticipantsCollectionRoute /> },
      { path: "participants/new", element: <ParticipantCreateRoute /> },
      { path: "participants/:participantId", element: <ParticipantDetailRoute /> },
      { path: "sessions", element: <SessionsCollectionRoute /> },
      { path: "sessions/new", element: <SessionCreateRoute /> },
      { path: "sessions/:sessionId", element: <Navigate replace to="overview" /> },
      { path: "sessions/:sessionId/edit", element: <SessionEditRoute /> },
      { path: "sessions/:sessionId/overview", element: <SessionDetailRoute /> },
      { path: "sessions/:sessionId/participants", element: <SessionDetailRoute /> },
      { path: "sessions/:sessionId/transcript", element: <SessionTranscriptRoute /> },
      { path: "sessions/:sessionId/themes", element: <SessionThemesRoute /> },
      { path: "sessions/:sessionId/report", element: <SessionReportRoute /> },
      { path: "sessions/:sessionId/ask", element: <SessionAskRoute /> },
      { path: "sessions/:sessionId/:section", element: <ProjectFoundationPage /> },
      { path: "sessions/:sessionId/documents/:documentId", element: <TranscriptContextRoute /> },
      { path: "ask", element: <ProjectFoundationPage /> },
    ],
  },
  { path: "/legacy-v1", element: <ProjectsPage /> },
  { path: "*", element: <RouteNotFoundPage /> },
] satisfies RouteObject[];

export const appRouter = createBrowserRouter(appRoutes);
