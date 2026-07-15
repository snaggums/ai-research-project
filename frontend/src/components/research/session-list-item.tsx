import * as React from "react";
import { CalendarDays, FileText, Pencil, Trash2, Users } from "lucide-react";

import { DropdownMenu, type DropdownMenuItem } from "@/components/application/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { SessionSummary } from "@/domain/types";
import { cn } from "@/lib/utils";
import { formatSessionDate, participantInitials, participantName, sessionTypeLabels } from "./session-presentation";

export interface SessionListItemProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  onDelete?: () => void;
  onEdit?: () => void;
  session: SessionSummary;
  showActions?: boolean;
}

function transcriptPresentation(session: SessionSummary) {
  if (session.hasPrimaryTranscript) return { label: "Primary transcript", tone: "success" as const };
  if (session.transcriptStatus === "complete") return { label: "Transcript ready", tone: "success" as const };
  if (session.transcriptStatus === "processing" || session.transcriptStatus === "uploaded") return { label: "Processing transcript", tone: "warning" as const };
  if (session.transcriptStatus === "failed") return { label: "Processing failed", tone: "error" as const };
  return { label: "No transcript", tone: "neutral" as const };
}

export function SessionListItem({ className, href, onDelete, onEdit, session, showActions = true, ...props }: SessionListItemProps) {
  const transcript = transcriptPresentation(session);
  const menuItems: DropdownMenuItem[] = [
    ...(onEdit ? [{ id: "edit", label: "Edit session", icon: Pencil } satisfies DropdownMenuItem] : []),
    ...(onDelete ? [{ id: "delete", label: "Delete session", icon: Trash2, tone: "destructive" } satisfies DropdownMenuItem] : []),
  ];

  return (
    <article className={cn("air-session-item relative rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 transition-colors md:p-5", className)} {...props}>
      <a aria-label={`Open ${session.title}`} className="air-session-item-link absolute inset-0 z-[1] rounded-[var(--air-radius-lg)] outline-none" href={href} />
      <div className="pointer-events-none relative z-[2] flex min-w-0 flex-col gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate text-lg font-semibold">{session.title}</h3>
            <Badge showIcon={false} tone="neutral">{sessionTypeLabels[session.type]}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--air-color-text-secondary)]">
            <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4" />{formatSessionDate(session.startsAt)}</span>
            <span className="inline-flex items-center gap-2"><Users aria-hidden="true" className="h-4 w-4" />{session.participants.length} {session.participants.length === 1 ? "participant" : "participants"}</span>
            <span className="inline-flex items-center gap-2"><FileText aria-hidden="true" className="h-4 w-4" />{session.documentCount} {session.documentCount === 1 ? "document" : "documents"}</span>
          </div>
          {session.participants.length ? (
            <div aria-label={`Participants: ${session.participants.map(participantName).join(", ")}`} className="mt-3 flex -space-x-1.5">
              {session.participants.slice(0, 3).map((participant) => <Avatar alt={participantName(participant)} initials={participantInitials(participant)} key={participant.id} size="medium" />)}
              {session.participants.length > 3 ? <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] text-[10px] font-semibold">+{session.participants.length - 3}</span> : null}
            </div>
          ) : null}
        </div>
        <Badge showIcon={false} tone={transcript.tone}>{transcript.label}</Badge>
      </div>
      {showActions && menuItems.length ? (
        <div className="absolute bottom-4 right-4 z-10 md:bottom-5 md:right-5">
          <DropdownMenu items={menuItems} label={`Actions for ${session.title}`} onSelect={(item) => item.id === "edit" ? onEdit?.() : onDelete?.()} />
        </div>
      ) : null}
    </article>
  );
}
