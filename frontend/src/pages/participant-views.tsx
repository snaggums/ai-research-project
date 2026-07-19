import { Plus } from "lucide-react";

import {
  EmptyState,
  EntityCollection,
  PageHeader,
  SectionNavigation,
  SharedRouteState,
} from "@/components/application";
import { ParticipantForm, type ParticipantFormProps } from "@/components/research/participant-form";
import { ParticipantListItem } from "@/components/research/participant-list-item";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import type { ParticipantSummary } from "@/domain/types";

const participantName = (participant: ParticipantSummary) =>
  `${participant.firstName} ${participant.lastName}`.trim();

function ProjectSections({ activeId, projectId }: { activeId: "participants"; projectId: string }) {
  const root = `/projects/${projectId}`;
  return (
    <SectionNavigation
      activeId={activeId}
      items={[
        { id: "overview", label: "Overview", href: `${root}/overview` },
        { id: "participants", label: "Participants", href: `${root}/participants` },
        { id: "sessions", label: "Sessions", href: `${root}/sessions` },
        { id: "ask", label: "Ask this project", href: `${root}/ask` },
      ]}
      label="Project sections"
    />
  );
}

export interface ParticipantsCollectionViewProps {
  onDeleteParticipant?: (participant: ParticipantSummary) => void;
  onEditParticipant?: (participant: ParticipantSummary) => void;
  onRetry?: () => void;
  onSearchChange: (value: string) => void;
  participants: ParticipantSummary[];
  projectId: string;
  projectName: string;
  search: string;
  state?: "ready" | "loading" | "empty" | "error" | "not-found";
}

export function ParticipantsCollectionView({
  onDeleteParticipant,
  onEditParticipant,
  onRetry,
  onSearchChange,
  participants,
  projectId,
  projectName,
  search,
  state = "ready",
}: ParticipantsCollectionViewProps) {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = participants.filter((participant) =>
    `${participantName(participant)} ${participant.email ?? ""}`.toLowerCase().includes(normalizedSearch),
  );
  const collectionState = state === "ready" && normalizedSearch && !filtered.length ? "no-results" : state;
  const root = `/projects/${projectId}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={(
          <Button asChild size="small">
            <a href={`${root}/participants/new`}><Plus aria-hidden="true" className="h-4 w-4" />Add participants</a>
          </Button>
        )}
        breadcrumbs={[
          { href: "/projects", label: "Projects" },
          { href: `${root}/overview`, label: projectName },
          { label: "Participants" },
        ]}
        description="Manage people participating in this project."
        title="Participants"
      />
      <ProjectSections activeId="participants" projectId={projectId} />
      {state === "not-found" ? (
        <SharedRouteState returnHref="/projects" state="not-found" />
      ) : (
        <EntityCollection
          actions={(
            <div className="w-full sm:w-[19rem]">
              <SearchField
                aria-label="Search participants"
                onChange={(event) => onSearchChange(event.currentTarget.value)}
                placeholder="Search by name or email"
                value={search}
              />
            </div>
          )}
          countLabel={state === "loading"
            ? "Loading participants..."
            : `${filtered.length} ${filtered.length === 1 ? "participant" : "participants"}`}
          countPosition="below"
          state={collectionState === "not-found" ? "error" : collectionState}
          stateContent={state === "empty" ? (
            <EmptyState
              description="Add the first participant to make them available for this project's sessions."
              primaryAction={<Button asChild size="small"><a href={`${root}/participants/new`}>Add participant</a></Button>}
              title="No participants yet"
            />
          ) : state === "error" ? (
            <div className="mx-auto grid max-w-xl gap-3 py-16">
              <Alert
                message="Check your connection and try again. Existing participant data has not been changed."
                size="large"
                title="Participants could not be loaded"
                tone="error"
              />
              {onRetry ? <Button className="mx-auto" onClick={onRetry} size="small">Retry</Button> : null}
            </div>
          ) : undefined}
          title="All participants"
        >
          <div className="grid gap-4">
            {filtered.map((participant) => (
              <ParticipantListItem
                href={`${root}/participants/${participant.id}`}
                key={participant.id}
                onDelete={onDeleteParticipant ? () => onDeleteParticipant(participant) : undefined}
                onEdit={onEditParticipant ? () => onEditParticipant(participant) : undefined}
                participant={participant}
                showNoteExcerpt={false}
                showPersona={false}
                showReferenceId={false}
              />
            ))}
          </div>
        </EntityCollection>
      )}
    </div>
  );
}

export interface ParticipantDetailViewProps extends Omit<ParticipantFormProps, "showHeader"> {
  onRetry?: () => void;
  participant?: ParticipantSummary;
  projectId: string;
  projectName: string;
  routeState?: "ready" | "loading" | "error" | "not-found";
}

export function ParticipantDetailView({
  mode,
  onRetry,
  participant,
  projectId,
  projectName,
  routeState = "ready",
  ...formProps
}: ParticipantDetailViewProps) {
  const isCreate = mode === "create";
  const name = participant ? participantName(participant) : "participant";

  return (
    <div className="grid gap-6">
      <PageHeader
        description={isCreate
          ? "Add a participant to this project's research directory."
          : `View and update ${name}'s participant profile.`}
        title={isCreate ? "Add participant" : "Participant Details"}
      />
      <ProjectSections activeId="participants" projectId={projectId} />
      {routeState === "loading" ? <SharedRouteState state="loading" /> : null}
      {routeState === "error" ? <SharedRouteState onRetry={onRetry} state="recoverable-error" /> : null}
      {routeState === "not-found" ? (
        <SharedRouteState returnHref={`/projects/${projectId}/participants`} state="not-found" />
      ) : null}
      {routeState === "ready" ? (
        <ParticipantForm mode={mode} showHeader {...formProps} />
      ) : null}
      <span className="sr-only">Current project: {projectName}</span>
    </div>
  );
}
