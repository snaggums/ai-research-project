import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import type { ParticipantSummary } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface ParticipantListItemProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  layout?: "responsive" | "default" | "compact";
  onDelete?: () => void;
  onEdit?: () => void;
  participant: ParticipantSummary;
  showActions?: boolean;
  showNoteExcerpt?: boolean;
  showPersona?: boolean;
  showReferenceId?: boolean;
}

function participantName(participant: ParticipantSummary) {
  return `${participant.firstName} ${participant.lastName}`.trim();
}

function participantInitials(participant: ParticipantSummary) {
  return `${participant.firstName.at(0) ?? ""}${participant.lastName.at(0) ?? ""}`.toUpperCase();
}

export function ParticipantListItem({
  className,
  href,
  layout = "responsive",
  onDelete,
  onEdit,
  participant,
  showActions = true,
  showNoteExcerpt = true,
  showPersona = true,
  showReferenceId = true,
  ...props
}: ParticipantListItemProps) {
  const name = participantName(participant);
  const roleAndOrganization = [participant.role, participant.organization].filter(Boolean).join(" · ");
  const compact = layout === "compact";
  const horizontal = layout === "default";

  return (
    <article
      className={cn(
        "air-participant-list-item relative rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 transition-colors",
        compact ? "flex flex-col gap-4" : horizontal ? "flex items-center gap-4 p-5" : "flex flex-col gap-4 md:flex-row md:items-center md:p-5",
        className,
      )}
      {...props}
    >
      <a
        aria-label={`Open ${name}`}
        className="air-participant-list-item-link absolute inset-0 z-[1] rounded-[var(--air-radius-lg)] outline-none"
        href={href}
      />
      <div className={cn("pointer-events-none relative z-[2] flex min-w-0 gap-4", (horizontal || layout === "responsive") && "md:flex-1")}>
        <Avatar alt={name} initials={participantInitials(participant)} size="large" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="truncate text-lg font-semibold">{name}</h3>
            {showReferenceId && participant.referenceId ? (
              <span className="text-xs text-[var(--air-color-text-secondary)]">{participant.referenceId}</span>
            ) : null}
          </div>
          {roleAndOrganization ? (
            <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">{roleAndOrganization}</p>
          ) : null}
          {showPersona && participant.persona ? (
            <Badge className="mt-2" showIcon={false} tone="neutral">{participant.persona}</Badge>
          ) : null}
          {showNoteExcerpt && participant.researcherNotes ? (
            <p className="mt-2 line-clamp-2 text-sm text-[var(--air-color-text-secondary)]">{participant.researcherNotes}</p>
          ) : null}
        </div>
      </div>

      <div className={cn(
        "relative z-10 flex shrink-0 items-center gap-2",
        compact ? "justify-between" : horizontal ? "ml-auto" : "justify-between md:ml-auto md:justify-end",
      )}>
        <Badge showIcon={false} tone="neutral">
          {participant.sessionCount} {participant.sessionCount === 1 ? "session" : "sessions"}
        </Badge>
        {showActions && (onEdit || onDelete) ? (
          <div className="flex items-center gap-2">
            {onEdit ? (
              <IconButton
                icon={<Pencil aria-hidden="true" className="h-4 w-4" />}
                label={`Edit ${name}`}
                onClick={onEdit}
                variant="gray-subtle"
              />
            ) : null}
            {onDelete ? (
              <IconButton
                icon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
                label={`Delete ${name}`}
                onClick={onDelete}
                variant="gray-subtle"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
