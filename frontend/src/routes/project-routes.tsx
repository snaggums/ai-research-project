import * as React from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import type { AISettingsPayload, Project, Session, SessionPayload } from "@/api/types";
import { toProjectSummary } from "@/adapters/projects";
import {
  compareParticipantsByLastName,
  toParticipantFormValues,
  toParticipantPayload,
  toParticipantSummary,
} from "@/adapters/participants";
import { ParticipantApiError } from "@/api/participants";
import { SessionApiError } from "@/api/sessions";
import { TranscriptApiError } from "@/api/transcripts";
import type { SessionFilters } from "@/api/types";
import { toSessionFormValues, toSessionPayload, toSessionSummary } from "@/adapters/sessions";
import { SharedRouteState } from "@/components/application";
import type { ProjectFormValues } from "@/components/research/project-form";
import type { ProjectWorkflowStep } from "@/components/research/project-workflow-summary";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks/useProjects";
import {
  useCreateParticipant,
  useDeleteParticipant,
  useParticipant,
  useParticipants,
  useUpdateParticipant,
} from "@/hooks/useParticipants";
import { useAISettings, useTestAISettings, useUpdateAISettings } from "@/hooks/useSettings";
import { useCreateSession, useDeleteSession, useSession, useSessions, useUpdateSession } from "@/hooks/useSessions";
import { useRecords } from "@/hooks/useRecords";
import { useDeleteTranscript, useReplaceTranscript, useRetryTranscript, useSessionTranscripts, useTranscriptContext, useTranscriptDependencies, useTranscriptSearch, useUploadTranscript } from "@/hooks/useTranscripts";
import {
  ProjectFormDialogView,
  ProjectOverviewView,
  ProjectsIndexView,
  SettingsView,
} from "@/pages/project-views";
import {
  ParticipantDetailView,
  ParticipantsCollectionView,
} from "@/pages/participant-views";
import { emptySessionFilters } from "@/pages/session-view-data";
import {
  SessionDetailView,
  SessionFormView,
  SessionParticipantCreateView,
  SessionsCollectionView,
} from "@/pages/session-views";
import { SessionTranscriptWorkspaceView, TranscriptContextView } from "@/pages/transcript-views";
import { toTranscriptContext, toTranscriptDependencySummary, toTranscriptDocumentDetail, toTranscriptSearchResult } from "@/adapters/transcripts";
import { toSessionConversation, toSessionReport, toSessionTheme } from "@/adapters/synthesis";
import { sessionRecordOptions } from "@/mocks/fixtures/sessions";
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
  useUpdateSessionReport,
  useUpdateSessionReportItem,
  useUpdateSessionTheme,
} from "@/hooks/useSynthesis";
import { AskThisSessionWorkspaceView, SessionReportWorkspaceView, SessionThemesWorkspaceView } from "@/pages/synthesis-views";
import { TranscriptCodingRouteContent } from "@/routes/transcript-coding-route-content";

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

function projectWorkflowSteps(project: Project): ProjectWorkflowStep[] {
  const root = `/projects/${project.id}`;
  const overview = `${root}/overview`;
  const completed = [
    true,
    project.participant_count > 0,
    project.session_count > 0,
    project.ready_transcript_count > 0,
  ];
  const currentIndex = completed.findIndex((value) => !value);
  const content = [
    {
      id: "create-project",
      title: "Create project",
      description: "Project details are ready.",
      action: { href: `${root}/edit?returnTo=${encodeURIComponent(overview)}`, label: "Edit project" },
    },
    {
      id: "add-participants",
      title: "Add participants",
      description: "Add the people involved in this research.",
      action: { href: `${root}/participants/new`, label: "Add participants" },
    },
    {
      id: "add-sessions",
      title: "Add sessions",
      description: "Organize interviews, tests, or working sessions.",
      action: { href: `${root}/sessions/new`, label: "Add session" },
    },
    {
      id: "upload-transcripts",
      title: "Upload transcripts",
      description: "Add transcript documents for review.",
      action: { href: `${root}/sessions`, label: "Upload transcript" },
    },
  ];

  return content.map((step, index) => ({
    ...step,
    status: completed[index]
      ? "complete"
      : index === currentIndex
        ? "current"
        : "upcoming",
  }));
}

function participantRecordOptions(records: ReturnType<typeof useRecords>["data"]) {
  return (records ?? []).map((record) => ({ label: record.name, value: record.id }));
}

function participantReturnTarget(searchParams: URLSearchParams, projectId: string) {
  const fallback = `/projects/${projectId}/participants`;
  const requested = searchParams.get("returnTo");
  const prefix = `/projects/${projectId}/sessions/`;
  const suffix = "/participants";
  if (!requested?.startsWith(prefix) || !requested.endsWith(suffix)) {
    return { path: fallback, sessionId: "" };
  }
  const sessionId = requested.slice(prefix.length, -suffix.length);
  if (!sessionId || sessionId.includes("/")) return { path: fallback, sessionId: "" };
  return { path: requested, sessionId };
}

function assignParticipantPayload(session: Session, participantId: string): SessionPayload {
  return {
    title: session.title,
    type: session.type,
    starts_at: session.starts_at,
    duration_minutes: session.duration_minutes,
    description: session.description,
    participant_ids: Array.from(new Set([...session.participant_ids, participantId])),
    related_record_ids: session.related_records.map((record) => record.id),
    related_common_component_ids: session.related_common_components.map((component) => component.id),
  };
}

function removeParticipantPayload(session: Session, participantId: string): SessionPayload {
  return {
    title: session.title,
    type: session.type,
    starts_at: session.starts_at,
    duration_minutes: session.duration_minutes,
    description: session.description,
    participant_ids: session.participant_ids.filter((id) => id !== participantId),
    related_record_ids: session.related_records.map((record) => record.id),
    related_common_component_ids: session.related_common_components.map((component) => component.id),
  };
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
        : (project) => navigate(`/projects/${project.id}/edit?returnTo=${encodeURIComponent("/projects")}`)}
      onRetry={() => void projects.refetch()}
      projects={summaries}
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
  const [searchParams] = useSearchParams();
  const { projectId = "" } = useParams();
  const { projects } = useProjectIndexModel();
  const updateProject = useUpdateProject();
  const project = projects.data?.find((item) => item.id === projectId);
  const projectOverview = `/projects/${projectId}/overview`;
  const returnTarget = searchParams.get("returnTo") === "/projects"
    ? "/projects"
    : projectOverview;

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
        onCancel={() => navigate(returnTarget)}
        onSubmit={async (values) => {
          await updateProject.mutateAsync({
            projectId: project.id,
            payload: { name: values.name, description: values.description || null },
          });
          navigate(returnTarget);
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

  return <ProjectOverviewView project={toProjectSummary(project)} steps={projectWorkflowSteps(project)} />;
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
  const [searchParams] = useSearchParams();
  const { projectId = "" } = useParams();
  const projects = useProjects();
  const records = useRecords();
  const createParticipant = useCreateParticipant(projectId);
  const returnTarget = participantReturnTarget(searchParams, projectId);
  const project = projects.data?.find((item) => item.id === projectId);
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing
    ? "not-found"
    : projects.isPending || records.isPending
      ? "loading"
      : projects.isError || records.isError
      ? "error"
      : "ready";

  if (returnTarget.sessionId) {
    return (
      <Navigate
        replace
        to={`/projects/${projectId}/sessions/${returnTarget.sessionId}/participants/new`}
      />
    );
  }

  return (
    <ParticipantDetailView
      isSubmitting={createParticipant.isPending}
      mode="create"
      onCancel={() => navigate(returnTarget.path)}
      onSubmit={async (values) => {
        await createParticipant.mutateAsync(toParticipantPayload(values));
        navigate(returnTarget.path);
      }}
      onRetry={() => void Promise.all([projects.refetch(), records.refetch()])}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      recordOptions={participantRecordOptions(records.data)}
      routeState={routeState}
      submitError={createParticipant.error ? errorMessage(createParticipant.error) : undefined}
    />
  );
}

export function SessionParticipantCreateRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const records = useRecords();
  const projectParticipants = useParticipants(projectId);
  const session = useSession(projectId, sessionId);
  const createParticipant = useCreateParticipant(projectId);
  const updateSession = useUpdateSession(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const returnTo = `/projects/${projectId}/sessions/${sessionId}/participants`;
  const eligibleParticipants = React.useMemo(() => {
    const assignedIds = new Set(session.data?.participant_ids ?? []);
    return (projectParticipants.data ?? [])
      .filter((participant) => !assignedIds.has(participant.id))
      .map(toParticipantSummary)
      .sort(compareParticipantsByLastName)
      .map((participant) => ({
        label: participantName(participant.firstName, participant.lastName),
        value: participant.id,
      }));
  }, [projectParticipants.data, session.data?.participant_ids]);
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error)
    ? "not-found"
    : projects.isPending || records.isPending || projectParticipants.isPending || session.isPending
      ? "loading"
      : projects.isError || records.isError || projectParticipants.isError || session.isError
        ? "error"
        : "ready";
  const submitError = createParticipant.error
    ? errorMessage(createParticipant.error)
    : updateSession.error
      ? errorMessage(updateSession.error)
      : undefined;

  return (
    <SessionParticipantCreateView
      eligibleParticipants={eligibleParticipants}
      isSubmitting={createParticipant.isPending || updateSession.isPending}
      onCancel={() => navigate(returnTo)}
      onEditSession={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)}
      onRetry={() => void Promise.all([
        projects.refetch(),
        records.refetch(),
        projectParticipants.refetch(),
        session.refetch(),
      ])}
      onSubmitExisting={async (participantId) => {
        if (!session.data) return;
        await updateSession.mutateAsync(assignParticipantPayload(session.data, participantId));
        navigate(returnTo);
      }}
      onSubmitNew={async (values) => {
        const created = await createParticipant.mutateAsync(toParticipantPayload(values));
        if (session.data) {
          await updateSession.mutateAsync(assignParticipantPayload(session.data, created.id));
        }
        navigate(returnTo);
      }}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      recordOptions={participantRecordOptions(records.data)}
      routeState={routeState}
      session={summary}
      submitError={submitError}
    />
  );
}

export function ParticipantDetailRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { participantId = "", projectId = "" } = useParams();
  const projects = useProjects();
  const records = useRecords();
  const participant = useParticipant(projectId, participantId);
  const updateParticipant = useUpdateParticipant(projectId, participantId);
  const project = projects.data?.find((item) => item.id === projectId);
  const returnTarget = participantReturnTarget(searchParams, projectId);
  const summary = participant.data ? toParticipantSummary(participant.data) : undefined;
  const defaultValues = React.useMemo(
    () => participant.data ? toParticipantFormValues(participant.data) : undefined,
    [participant.data],
  );
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(participant.error)
    ? "not-found"
    : projects.isPending || participant.isPending || records.isPending
      ? "loading"
      : projects.isError || participant.isError || records.isError
        ? "error"
        : "ready";

  return (
    <ParticipantDetailView
      defaultValues={defaultValues}
      isSubmitting={updateParticipant.isPending}
      mode="edit"
      onCancel={() => routeState === "error"
        ? void participant.refetch()
        : navigate(returnTarget.path)}
      onSubmit={async (values) => {
        await updateParticipant.mutateAsync(toParticipantPayload(values));
        navigate(returnTarget.path);
      }}
      onRetry={() => void Promise.all([participant.refetch(), records.refetch()])}
      participant={summary}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      recordOptions={participantRecordOptions(records.data)}
      routeState={routeState}
      submitError={updateParticipant.error ? errorMessage(updateParticipant.error) : undefined}
    />
  );
}

export function SessionsCollectionRoute() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const projects = useProjects();
  const deleteSession = useDeleteSession(projectId);
  const [filters, setFilters] = React.useState<SessionFilters>(emptySessionFilters);
  const sessions = useSessions(projectId, filters);
  const project = projects.data?.find((item) => item.id === projectId);
  const summaries = React.useMemo(() => (sessions.data ?? []).map(toSessionSummary), [sessions.data]);
  const activeFilters = Object.values(filters).some(Boolean);
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const state = projectMissing || isNotFound(sessions.error) ? "not-found" : sessions.isPending ? "loading" : sessions.isError ? "error" : summaries.length ? "ready" : activeFilters ? "no-results" : "empty";
  return <SessionsCollectionView filters={filters} onDeleteSession={(sessionId) => deleteSession.mutate(sessionId)} onEditSession={(sessionId) => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)} onFiltersChange={setFilters} onRetry={() => void sessions.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} recordOptions={sessionRecordOptions} sessions={summaries} state={state} />;
}

export function SessionDetailRoute({ activeTab = "overview" }: { activeTab?: "overview" | "participants" }) {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const updateSession = useUpdateSession(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  const returnTo = `/projects/${projectId}/sessions/${sessionId}/participants`;
  const returnQuery = `?returnTo=${encodeURIComponent(returnTo)}`;
  return <SessionDetailView activeTab={activeTab} onAddParticipant={() => navigate(`/projects/${projectId}/sessions/${sessionId}/participants/new`)} onEditParticipant={(participantId) => navigate(`/projects/${projectId}/participants/${participantId}${returnQuery}`)} onEditSession={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)} onRemoveParticipant={(participantId) => { if (session.data) updateSession.mutate(removeParticipantPayload(session.data, participantId)); }} onRetry={() => void session.refetch()} participantActionError={updateSession.error ? errorMessage(updateSession.error) : undefined} participantActionPending={updateSession.isPending} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} />;
}

export function SessionTranscriptRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const replacementRequestKeys = React.useRef(new WeakMap<File, string>());
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const transcripts = useSessionTranscripts(projectId, sessionId);
  const activeTranscriptId = transcripts.data?.find((item) => item.is_primary)?.id ?? "";
  const dependencies = useTranscriptDependencies(projectId, sessionId, activeTranscriptId);
  const upload = useUploadTranscript(projectId, sessionId);
  const replace = useReplaceTranscript(projectId, sessionId);
  const retry = useRetryTranscript(projectId, sessionId);
  const remove = useDeleteTranscript(projectId, sessionId);
  const search = useTranscriptSearch(projectId, sessionId, activeTranscriptId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  const transcriptState = transcripts.isPending ? "loading" : transcripts.isError ? "error" : "ready";
  const documents = (transcripts.data ?? []).map(toTranscriptDocumentDetail);
  const hasReadyPrimaryTranscript = (transcripts.data ?? []).some((document) =>
    document.is_primary && document.status === "complete",
  );
  const replaceTranscript = (file: File) => {
    let requestKey = replacementRequestKeys.current.get(file);
    if (!requestKey) {
      requestKey = crypto.randomUUID();
      replacementRequestKeys.current.set(file, requestKey);
    }
    return replace.mutateAsync({ file, requestKey }).then(() => undefined);
  };
  return (
    <SessionDetailView
      activeTab="transcript"
      onEditSession={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)}
      onRetry={() => void session.refetch()}
      projectId={projectId}
      projectName={project?.name ?? "Project"}
      routeState={routeState}
      session={summary}
      transcriptContent={(
        <div className="grid gap-8">
          <SessionTranscriptWorkspaceView
            actionError={remove.error
              ? errorMessage(remove.error)
              : dependencies.error
                ? errorMessage(dependencies.error)
              : retry.error
                ? errorMessage(retry.error)
                : undefined}
            deletePendingId={remove.isPending ? remove.variables.documentId : undefined}
            dependencies={dependencies.data ? toTranscriptDependencySummary(dependencies.data) : undefined}
            dependenciesPending={dependencies.isPending && Boolean(activeTranscriptId)}
            documents={documents}
            errorMessage={transcripts.error ? errorMessage(transcripts.error) : undefined}
            onDelete={(documentId) => {
              if (dependencies.data) {
                remove.mutate({ documentId, dependencyVersion: dependencies.data.version });
              }
            }}
            onOpenContext={(href) => navigate(href)}
            onRetry={(documentId) => retry.mutate(documentId)}
            onRetryLoad={() => void transcripts.refetch()}
            onReplace={replaceTranscript}
            onSearch={(_documentId, query) => search.mutate(query)}
            onUpload={(file) => upload.mutateAsync(file).then(() => undefined)}
            projectId={projectId}
            retryingId={retry.isPending ? retry.variables : undefined}
            replacementError={replace.error ? errorMessage(replace.error) : undefined}
            replacing={replace.isPending}
            searchError={search.error ? errorMessage(search.error) : undefined}
            searchQuery={search.data?.query}
            searchResults={search.data?.results.map(toTranscriptSearchResult)}
            searching={search.isPending}
            sessionId={sessionId}
            state={transcriptState}
            uploadError={upload.error ? errorMessage(upload.error) : undefined}
            uploading={upload.isPending}
          />
          <TranscriptCodingRouteContent
            enabled={transcriptState === "ready" && hasReadyPrimaryTranscript}
            projectId={projectId}
            sessionId={sessionId}
          />
        </div>
      )}
    />
  );
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
  return <SessionDetailView activeTab="themes" onEditSession={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)} onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} workspaceContent={<SessionThemesWorkspaceView errorMessage={themes.error ? errorMessage(themes.error) : undefined} generating={generate.isPending} onCloseReview={() => setSelectedThemeId(undefined)} onGenerate={() => generate.mutate()} onOpenContext={(href) => navigate(href)} onRetry={() => void themes.refetch()} onReview={(theme) => { setSelectedThemeId(theme.id); if (theme.status === "ai-generated") changeStatus(theme.id, "researcher-reviewed"); }} onStatusChange={changeStatus} projectId={projectId} selectedThemeId={selectedThemeId} sessionId={sessionId} state={themes.isPending ? "loading" : themes.isError ? "error" : "ready"} themes={values} />} />;
}

export function SessionReportRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "" } = useParams();
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const report = useSessionReport(projectId, sessionId);
  const generate = useGenerateSessionReport(projectId, sessionId);
  const updateStatus = useUpdateSessionReportStatus(projectId, sessionId);
  const updateReport = useUpdateSessionReport(projectId, sessionId);
  const updateReportItem = useUpdateSessionReportItem(projectId, sessionId);
  const revision = useCreateSessionReportRevision(projectId, sessionId);
  const project = projects.data?.find((item) => item.id === projectId);
  const summary = session.data ? toSessionSummary(session.data) : undefined;
  const projectMissing = !projects.isPending && !projects.isError && !project;
  const routeState = projectMissing || isNotFound(session.error) ? "not-found" : projects.isPending || session.isPending ? "loading" : projects.isError || session.isError ? "error" : "ready";
  const reportValue = report.data ? toSessionReport(report.data) : undefined;
  return <SessionDetailView activeTab="report" onEditSession={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)} onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} workspaceContent={<SessionReportWorkspaceView errorMessage={report.error ? errorMessage(report.error) : undefined} generating={generate.isPending} onApprove={() => updateStatus.mutate("approved")} onCreateRevision={() => revision.mutate()} onEditItem={(itemId, payload) => updateReportItem.mutate({ itemId, payload })} onEditReport={(payload) => updateReport.mutate({ executive_summary: payload.executiveSummary, detailed_notes: payload.detailedNotes })} onGenerate={() => generate.mutate()} onRegenerate={() => generate.mutate()} onRetry={() => void report.refetch()} onReview={() => updateStatus.mutate("researcher-reviewed")} report={reportValue} state={report.isPending ? "loading" : report.isError ? "error" : "ready"} />} />;
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
  return <SessionDetailView activeTab="ask" onEditSession={() => navigate(`/projects/${projectId}/sessions/${sessionId}/edit`)} onRetry={() => void session.refetch()} projectId={projectId} projectName={project?.name ?? "Project"} routeState={routeState} session={summary} workspaceContent={<AskThisSessionWorkspaceView conversation={conversation.data ? toSessionConversation(conversation.data) : undefined} errorMessage={ask.error ? errorMessage(ask.error) : conversation.error ? errorMessage(conversation.error) : undefined} onAsk={(question) => ask.mutateAsync(question).then(() => undefined)} onOpenContext={(href) => navigate(href)} projectId={projectId} sessionId={sessionId} state={conversation.isPending || ask.isPending ? "loading" : conversation.isError || ask.isError ? "error" : "ready"} suggestedQuestions={suggestedSessionQuestions} />} />;
}

export function TranscriptContextRoute() {
  const navigate = useNavigate();
  const { projectId = "", sessionId = "", documentId = "" } = useParams();
  const [params] = useSearchParams();
  const resultId = params.get("result") ?? "";
  const projects = useProjects();
  const session = useSession(projectId, sessionId);
  const context = useTranscriptContext(projectId, sessionId, documentId, resultId);
  const project = projects.data?.find((item) => item.id === projectId);
  const sessionRoot = `/projects/${projectId}/sessions/${sessionId}`;
  const requestedReturn = params.get("returnTo");
  const safeReturns = new Map([
    [`${sessionRoot}/transcript`, "Transcripts"],
    [`${sessionRoot}/themes`, "Themes"],
    [`${sessionRoot}/report`, "Session Report"],
    [`${sessionRoot}/ask`, "Ask this session"],
  ]);
  const returnHref = requestedReturn && safeReturns.has(requestedReturn) ? requestedReturn : `${sessionRoot}/transcript`;
  const returnLabel = safeReturns.get(returnHref) ?? "Transcripts";
  const state = projects.isPending || session.isPending || context.isPending ? "loading" : isNotFound(context.error) || !resultId ? "unavailable" : projects.isError || session.isError || context.isError ? "error" : "ready";
  return <TranscriptContextView context={context.data ? toTranscriptContext(context.data) : undefined} onRetry={() => void context.refetch()} onReturn={() => navigate(returnHref)} projectId={projectId} projectName={project?.name ?? "Project"} returnHref={returnHref} returnLabel={returnLabel} sessionId={sessionId} sessionTitle={session.data?.title ?? "Session"} state={state} />;
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
