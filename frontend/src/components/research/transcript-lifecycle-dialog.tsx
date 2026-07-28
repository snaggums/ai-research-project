import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";

export type TranscriptLifecycleAction = "replace" | "delete";

export type TranscriptDependencySummary = {
  acceptedHighlightCount: number;
  uncodedHighlightCount: number;
  codeSuggestionRunCount: number;
  sessionReportCount: number;
  recordSynthesisCount: number;
  isPrimary?: boolean;
  retentionConsequence?: "preserve-lineage";
  version?: string;
};

export interface TranscriptLifecycleDialogProps {
  action: TranscriptLifecycleAction;
  defaultOpen?: boolean;
  dependencies?: TranscriptDependencySummary;
  filename: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: React.ReactElement;
}

const emptyDependencies: TranscriptDependencySummary = {
  acceptedHighlightCount: 0,
  uncodedHighlightCount: 0,
  codeSuggestionRunCount: 0,
  sessionReportCount: 0,
  recordSynthesisCount: 0,
};

type TranscriptDependencyCountKey =
  | "acceptedHighlightCount"
  | "uncodedHighlightCount"
  | "codeSuggestionRunCount"
  | "sessionReportCount"
  | "recordSynthesisCount";

const dependencyLabels: Array<[TranscriptDependencyCountKey, string, string]> = [
  ["acceptedHighlightCount", "accepted Highlight", "accepted Highlights"],
  ["uncodedHighlightCount", "uncoded Highlight", "uncoded Highlights"],
  ["codeSuggestionRunCount", "Code suggestion run", "Code suggestion runs"],
  ["sessionReportCount", "Session Report", "Session Reports"],
  ["recordSynthesisCount", "Record Synthesis", "Record Syntheses"],
];

export function TranscriptLifecycleDialog({
  action,
  defaultOpen,
  dependencies = emptyDependencies,
  filename,
  onCancel,
  onConfirm,
  onOpenChange,
  open,
  trigger,
}: TranscriptLifecycleDialogProps) {
  const hasDependencies = dependencyLabels.some(([key]) => dependencies[key] > 0);
  const replacing = action === "replace";
  const title = replacing
    ? hasDependencies ? "Replace transcript with linked evidence?" : "Replace transcript?"
    : hasDependencies ? "Delete transcript with linked evidence?" : "Delete transcript?";
  const description = replacing
    ? <>Replace <strong>{filename}</strong> with the selected file. The current Transcript remains active until the replacement processes successfully.</>
    : <>Remove <strong>{filename}</strong> as the active Transcript. AIR retains a tombstoned source in research history; this is not permanent data purging.</>;

  return (
    <Dialog
      defaultOpen={defaultOpen}
      description={description}
      intent={replacing ? "default" : "destructive"}
      onCancel={onCancel}
      onOpenChange={onOpenChange}
      onPrimary={onConfirm}
      open={open}
      primaryLabel={replacing ? "Replace transcript" : "Delete transcript"}
      size="large"
      title={title}
      trigger={trigger}
    >
      <div className="grid gap-4">
        {hasDependencies ? (
          <div
            aria-label="Linked evidence"
            className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4"
          >
            <p className="font-medium">Linked evidence</p>
            <dl className="mt-2 grid gap-1 text-sm">
              {dependencyLabels.map(([key, singular, plural]) => (
                <div className="flex justify-between gap-4" key={key}>
                  <dt>{dependencies[key] === 1 ? singular : plural}</dt>
                  <dd className="font-semibold">{dependencies[key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        <Alert
          message={
            replacing
              ? "After activation, the previous Transcript and linked evidence remain in research history. The current Session Report is superseded and Record Synthesis becomes out of date."
              : "The Session will have no active Transcript. Linked evidence remains in research history, archived Highlights stop contributing to current counts, and current results become out of date."
          }
          presentation="contained"
          size="small"
          title={replacing ? "Previous evidence is preserved" : "Research history is preserved"}
          tone="warning"
        />
      </div>
    </Dialog>
  );
}
