import type { CSSProperties } from "react";
import { Check, Highlighter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TranscriptSelectionToolbarProps {
  className?: string;
  highlighted?: boolean;
  onHighlight: () => void;
  style?: CSSProperties;
}

export function TranscriptSelectionToolbar({
  className,
  highlighted = false,
  onHighlight,
  style,
}: TranscriptSelectionToolbarProps) {
  return (
    <div
      aria-label="Transcript selection actions"
      className={cn(
        "flex w-fit items-center gap-1 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-1 shadow-[var(--air-shadow-overlay)]",
        className,
      )}
      data-selection-toolbar="true"
      role="toolbar"
      style={style}
    >
      <Button disabled={highlighted} onClick={onHighlight} size="small" variant="text">
        {highlighted ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Highlighter aria-hidden="true" className="h-4 w-4" />
        )}
        {highlighted ? "Highlighted" : "Highlight"}
      </Button>
    </div>
  );
}
