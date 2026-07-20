import * as React from "react";
import { CircleAlert, CircleCheck, Clock3, LoaderCircle } from "lucide-react";

import type { ProcessingStatus as ProcessingStatusValue } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface ProcessingStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  detail?: React.ReactNode;
  label?: string;
  progress?: number;
  status: ProcessingStatusValue;
}

const statusPresentation = {
  uploaded: { icon: Clock3, label: "Uploaded", tone: "text-[var(--air-color-text-secondary)]" },
  processing: { icon: LoaderCircle, label: "Processing", tone: "text-[var(--air-color-text-brand)]" },
  complete: { icon: CircleCheck, label: "Complete", tone: "text-[var(--air-color-text-success)]" },
  failed: { icon: CircleAlert, label: "Processing failed", tone: "text-[var(--air-color-text-error)]" },
} satisfies Record<ProcessingStatusValue, { icon: typeof Clock3; label: string; tone: string }>;

export function ProcessingStatus({
  className,
  detail,
  label,
  progress,
  status,
  ...props
}: ProcessingStatusProps) {
  const presentation = statusPresentation[status];
  const Icon = presentation.icon;
  const clampedProgress = Math.max(0, Math.min(100, progress ?? 0));
  return (
    <div
      aria-live={status === "processing" ? "polite" : undefined}
      className={cn("grid gap-2", className)}
      role={status === "failed" ? "alert" : "status"}
      {...props}
    >
      <div className={cn("flex items-center gap-2 text-sm font-medium", presentation.tone)}>
        <Icon aria-hidden="true" className={cn("h-4 w-4", status === "processing" && "animate-spin")} />
        <span>{label ?? presentation.label}</span>
      </div>
      {detail ? <div className="text-sm text-[var(--air-color-text-secondary)]">{detail}</div> : null}
      {status === "processing" && progress !== undefined ? (
        <div
          aria-label={`${label ?? presentation.label}: ${clampedProgress}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={clampedProgress}
          className="h-2 overflow-hidden rounded-full bg-[var(--air-color-bg-active)]"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[var(--air-color-interaction-progress)] transition-[width]"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

