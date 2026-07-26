import * as React from "react";

import { Button } from "@/components/ui/button";
import type { SessionSummary as SessionSummaryValue } from "@/domain/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatSessionDate, participantName, sessionTypeLabels } from "./session-presentation";

export interface SessionSummaryProps extends React.HTMLAttributes<HTMLElement> {
  onEditSession?: () => void;
  session: SessionSummaryValue;
}

function summarizedNames(names: string[], emptyValue: string) {
  if (!names.length) return { accessible: emptyValue, visible: emptyValue };
  if (names.length === 1) return { accessible: names[0], visible: names[0] };
  return { accessible: names.join(", "), visible: `${names[0]} +${names.length - 1} more` };
}

function StripValue({ accessible, children }: { accessible?: string; children: React.ReactNode }) {
  if (!accessible) return children;
  return <span aria-label={accessible} title={accessible}>{children}</span>;
}

export function SessionSummary({ className, onEditSession, session, ...props }: SessionSummaryProps) {
  const participantNames = session.participants.map(participantName);
  const participants = summarizedNames(participantNames, "No participants");
  const records = summarizedNames(session.relatedRecords.map((record) => record.name), "No related Record");
  const items = [
    { className: "air-session-summary__item--type", label: "Type", value: sessionTypeLabels[session.type] },
    { className: "air-session-summary__item--date", label: "Date", value: formatSessionDate(session.startsAt, false, "long") },
    { className: "air-session-summary__item--duration", label: "Duration", value: formatDuration(session.durationMinutes) },
    { accessible: participants.accessible, className: "air-session-summary__item--participants", label: "Participants", value: participants.visible },
    { accessible: records.accessible, className: "air-session-summary__item--record", label: "Related Record", value: records.visible },
  ];

  return <section aria-label="Session summary" className={cn("air-session-summary grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-[var(--air-radius-xl)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4 sm:gap-6 sm:p-6", className)} {...props}>
    <dl className="air-session-summary__metadata flex min-w-0 flex-wrap items-center">
      {items.map((item, index) => (
        <div className={cn("air-session-summary__item min-w-0", item.className, index === 0 && "air-session-summary__item--first")} key={item.label}>
          <dt className="text-xs font-medium leading-4 text-[var(--air-color-text-secondary)]">{item.label}</dt>
          <dd className="mt-1 break-words text-sm leading-5 text-[var(--air-color-text-primary)]">
            <StripValue accessible={item.accessible}>{item.value}</StripValue>
          </dd>
        </div>
      ))}
    </dl>
    {onEditSession ? <Button className="min-w-[6.25rem] shrink-0" onClick={onEditSession} size="small" variant="gray-subtle">Edit session</Button> : null}
  </section>;
}
