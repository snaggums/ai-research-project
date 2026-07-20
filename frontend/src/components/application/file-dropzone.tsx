import * as React from "react";
import { FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  accept?: string;
  browseLabel?: string;
  description?: string;
  disabled?: boolean;
  helperText?: string;
  label?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  onReject?: (message: string) => void;
  selectedFiles?: File[];
  title?: string;
}

export function FileDropzone({
  accept = ".txt,.doc,.docx,.pdf",
  browseLabel,
  className,
  description = "or choose files from your device",
  disabled = false,
  helperText = "TXT, DOCX, or PDF",
  label = "Upload transcript",
  maxSizeBytes = 10 * 1024 * 1024,
  multiple = true,
  onFilesSelected,
  onReject,
  selectedFiles = [],
  title = "Drag and drop a transcript",
  ...props
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();

  const validateAndSelect = (files: File[]) => {
    const extensions = accept.split(",").map((value) => value.trim().toLowerCase()).filter((value) => value.startsWith("."));
    const unsupported = files.find((file) => extensions.length && !extensions.some((extension) => file.name.toLowerCase().endsWith(extension)));
    if (unsupported) {
      onReject?.(`${unsupported.name} is not a supported file type.`);
      return;
    }
    const oversized = files.find((file) => file.size > maxSizeBytes);
    if (oversized) {
      onReject?.(`${oversized.name} exceeds the maximum file size.`);
      return;
    }
    if (files.length) onFilesSelected(files);
  };

  return (
    <div className={cn("grid gap-3", className)} {...props}>
      <div
        className={cn(
          "flex min-h-44 flex-col items-center justify-center rounded-[var(--air-radius-lg)] border border-dashed border-[var(--air-color-border-strong)] bg-[var(--air-color-bg-surface)] px-6 py-8 text-center transition-colors",
          dragActive && "border-[var(--air-color-interaction-focus)] bg-[var(--air-color-bg-selected)]",
          disabled && "cursor-not-allowed bg-[var(--air-color-bg-disabled)] opacity-[var(--air-opacity-disabled)]",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragActive(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!disabled) validateAndSelect(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--air-color-bg-subtle)] text-[var(--air-color-icon-primary)]">
          <Upload aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className="mt-3 font-semibold">{title}</div>
        <div className="mt-1 text-sm text-[var(--air-color-text-secondary)]">{description}</div>
        <Button
          className="mt-4"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          size="small"
          type="button"
          variant="gray-subtle"
        >
          {browseLabel ?? label}
        </Button>
        <div className="mt-2 text-xs text-[var(--air-color-text-secondary)]">{helperText}</div>
        <input
          accept={accept}
          aria-label={label}
          className="sr-only"
          disabled={disabled}
          id={inputId}
          multiple={multiple}
          onChange={(event) => validateAndSelect(Array.from(event.currentTarget.files ?? []))}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
      </div>
      {selectedFiles.length ? (
        <ul aria-label="Selected files" className="grid gap-2">
          {selectedFiles.map((file) => (
            <li
              className="flex min-h-11 items-center gap-2 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-3 py-2 text-sm"
              key={`${file.name}-${file.size}`}
            >
              <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--air-color-icon-secondary)]" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-[var(--air-color-text-secondary)]">{Math.max(1, Math.round(file.size / 1024))} KB</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
