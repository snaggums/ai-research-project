import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ParticipantSummary } from "@/domain/types";
import { cn } from "@/lib/utils";
import { participantInitials, participantName } from "./session-presentation";

export interface SessionParticipantGroupProps extends React.HTMLAttributes<HTMLElement> {
  onAddParticipant?: () => void;
  onRetry?: () => void;
  participants: ParticipantSummary[];
  state?: "ready" | "loading" | "error";
}

export function SessionParticipantGroup({ className, onAddParticipant, onRetry, participants, state = "ready", ...props }: SessionParticipantGroupProps) {
  const empty = state === "ready" && participants.length === 0;
  const visibleNames = participants.slice(0, 2).map(participantName);
  const remainingNames = Math.max(0, participants.length - visibleNames.length);
  const participantSummary = remainingNames
    ? `${visibleNames.join(", ")}, plus ${remainingNames} more`
    : visibleNames.join(", ");
  return (
    <section className={cn("rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5", className)} aria-labelledby="session-participants-title" {...props}>
      <header className="flex flex-wrap items-center gap-3"><h2 className="text-base font-semibold" id="session-participants-title">Participants</h2>{state === "ready" ? <Badge showIcon={false}>{participants.length}</Badge> : null}<div className="ml-auto">{onAddParticipant ? <Button onClick={onAddParticipant} size="small" variant="gray-subtle">Add participant</Button> : null}</div></header>
      {state === "loading" ? <div className="mt-5 flex items-center gap-3 text-sm text-[var(--air-color-text-secondary)]"><Spinner label="Loading participants" size="small" />Loading participants</div> : null}
      {state === "error" ? <Alert className="mt-5" message={onRetry ? <Button onClick={onRetry} size="small" variant="gray-subtle">Try again</Button> : undefined} size={onRetry ? "large" : "small"} title="Participants could not be loaded" tone="error" /> : null}
      {empty ? <p className="mt-5 text-sm text-[var(--air-color-text-secondary)]">No participants are assigned to this Session.</p> : null}
      {state === "ready" && participants.length ? <div className="mt-5 flex items-center gap-4"><div aria-label={`Participants: ${participants.map(participantName).join(", ")}`} className="flex shrink-0 -space-x-2">{participants.slice(0, 2).map((participant) => <Avatar alt={participantName(participant)} initials={participantInitials(participant)} key={participant.id} size="large" />)}{participants.length > 2 ? <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] text-xs font-semibold">+{participants.length - 2}</span> : null}</div><div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--air-color-text-primary)]">{participantSummary}</p><p className="text-sm text-[var(--air-color-text-secondary)]">Roles and organizations available on Participants tab.</p></div></div> : null}
    </section>
  );
}
