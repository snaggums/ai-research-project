import * as React from "react";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";

import type { SessionFilters } from "@/api/types";
import { EmptyState, EntityCollection, PageHeader, SectionNavigation, SharedRouteState } from "@/components/application";
import { SessionCollectionItem } from "@/components/research/session-collection-item";
import { SessionForm, type SessionFormProps } from "@/components/research/session-form";
import {
  SessionParticipantForm,
  type SessionParticipantFormProps,
} from "@/components/research/session-participant-form";
import { SessionParticipantGroup } from "@/components/research/session-participant-group";
import { RecordSynthesisRequirementsNote } from "@/components/research/record-synthesis-requirements-note";
import { SessionSummary } from "@/components/research/session-summary";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { SearchField } from "@/components/ui/search-field";
import { SelectField, type SelectOption } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { ParticipantSummary, SessionSummary as SessionSummaryValue } from "@/domain/types";
import { sessionTypeLabels, workflowStatusLabel } from "@/components/research/session-presentation";
import { emptySessionFilters } from "./session-view-data";

const typeOptions: SelectOption[] = [{ value: "", label: "All session types" }, ...Object.entries(sessionTypeLabels).map(([value, label]) => ({ value, label }))];
const transcriptOptions: SelectOption[] = [
  { value: "", label: "All transcript statuses" }, { value: "none", label: "No transcript" }, { value: "uploaded", label: "Uploaded" },
  { value: "processing", label: "Processing" }, { value: "complete", label: "Ready" }, { value: "failed", label: "Failed" },
];
const analysisOptions: SelectOption[] = [
  { value: "", label: "All analysis statuses" }, { value: "not-generated", label: "Not generated" }, { value: "generating", label: "Generating" },
  { value: "ai-generated", label: "AI generated" }, { value: "researcher-reviewed", label: "Researcher reviewed" }, { value: "approved", label: "Approved" }, { value: "failed", label: "Failed" },
];

function ProjectSections({ projectId }: { projectId: string }) {
  const root = `/projects/${projectId}`;
  return <SectionNavigation activeId="sessions" items={[{ id: "overview", label: "Overview", href: `${root}/overview` }, { id: "participants", label: "Participants", href: `${root}/participants` }, { id: "sessions", label: "Sessions", href: `${root}/sessions` }, { id: "ask", label: "Ask this project", href: `${root}/ask` }]} label="Project sections" />;
}

function FilterFields({ filters, onChange, recordOptions }: { filters: SessionFilters; onChange: (filters: SessionFilters) => void; recordOptions: SelectOption[] }) {
  const set = (key: keyof SessionFilters, value: string) => onChange({ ...filters, [key]: value });
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <SelectField label="Session type" onValueChange={(value) => set("type", value)} options={typeOptions} value={filters.type ?? ""} />
    <SelectField label="Transcript status" onValueChange={(value) => set("transcriptStatus", value)} options={transcriptOptions} value={filters.transcriptStatus ?? ""} />
    <SelectField label="Analysis status" onValueChange={(value) => set("analysisStatus", value)} options={analysisOptions} value={filters.analysisStatus ?? ""} />
    <DateField label="Date" onChange={(event) => set("date", event.currentTarget.value)} optional value={filters.date ?? ""} />
    <SelectField label="Related Record" onValueChange={(value) => set("recordId", value)} options={[{ value: "", label: "All Records" }, ...recordOptions]} value={filters.recordId ?? ""} />
  </div>;
}

export interface SessionsCollectionViewProps {
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
  onDeleteSession?: (sessionId: string) => void;
  onEditSession?: (sessionId: string) => void;
  onRetry?: () => void;
  projectId: string;
  projectName: string;
  recordOptions: SelectOption[];
  sessions: SessionSummaryValue[];
  state?: "ready" | "loading" | "empty" | "no-results" | "error" | "not-found";
}

export function SessionsCollectionView({ filters, onDeleteSession, onEditSession, onFiltersChange, onRetry, projectId, projectName, recordOptions, sessions, state = "ready" }: SessionsCollectionViewProps) {
  const [sessionToDelete, setSessionToDelete] = React.useState<SessionSummaryValue | null>(null);
  const root = `/projects/${projectId}`;
  const activeFilters = Object.values(filters).some((value) => Boolean(value));
  const clearFilters = () => onFiltersChange(emptySessionFilters);
  const filterFields = <FilterFields filters={filters} onChange={onFiltersChange} recordOptions={recordOptions} />;
  return <div className="grid gap-6">
    <PageHeader actions={<Button asChild size="small"><a href={`${root}/sessions/new`}><Plus aria-hidden="true" className="h-4 w-4" />New session</a></Button>} breadcrumbs={[{ href: "/projects", label: "Projects" }, { href: `${root}/overview`, label: projectName }, { label: "Sessions" }]} description="Organize interviews, usability tests, and working sessions in this project." title="Sessions" />
    <ProjectSections projectId={projectId} />
    {state === "not-found" ? <SharedRouteState returnHref="/projects" state="not-found" /> : <EntityCollection
      actions={<div className="flex w-full gap-2 sm:w-auto"><div className="min-w-0 flex-1 sm:w-[22rem]"><SearchField aria-label="Search sessions and transcripts" onChange={(event) => onFiltersChange({ ...filters, search: event.currentTarget.value })} placeholder="Search sessions and transcripts" value={filters.search ?? ""} /></div><div className="md:hidden"><Dialog description="Narrow the Sessions in this Project." showActions={false} size="large" title="Filters" trigger={<Button size="small" variant="gray-subtle"><Filter aria-hidden="true" className="h-4 w-4" />Filters</Button>}>{filterFields}</Dialog></div></div>}
      controls={<div className="hidden md:block">{filterFields}</div>}
      countLabel={state === "loading" ? "Loading sessions..." : `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`}
      countPosition="below"
      state={state}
      stateContent={state === "empty" ? <EmptyState description="Create the first Session to organize participants, transcripts, and analysis." primaryAction={<Button asChild size="small"><a href={`${root}/sessions/new`}>New session</a></Button>} title="No sessions yet" /> : state === "no-results" ? <EmptyState description="Try changing the search or clearing the current filters." primaryAction={<Button onClick={clearFilters} size="small" variant="gray-subtle">Clear filters</Button>} title="No matching sessions" /> : state === "error" ? <div className="mx-auto grid max-w-xl gap-3 py-16"><Alert message="Check your connection and try again. Existing Project data has not been changed." size="large" title="Sessions could not be loaded" tone="error" />{onRetry ? <Button className="mx-auto" onClick={onRetry} size="small">Retry</Button> : null}</div> : undefined}
      title="All sessions"
    >
      <div className="grid gap-4">{sessions.map((session) => <SessionCollectionItem href={`${root}/sessions/${session.id}/overview`} key={session.id} onDelete={onDeleteSession ? setSessionToDelete : undefined} onEdit={onEditSession ? (value) => onEditSession(value.id) : undefined} session={session} />)}</div>
      {activeFilters && sessions.length && state === "ready" ? <Button className="mt-4" onClick={clearFilters} size="small" variant="text">Clear filters</Button> : null}
    </EntityCollection>}
    <Dialog
      description="Delete this Session and its transcript, themes, and Session Report? Any Record synthesis generated from this Session will also be removed."
      intent="destructive"
      onOpenChange={(open) => { if (!open) setSessionToDelete(null); }}
      onPrimary={() => { if (sessionToDelete) onDeleteSession?.(sessionToDelete.id); }}
      open={Boolean(sessionToDelete)}
      primaryLabel="Delete session"
      title="Delete session?"
    />
  </div>;
}

const sessionTabs = (root: string) => [
  { id: "overview", label: "Overview", href: `${root}/overview` }, { id: "participants", label: "Participants", href: `${root}/participants` },
  { id: "transcript", label: "Transcript", href: `${root}/transcript` }, { id: "themes", label: "Themes", href: `${root}/themes` },
  { id: "report", label: "Session Report", href: `${root}/report` }, { id: "ask", label: "Ask this session", href: `${root}/ask` },
];

function tone(status: string): NonNullable<BadgeProps["tone"]> {
  if (["complete", "approved", "researcher-reviewed"].includes(status)) return "success";
  if (status === "failed") return "error";
  if (["processing", "generating", "uploaded"].includes(status)) return "warning";
  if (status === "ai-generated") return "brand";
  return "neutral";
}

function SessionProcessingSummary({ session }: { session: SessionSummaryValue }) {
  const transcript = session.transcriptStatus === "none" ? "No transcript" : session.transcriptStatus === "complete" ? "Ready" : session.transcriptStatus[0].toUpperCase() + session.transcriptStatus.slice(1);
  const items = [{ label: "Transcript", value: transcript, status: session.transcriptStatus }, { label: "Themes", value: workflowStatusLabel(session.themeStatus), status: session.themeStatus }, { label: "Session Report", value: workflowStatusLabel(session.reportStatus), status: session.reportStatus }];
  return <section className="rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5"><h2 className="text-base font-semibold">Processing status</h2><div className="mt-4 grid gap-3">{items.map((item) => <div className="flex items-center justify-between gap-3" key={item.label}><span className="text-sm text-[var(--air-color-text-secondary)]">{item.label}</span><Badge showIcon={false} tone={tone(item.status)}>{item.value}</Badge></div>)}</div></section>;
}

function initials(participant: ParticipantSummary) { return `${participant.firstName.at(0) ?? ""}${participant.lastName.at(0) ?? ""}`.toUpperCase(); }
function fullName(participant: ParticipantSummary) { return `${participant.firstName} ${participant.lastName}`.trim(); }

function ParticipantEditAction({ opensDownward = false, onEdit, participant }: { opensDownward?: boolean; onEdit?: (participantId: string) => void; participant: ParticipantSummary }) {
  if (!onEdit) return null;
  const name = fullName(participant);
  return (
    <Tooltip content="Edit participant" placement={opensDownward ? "bottom-end" : "top-end"}>
      <IconButton icon={<Pencil aria-hidden="true" className="h-4 w-4" />} label={`Edit participant: ${name}`} onClick={() => onEdit(participant.id)} />
    </Tooltip>
  );
}

function ParticipantRemoveAction({ disabled = false, opensDownward = false, onRemove, participant }: { disabled?: boolean; opensDownward?: boolean; onRemove?: (participant: ParticipantSummary) => void; participant: ParticipantSummary }) {
  if (!onRemove) return null;
  const name = fullName(participant);
  return (
    <Tooltip content="Remove participant from Session" placement={opensDownward ? "bottom-end" : "top-end"}>
      <IconButton disabled={disabled} icon={<Trash2 aria-hidden="true" className="h-4 w-4" />} label={`Remove participant from Session: ${name}`} onClick={() => onRemove(participant)} />
    </Tooltip>
  );
}

function ParticipantActions({ disabled = false, opensDownward = false, onEdit, onRemove, participant }: { disabled?: boolean; opensDownward?: boolean; onEdit?: (participantId: string) => void; onRemove?: (participant: ParticipantSummary) => void; participant: ParticipantSummary }) {
  return <div className="flex justify-end gap-2"><ParticipantEditAction opensDownward={opensDownward} onEdit={onEdit} participant={participant} /><ParticipantRemoveAction disabled={disabled} opensDownward={opensDownward} onRemove={onRemove} participant={participant} /></div>;
}

function SessionParticipants({ actionError, actionPending = false, onAdd, onEdit, onRemove, participants }: { actionError?: React.ReactNode; actionPending?: boolean; onAdd?: () => void; onEdit?: (participantId: string) => void; onRemove?: (participantId: string) => void; participants: ParticipantSummary[] }) {
  const [participantToRemove, setParticipantToRemove] = React.useState<ParticipantSummary>();
  const participantName = participantToRemove ? fullName(participantToRemove) : "";
  return <>
    <section aria-labelledby="session-participants-heading" className="overflow-hidden rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)]">
      <header className="flex flex-wrap items-center gap-3 p-5"><h2 className="text-xl font-semibold" id="session-participants-heading">Session participants</h2><span className="text-sm text-[var(--air-color-text-secondary)]">{participants.length} participants</span>{onAdd ? <Button className="ml-auto" onClick={onAdd} size="small" variant="gray-subtle">Add participant</Button> : null}</header>
      {actionError ? <Alert className="mx-5 mb-5 w-auto" message={actionError} size="large" title="Participant could not be removed" tone="error" /> : null}
      {!participants.length ? <EmptyState className="border-0" description="Assign Project participants to this Session." title="No participants assigned" /> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[56rem] text-left text-sm"><thead className="bg-[var(--air-color-bg-subtle)]"><tr><th className="p-4 font-medium">Participant</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Organization</th><th className="p-4 font-medium">Notes</th><th className="w-28 p-4 text-right font-medium">Actions</th></tr></thead><tbody>{participants.map((participant, index) => <tr className="border-t border-[var(--air-color-border-default)]" key={participant.id}><th className="p-4 font-medium"><span className="flex items-center gap-3"><Avatar alt={fullName(participant)} initials={initials(participant)} size="large" />{fullName(participant)}</span></th><td className="p-4">{participant.role ?? "Not provided"}</td><td className="p-4">{participant.organization ?? "Not provided"}</td><td className="max-w-xs truncate p-4 text-[var(--air-color-text-secondary)]">{participant.researcherNotes ?? "No notes"}</td><td className="w-28 p-4"><ParticipantActions disabled={actionPending} opensDownward={index === 0} onEdit={onEdit} onRemove={onRemove ? setParticipantToRemove : undefined} participant={participant} /></td></tr>)}</tbody></table></div>
        <div className="grid divide-y divide-[var(--air-color-border-default)] md:hidden">{participants.map((participant, index) => <article className="grid gap-3 p-4" key={participant.id}><div className="flex items-center gap-3"><Avatar alt={fullName(participant)} initials={initials(participant)} size="large" /><h3 className="font-semibold">{fullName(participant)}</h3><div className="ml-auto"><ParticipantActions disabled={actionPending} opensDownward={index === 0} onEdit={onEdit} onRemove={onRemove ? setParticipantToRemove : undefined} participant={participant} /></div></div><dl className="grid gap-2 text-sm"><div><dt className="text-xs font-semibold uppercase text-[var(--air-color-text-secondary)]">Role</dt><dd>{participant.role ?? "Not provided"}</dd></div><div><dt className="text-xs font-semibold uppercase text-[var(--air-color-text-secondary)]">Organization</dt><dd>{participant.organization ?? "Not provided"}</dd></div><div><dt className="text-xs font-semibold uppercase text-[var(--air-color-text-secondary)]">Notes</dt><dd>{participant.researcherNotes ?? "No notes"}</dd></div></dl></article>)}</div>
      </>}
    </section>
    <Dialog
      description={<>Remove {participantName} from this Session? They will remain in Project participants and can be added again.</>}
      intent="destructive"
      onOpenChange={(open) => { if (!open) setParticipantToRemove(undefined); }}
      onPrimary={() => { if (participantToRemove) onRemove?.(participantToRemove.id); }}
      open={Boolean(participantToRemove)}
      primaryDisabled={actionPending}
      primaryLabel="Remove participant"
      title="Remove participant from Session?"
    />
  </>;
}

export interface SessionDetailViewProps {
  activeTab: "overview" | "participants" | "transcript" | "themes" | "report" | "ask";
  onAddParticipant?: () => void;
  onEditParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  onEditSession?: () => void;
  onRetry?: () => void;
  participantActionError?: React.ReactNode;
  participantActionPending?: boolean;
  projectId: string;
  projectName: string;
  recordSynthesisRequirementsNote?: React.ReactNode;
  routeState?: "ready" | "loading" | "error" | "not-found";
  session?: SessionSummaryValue;
  participantsContent?: React.ReactNode;
  transcriptContent?: React.ReactNode;
  workspaceContent?: React.ReactNode;
}

export function SessionDetailView({ activeTab, onAddParticipant, onEditParticipant, onEditSession, onRemoveParticipant, onRetry, participantActionError, participantActionPending = false, participantsContent, projectId, projectName, recordSynthesisRequirementsNote, routeState = "ready", session, transcriptContent, workspaceContent }: SessionDetailViewProps) {
  const root = session ? `/projects/${projectId}/sessions/${session.id}` : `/projects/${projectId}/sessions`;
  if (routeState === "loading") return <SharedRouteState state="loading" />;
  if (routeState === "error") return <SharedRouteState onRetry={onRetry} state="recoverable-error" />;
  if (routeState === "not-found" || !session) return <SharedRouteState returnHref={`/projects/${projectId}/sessions`} state="not-found" />;
  const descriptions = {
    overview: "Review Session details, relationships, participants, and analysis readiness.",
    participants: "Review and manage the people who participated in this Session.",
    transcript: "Upload, process, review, and search transcript source material for this Session.",
    themes: "Generate, review, and approve evidence-backed themes from this Session.",
    report: "Review the structured requirements, decisions, actions, questions, and insights from this Session.",
    ask: "Ask grounded questions using only this Session’s transcript and evidence.",
  };
  const overviewContent = <div className="grid min-w-0 gap-4 lg:grid-cols-2 [&>*]:min-w-0"><SessionParticipantGroup onAddParticipant={onAddParticipant} participants={session.participants} /><SessionProcessingSummary session={session} /></div>;
  const resolvedRecordSynthesisRequirementsNote = recordSynthesisRequirementsNote === undefined
    ? <RecordSynthesisRequirementsNote />
    : recordSynthesisRequirementsNote;
  const content = activeTab === "overview" ? <div className="grid min-w-0 gap-6">{overviewContent}{resolvedRecordSynthesisRequirementsNote}</div> : activeTab === "participants" ? participantsContent ?? <SessionParticipants actionError={participantActionError} actionPending={participantActionPending} onAdd={onAddParticipant} onEdit={onEditParticipant} onRemove={onRemoveParticipant} participants={session.participants} /> : activeTab === "transcript" ? transcriptContent : workspaceContent;
  return <div className="grid min-w-0 gap-6 [&>*]:min-w-0"><PageHeader breadcrumbs={[{ href: "/projects", label: "Projects" }, { href: `/projects/${projectId}/overview`, label: projectName }, { href: `/projects/${projectId}/sessions`, label: "Sessions" }, { label: session.title }]} description={descriptions[activeTab]} title={session.title} /><SessionSummary onEditSession={onEditSession} session={session} /><SectionNavigation activeId={activeTab} items={sessionTabs(root)} label="Session sections" />{content}</div>;
}

export interface SessionParticipantCreateViewProps
  extends SessionParticipantFormProps {
  onEditSession?: () => void;
  onRetry?: () => void;
  projectId: string;
  projectName: string;
  routeState?: "ready" | "loading" | "error" | "not-found";
  session?: SessionSummaryValue;
}

export function SessionParticipantCreateView({
  onEditSession,
  onRetry,
  projectId,
  projectName,
  routeState = "ready",
  session,
  ...formProps
}: SessionParticipantCreateViewProps) {
  const form = (
    <section aria-labelledby="add-participant-heading" className="grid gap-4">
      <h2 className="text-xl font-semibold" id="add-participant-heading">Add participant</h2>
      <SessionParticipantForm {...formProps} existingParticipantHeadingLevel={3} />
    </section>
  );

  return (
    <SessionDetailView
      activeTab="participants"
      onEditSession={onEditSession}
      onRetry={onRetry}
      participantsContent={form}
      projectId={projectId}
      projectName={projectName}
      routeState={routeState}
      session={session}
    />
  );
}

export interface SessionFormViewProps extends SessionFormProps { projectId: string; projectName: string; }
export function SessionFormView({ projectId, projectName, mode, ...props }: SessionFormViewProps) {
  return <div className="grid gap-6"><PageHeader breadcrumbs={[{ href: "/projects", label: "Projects" }, { href: `/projects/${projectId}/overview`, label: projectName }, { href: `/projects/${projectId}/sessions`, label: "Sessions" }, { label: mode === "create" ? "New session" : "Edit session" }]} description={mode === "create" ? "Create a Session within this Project." : "Update Session details and participant assignments."} title={mode === "create" ? "New session" : "Edit session"} /><SessionForm mode={mode} {...props} /></div>;
}
