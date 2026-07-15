import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import type { AISettingsPayload, Project } from "@/api/types";
import { toProjectSummary } from "@/adapters/projects";
import { toParticipantFormValues, toParticipantPayload, toParticipantSummary } from "@/adapters/participants";
import { ParticipantApiError } from "@/api/participants";
import { SessionApiError } from "@/api/sessions";
import { TranscriptApiError } from "@/api/transcripts";
import type { SessionFilters } from "@/api/types";
import { toSessionFormValues, toSessionPayload, toSessionSummary } from "@/adapters/sessions";
import { SharedRouteState } from "@/components/application";
import type { ProjectFormValues } from "@/components/research/project-form";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks/useProjects";
import {
  useCreateParticipant,
  useDeleteParticipant,
  useParticipant,
  useParticipants,
  useUpdateParticipant,
} from "@/hooks/useParticipants";
import { useAISettings, useTestAISettings, useUpdateAISettings } from "@/hooks/useSettings";
import { useCreateSession, useSession, useSessions, useUpdateSession } from "@/hooks/useSessions";
import { useDeleteTranscript, useRetryTranscript, useSessionTranscripts, useSetPrimaryTranscript, useTranscriptContext, useTranscriptSearch, useUploadTranscript } from "@/hooks/useTranscripts";
import { projectWorkflowAt } from "@/mocks/fixtures/project";
import {
  ProjectFormDialogView,
  ProjectOverviewView,
  ProjectsIndexView,
  SettingsView,
} from "@/pages/project-views";
import { ParticipantDetailView, ParticipantsCollectionView } from "@/pages/participant-views";
import { emptySessionFilters } from "@/pages/session-view-data";
import { SessionDetailView, SessionFormView, SessionsCollectionView } from "@/pages/session-views";
import { SessionTranscriptWorkspaceView, TranscriptContextView } from "@/pages/transcript-views";
import { toTranscriptContext, toTranscriptDocumentDetail, toTranscriptSearchResult } from "@/adapters/transcripts";
import { toSessionConversation, toSessionReport, toSessionTheme } from "@/adapters/synthesis";
import { recordOptions } from "@/mocks/fixtures/participants";
import { sessionCommonComponentOptions, sessionRecordOptions } from "@/mocks/fixtures/sessions";
import { suggestedSessionQuestions } from "@/mocks/fixtures/synthesis";
import { SynthesisApiError } from "@/api/synthesis";
import {
  useAskSession,
  useCreateSessionReportRevision,
  useGenerateSessionReport,
  useGenerateSessionThemes,
  useSessionConversation,
  useSessionReport,
  useSessionThemes,
  useUpdateSessionReportStatus,
  useUpdateSessionTheme,
} from "@/hooks/useSynthesis";
import { AskThisSessionWorkspaceView, SessionReportWorkspaceView, SessionThemesWorkspaceView } from "@/pages/synthesis-views";

const emptyAISettings: AISettingsPayload = {
  provider: "mock",
  model: "mock-chat",
  base_url: null,
  embedding_provider: "mock",
  embedding_model: "mock-hash-64",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function isNotFound(error: unknown) {
  return (error instanceof ParticipantApiError || error instanceof SessionApiError || error instanceof TranscriptApiError || error instanceof SynthesisApiError) && error.status === 404;
}

function participantName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function useProjectIndexModel() {
  const projects = useProjects();
  return {
    projects,
    summaries: React.useMemo(() => (projects.data ?? []).map(toProjectSummary), [projects.data]),
  };
}

function ProjectIndexContent({
  onEditProject,
}: {
  onEditProject?: (project: Project) => void;
}) {
  const navigate = useNavigate();
  const { projects, summaries } = useProjectIndexModel();
  const deleteProject = useDeleteProject();
  const [search, setSearch] = React.useState("");

  const transportById = React.useMemo(
    () => new Map((projects.data ?? []).map((project) => [project.id, project])),
    [projects.data],
  );

  return (
    <ProjectsIndexView
      onDeleteProject={(project) => {
        if (window.confirm(`Delete ${project.name}? This action cannot be undone.`)) {
          deleteProject.mutate(project.id);
        }
      }}
      onEditProject={onEditProject
        ? (project) => {
          const transport = transportById.get(project.id);
          if (transport) onEditProject(transport);
        }
        : (project) => navigate(`/projects/${project.id}/edit`)}
      onRetry={() => void projects.refetch()}
      onSearchChange={setSearch}
      projects={summaries}
      search={search}
      state={projects.isPending
        ? "loading"
        : projects.isError
          ? "error"
          : summaries.length
            ? "ready"
            : "empty"}
    />
  );
}

export function ProjectsIndexRoute() {
  return <ProjectIndexContent />;
}

export function CreateProjectRoute() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  return (
    <>
      <ProjectIndexContent />
      <ProjectFormDialogView
        isSubmitting={createProject.isPending}
        mode="create"
        onCancel={() => navigate("/projects")}
        onSubmit={async (values) => {
          const project = await createProject.mutateAsync({
            name: values.name,
            description: values.description || null,
          });
          navigate(`/projects/${project.id}/overview`);
        }}
        submitError={createProject.error ? errorMessage(createProject.error) : undefined}
      />
    </>
  );
}

export function EditProjectRoute() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const { projects } = useProjectIndexModel();
  const updateProject = useUpdateProject();
  const project = projects.data?.find((item) => item.id === projectId);

  if (projects.isPending) return <SharedRouteState state="loading" />;
  if (projects.isError) return <SharedRouteState onRetry={() => void projects.refetch()} state="recoverable-error" />;
  if (!project) return <SharedRouteState state="not-found" />;

  const defaultValues: ProjectFormValues = {
    name: project.name,
    description: project.description ?? "",
  };

  return (
    <>
      <ProjectIndexContent />
      <ProjectFormDialogView
        defaultValues={defaultValues}
        isSubmitting={updateProject.isPending}
        mode="edit"
        onCancel={() => navigate(`/projects/${project.id}/overview`)}
        onSubmit={async (values) => {
          await updateProject.mutateAsync({
            projectId: project.id,
            payload: { name: values.name, description: values.description || null },
          });
          navigate(`/projects/${project.id}/overview`);
        }}
        submitError={updateProject.error ? errorMessage(updateProject.error) : undefined}
      />
    </>
  );
}

export function ProjectOverviewRoute() {
  const { projectId = "" } = useParams();
  const { projects } = useProjectIndexModel();
  const project = projects.data?.find((item) => item.id === projectId);

  if (projects.isPending) return <SharedRouteState state="loading" />;
  if (projects.isError) return <SharedRouteState onRetry={() => void projects.refetch()} state="recoverable-error" />;
  if (!project) return <SharedRouteState state="not-found" />;

  return <ProjectOverviewView project={toProjectSummary(project)} steps={projectWorkflowAt(1)} />;
}

export function ParticipantsCollectionRoute() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const projects = useProjects();
  const [search, setSearch] = React.useState("");
  const participants = useParticipants(projectId, search);
  const deleteParticipant = useDeleteParticipant(projectId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summaries = React.useMemo(
    () => (participants.data ?? []).map(toParticipantSummary),
    [participants.data],
  );
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const state = projectMissing || isNotFound(participants.error)
    ? "not-found"
    : participants.isPending
      ? "loading"
      : participants.isError
        ? "error"
        : summaries.length
          ? "ready"
          : search.trim()
            ? "ready"
            : "empty";

  return (
    <ParticipantsCollectionView
      onDeleteParticipant={(participant) => {
        const name = participantName(participant.firstName, participant.lastName);
        if (window.confirm(`Delete ${name}? This removes the participant from this project and all session memberships. Sessions will remain.`)) {
          deleteParticipant.mutate(participant.id);
        }
      }}
      onEditParticipant={(participant) => navigate(`/projects/${projectId}/participants/${participant.id}`)}
      onRetry={() => void participants.refetch()}
      onSearchChange={setSearch}
      participants={summaries}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      search={search}
      state={state}
    />
  );
}

export function ParticipantCreateRoute() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const projects = useProjects();
  const createParticipant = useCreateParticipant(projectId);
  const project = projects.data?.find((item) => item.id === projectId);
  const routeState = projects.isPending
    ? "loading"
    : projects.isError
      ? "error"
      : project
        ? "ready"
        : "not-found";

  return (
    <ParticipantDetailView
      isSubmitting={createParticipant.isPending}
      mode="create"
      onCancel={() => navigate(`/projects/${projectId}/participants`)}
      onSubmit={async (values) => {
        await createParticipant.mutateAsync(toParticipantPayload(values));
        navigate(`/projects/${projectId}/participants`);
      }}
      onRetry={() => void projects.refetch()}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      recordOptions={recordOptions}
      routeState={routeState}
      submitError={createParticipant.error ? errorMessage(createParticipant.error) : undefined}
    />
  );
}

export function ParticipantDetailRoute() {
  const navigate = useNavigate();
  const { participantId = "", projectId = "" } = useParams();
  const projects = useProjects();
  const participant = useParticipant(projectId, participantId);
  const updateParticipant = useUpdateParticipant(projectId, participantId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = participant.data ? toParticipantSummary(participant.data) : undefined;
  const defaultValues = React.useMemo(
    () => participant.data ? toParticipantFormValues(participant.data) : undefined,
    [participant.data],
  );
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(participant.error)
    ? "not-found"
    : projects.isPending || participant.isPending
      ? "loading"
      : projects.isError || participant.isError
        ? "error"
        : "ready";

  return (
    <ParticipantDetailView
      defaultValues={defaultValues}
      isSubmitting={updateParticipant.isPending}
      mode="edit"
      onCancel={() => routeState === "error"
        ? void participant.refetch()
        : navigate(`/projects/${projectId}/participants`)}
      onSubmit={async (values) => {
        await updateParticipant.mutateAsync(toParticipantPayload(values));
        navigate(`/projects/${projectId}/participants`);
      }}
      onRetry={() => void participant.refetch()}
      participant={summary}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      recordOptions={recordOptions}
      routeState={routeState}
      submitError={updateParticipant.error ? errorMessage(updateParticipant.error) : undefined}
    />
  );
}

export function SessionsCollectionRoute() {
  const { projectId = "" } = useParams();
  const projects = useProjects();
  const [filters, setFilters] = React.useState<SessionFilters>(emptySessionFilters);
  const sessions = useSessions(projectId, filters);
  const project = projects.data?.find((item) => item.id === projectId);
  const summaries = React.useMemo(() => (sessions.data ?? []).map(toSessionSummary), [sessions.data]);
  const activeFilters = Object.values(filters).some(Boolean);
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const state = projectMissing || isNotFound(sessions.error) ? "not-found" : sessions.isPending ? "loading" : sessions.isError ? "error" : summaries.length ? "ready" : activeFilters ? "no-results" : "empty";
  return <SessionsCollectionView commonComponentOptions={sessionCommonComponentOptions} filters={filters} onFiltersChange={setFilters} onRetry={() => void sessions.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} recordOptions={sessionRecordOptions} sessions={summaries} state={state} />;
}

export function SessionDetailRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "", section = "overview" } = useParams();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  return <SessionDetailView activeTab={section === "participants" ? "participants" : "overview"} onEditParticipants={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)} onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} />;
}

export function SessionTranscriptRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const transcripts = useSessionTranscripts(projectId, sessionId);
  const upload = useUploadTranscript(projectId, sessionId);
  const retry = useRetryTranscript(projectId, sessionId);
  const setPrimary = useSetPrimaryTranscript(projectId, sessionId);
  const remove = useDeleteTranscript(projectId, sessionId);
  const search = useTranscriptSearch(projectId, sessionId, transcripts.data?.find((item) => item.is_primary)?.id ?? transcripts.data?.find((item) => item.status === "complete")?.id ?? "");
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  const transcriptState = transcripts.isPending ? "loading" : transcripts.isError ? "error" : "ready";
  const documents = (transcripts.data ?? []).map(toTranscriptDocumentDetail);
  return <SessionDetailView activeTab="transcript" onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} transcriptContent={<SessionTranscriptWorkspaceView deletePendingId={remove.isPending ? remove.variables : undefined} documents={documents} errorMessage={transcripts.error ? errorMessage(transcripts.error) : undefined} onDelete={(documentId) => { if (window.confirm("Delete this transcript? This action cannot be undone.")) remove.mutate(documentId); }} onOpenContext={(href) => navigate(href)} onRetry={(documentId) => retry.mutate(documentId)} onRetryLoad={() => void transcripts.refetch()} onSearch={(_documentId, query) => search.mutate(query)} onSetPrimary={(documentId) => setPrimary.mutate(documentId)} onUpload={(file) => upload.mutateAsync(file).then(() => undefined)} projectId={projectId} retryingId={retry.isPending ? retry.variables : undefined} searchError={search.error ? errorMessage(search.error) : undefined} searchQuery={search.data?.query} searchResults={search.data?.results.map(toTranscriptSearchResult)} searching={search.isPending} sessionId={sessionId} state={transcriptState} uploadError={upload.error ? errorMessage(upload.error) : undefined} uploading={upload.isPending} />} />;
}

export function SessionThemesRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const [selectedThemeId, setSelectedThemeId] = React.useState<string>();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const themes = useSessionThemes(projectId, sessionId);
  const generate = useGenerateSessionThemes(projectId, sessionId);
  const update = useUpdateSessionTheme(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  const values = (themes.data ?? []).map(toSessionTheme);
  const changeStatus = (themeId: string, status: "ai-generated" | "researcher-reviewed" | "approved" | "rejected") => {
    update.mutate({ themeId, payload: { status } });
    if (status === "approved" || status === "rejected") setSelectedThemeId(undefined);
  };
  return <SessionDetailView activeTab="themes" onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} workspaceContent={<SessionThemesWorkspaceView errorMessage={themes.error ? errorMessage(themes.error) : undefined} generating={generate.isPending} onCloseReview={() => setSelectedThemeId(undefined)} onGenerate={() => generate.mutate()} onOpenContext={(href) => navigate(href)} onRetry={() => void themes.refetch()} onReview={(theme) => { setSelectedThemeId(theme.id); if (theme.status === "ai-generated") changeStatus(theme.id, "researcher-reviewed"); }} onStatusChange={changeStatus} projectId={projectId} selectedThemeId={selectedThemeId} sessionId={sessionId} state={themes.isPending ? "loading" : themes.isError ? "error" : "ready"} themes={values} />} />;
}

export function SessionReportRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const report = useSessionReport(projectId, sessionId);
  const generate = useGenerateSessionReport(projectId, sessionId);
  const updateStatus = useUpdateSessionReportStatus(projectId, sessionId);
  const revision = useCreateSessionReportRevision(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  const reportValue = report.data ? toSessionReport(report.data) : undefined;
  const openContext = (itemId: string) => {
    const evidence = reportValue?.items.find((item) => item.id === itemId)?.evidence[0];
    if (evidence) navigate(`/projects/${projectId}/sessions/${sessionId}/documents/${evidence.documentId}?result=${evidence.contextResultId}`);
  };
  return <SessionDetailView activeTab="report" onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} workspaceContent={<SessionReportWorkspaceView errorMessage={report.error ? errorMessage(report.error) : undefined} generating={generate.isPending} onApprove={() => updateStatus.mutate("approved")} onCreateRevision={() => revision.mutate()} onGenerate={() => generate.mutate()} onOpenContext={openContext} onRegenerate={() => generate.mutate()} onRetry={() => void report.refetch()} onReview={() => updateStatus.mutate("researcher-reviewed")} report={reportValue} state={report.isPending ? "loading" : report.isError ? "error" : "ready"} />} />;
}

export function SessionAskRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const conversation = useSessionConversation(projectId, sessionId);
  const ask = useAskSession(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  return <SessionDetailView activeTab="ask" onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} workspaceContent={<AskThisSessionWorkspaceView conversation={conversation.data ? toSessionConversation(conversation.data) : undefined} errorMessage={ask.error ? errorMessage(ask.error) : conversation.error ? errorMessage(conversation.error) : undefined} onAsk={(question) => ask.mutateAsync(question).then(() => undefined)} onOpenContext={(href) => navigate(href)} projectId={projectId} sessionId={sessionId} state={conversation.isPending || ask.isPending ? "loading" : conversation.isError || ask.isError ? "error" : "ready"} suggestedQuestions={suggestedSessionQuestions} />} />;
}

export function TranscriptContextRoute() {
  const { projectId = "", sessionId = "", documentId = "" } = useParams();
  const [params] = useSearchParams();
  const resultId = params.get("result") ?? "";
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const context = useTranscriptContext(projectId, sessionId, documentId, resultId);
  const project = projects.data?.find((item) => item.id === projectId);
  const returnHref = `/projects/${projectId}/sessions/${sessionId}/transcript`;
  const state = projects.isPending || session.isPending || context.isPending ? "loading" : isNotFound(context.error) || !resultId ? "unavailable" : projects.isError || session.isError || context.isError ? "error" : "ready";
  return <TranscriptContextView context={context.data ? toTranscriptContext(context.data) : undefined} onRetry={() => void context.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} returnHref={returnHref} sessionId={sessionId} sessionTitle={session.data?.title ?? "Session"} state={state} />;
}

function participantOptionsFor(values: ReturnType<typeof toParticipantSummary>[]) {
  return values.map(({ id, firstName, lastName, referenceId }) => ({ id, firstName, lastName, referenceId }));
}

export function SessionCreateRoute() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const projects = useProjects();
  const participants = useParticipants(projectId);
  const createSession = useCreateSession(projectId);
  const project = projects.data?.find((item) => item.id === projectId);
  if (projects.isPending || participants.isPending) return <SharedRouteState state="loading" />;
  if (projects.isError || participants.isError) return <SharedRouteState state="recoverable-error" />;
  if (!project) return <SharedRouteState state="not-found" />;
  return <SessionFormView isSubmitting={createSession.isPending} mode="create" onCancel={() => navigate(`/projects/${projectId}/sessions`)} onSubmit={async (values) => { const created = await createSession.mutateAsync(toSessionPayload(values)); navigate(`/projects/${projectId}/sessions/${created.id}/overview`); }} participants={participantOptionsFor((participants.data ?? []).map(toParticipantSummary))} projectId={projectId} projectName={project.name} submitError={createSession.error ? errorMessage(createSession.error) : undefined} />;
}

export function SessionEditRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const participants = useParticipants(projectId);
  const session = useSession(projectId, sessionId);
  const updateSession = useUpdateSession(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  if (projects.isPending || participants.isPending || session.isPending) return <SharedRouteState state="loading" />;
  if (projects.isError || participants.isError || session.isError) return isNotFound(session.error) ? <SharedRouteState state="not-found" /> : <SharedRouteState state="recoverable-error" />;
  if (!project || !session.data) return <SharedRouteState state="not-found" />;
  return <SessionFormView defaultValues={toSessionFormValues(session.data)} isSubmitting={updateSession.isPending} mode="edit" onCancel={() => navigate(`/projects/${projectId}/sessions/${sessionId}/participants`)} onSubmit={async (values) => { await updateSession.mutateAsync({ ...toSessionPayload(values), duration_minutes: session.data.duration_minutes }); navigate(`/projects/${projectId}/sessions/${sessionId}/participants`); }} participants={participantOptionsFor((participants.data ?? []).map(toParticipantSummary))} projectId={projectId} projectName={project.name} submitError={updateSession.error ? errorMessage(updateSession.error) : undefined} />;
}

export function SettingsProfileRoute() {
  return <SettingsView active="profile" />;
}

export function SettingsAIRoute() {
  const settings = useAISettings();
  const updateSettings = useUpdateAISettings();
  const testSettings = useTestAISettings();
  const initialValues = React.useMemo<AISettingsPayload>(() => settings.data ? {
    provider: settings.data.provider,
    model: settings.data.model,
    base_url: settings.data.base_url,
    embedding_provider: settings.data.embedding_provider,
    embedding_model: settings.data.embedding_model,
  } : emptyAISettings, [settings.data]);

  const state = settings.isPending
    ? "loading"
    : settings.isError
      ? "load-error"
      : updateSettings.isPending
        ? "saving"
        : updateSettings.isError
          ? "save-error"
          : updateSettings.isSuccess
            ? "save-success"
            : testSettings.isPending
              ? "testing"
              : testSettings.isError || (testSettings.data && !testSettings.data.ok)
                ? "test-failure"
                : testSettings.isSuccess
                  ? "test-success"
                  : "ready";

  const statusMessage = settings.error
    ? errorMessage(settings.error)
    : updateSettings.error
      ? errorMessage(updateSettings.error)
      : testSettings.error
        ? errorMessage(testSettings.error)
        : testSettings.data?.message;

  return (
    <SettingsView
      active="ai"
      aiSettingsProps={{
        apiKeyEnvVar: settings.data?.api_key_env_var,
        hasApiKey: settings.data?.has_api_key,
        initialValues,
        onSave: (values) => {
          testSettings.reset();
          updateSettings.mutate(values);
        },
        onTest: () => {
          updateSettings.reset();
          testSettings.mutate();
        },
        state,
        statusMessage,
      }}
    />
  );
}
