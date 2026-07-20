import * as React from "react";

import { MetadataList } from "@/components/application/metadata-list";
import type { SessionSummary as SessionSummaryValue } from "@/domain/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatSessionDate, referenceNames, sessionTypeLabels } from "./session-presentation";

export interface SessionSummaryProps extends React.HTMLAttributes<HTMLElement> {
  layout?: "responsive" | "default" | "compact";
  session: SessionSummaryValue;
  showRelationships?: boolean;
}

function SummarySection({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5"><h2 className="text-base font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

export function SessionSummary({ className, layout = "responsive", session, showRelationships = true, ...props }: SessionSummaryProps) {
  const compact = layout === "compact";
  return (
    <div className={cn("grid gap-4", !compact && "md:grid-cols-2", className)} {...props}>
      <SummarySection title="Session details">
        <MetadataList layout="stacked" items={[
          { label: "Session type", value: sessionTypeLabels[session.type] },
          { label: "Date", value: formatSessionDate(session.startsAt, false) },
          { label: "Duration", value: formatDuration(session.durationMinutes) },
        ]} />
      </SummarySection>
      {showRelationships ? (
        <SummarySection title="Relationships">
          <MetadataList layout="stacked" items={[
            { label: "Record", value: referenceNames(session.relatedRecords) },
          ]} />
        </SummarySection>
      ) : null}
    </div>
  );
}
