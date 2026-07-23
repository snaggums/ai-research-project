import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export interface TranscriptCodeChipProps {
  className?: string;
  codeName: string;
  disabled?: boolean;
  onRemove?: () => void;
  presentation?: "highlighted" | "surface";
  removable?: boolean;
  removeLabel?: string;
}

export function TranscriptCodeChip({
  className,
  codeName,
  disabled,
  onRemove,
  presentation = "surface",
  removable = true,
  removeLabel,
}: TranscriptCodeChipProps) {
  return (
    <Chip
      className={cn(
        presentation === "highlighted"
          ? "bg-[var(--air-color-bg-surface)] hover:bg-[var(--air-color-bg-subtle)]"
          : "bg-[var(--air-color-interaction-accent-subtle)] hover:bg-[var(--air-color-bg-selected-hover)]",
        className,
      )}
      disabled={disabled}
      onRemove={onRemove}
      removable={removable}
      removeLabel={removeLabel ?? `Remove ${codeName} code`}
      selected={presentation === "surface"}
      size="small"
    >
      {codeName}
    </Chip>
  );
}
