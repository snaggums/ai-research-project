export function formatTranscriptSize(sizeBytes?: number) {
  if (sizeBytes === undefined) return "Size unavailable";
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function transcriptFormat(mimeType?: string, filename = "") {
  const extension = filename.split(".").at(-1)?.toUpperCase();
  if (extension) return extension;
  if (mimeType === "text/plain") return "TXT";
  return "FILE";
}

export function formatTranscriptDate(value: string, verb: "Uploaded" | "Extracted" = "Uploaded") {
  return `${verb} ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: verb === "Uploaded" ? "numeric" : undefined, minute: verb === "Uploaded" ? "2-digit" : undefined }).format(new Date(value))}`;
}
