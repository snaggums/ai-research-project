import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toTranscriptDocumentSummary } from "@/adapters/transcripts";
import { transcriptApiFixtures } from "@/mocks/fixtures/transcripts";
import { SessionTranscriptLifecycleWorkspace } from "./session-transcript-lifecycle-workspace";
import { TranscriptDocumentItem } from "./transcript-document-item";
import { TranscriptLifecycleDialog, type TranscriptDependencySummary } from "./transcript-lifecycle-dialog";
import { TranscriptUploader } from "./transcript-uploader";

const dependencies: TranscriptDependencySummary = {
  acceptedHighlightCount: 3,
  uncodedHighlightCount: 1,
  codeSuggestionRunCount: 2,
  sessionReportCount: 1,
  recordSynthesisCount: 1,
};

describe("Transcript lifecycle contract", () => {
  it("exposes active Transcript actions without Set as primary", () => {
    render(
      <TranscriptDocumentItem
        document={toTranscriptDocumentSummary(transcriptApiFixtures[0])}
        href="#view"
        lifecycle="active"
        onDelete={() => undefined}
        onReplace={() => undefined}
      />,
    );

    expect(screen.getByText("Active transcript")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replace transcript" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete transcript" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set as primary" })).not.toBeInTheDocument();
  });

  it("uses a distinct replacement action and preserves the active Transcript copy", async () => {
    const onReplace = vi.fn();
    const user = userEvent.setup();
    const file = new File(["replacement"], "interview-v2.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    render(<TranscriptUploader file={file} onReplace={onReplace} state="replacement-selected" />);

    expect(screen.getByText(/current Transcript remains active/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Replace transcript" }));
    expect(onReplace).toHaveBeenCalledOnce();
  });

  it("cancels a selected replacement without changing the active Transcript", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const file = new File(["replacement"], "interview-v2.docx");
    render(<TranscriptUploader file={file} onRemove={onCancel} state="replacement-selected" />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("summarizes linked evidence and does not initially focus the destructive action", async () => {
    render(
      <TranscriptLifecycleDialog
        action="delete"
        defaultOpen
        dependencies={dependencies}
        filename="interview.docx"
      />,
    );

    expect(screen.getByRole("dialog", { name: "Delete transcript with linked evidence?" })).toBeInTheDocument();
    expect(screen.getByText("accepted Highlights")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Delete transcript" })).not.toHaveFocus());
  });

  it("prevents a normal second upload and opens consequence-aware deletion", async () => {
    const user = userEvent.setup();
    render(
      <SessionTranscriptLifecycleWorkspace
        activeDocument={toTranscriptDocumentSummary(transcriptApiFixtures[0])}
        dependencies={dependencies}
      />,
    );

    expect(screen.queryByRole("button", { name: "Upload transcript" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete transcript" }));
    expect(screen.getByRole("dialog", { name: "Delete transcript with linked evidence?" })).toBeInTheDocument();
  });

  it.each([
    "replacement-selected",
    "replacement-request-error",
    "replacement-processing-error",
  ] as const)("keeps Replace transcript available during the %s state", (state) => {
    render(
      <SessionTranscriptLifecycleWorkspace
        activeDocument={toTranscriptDocumentSummary(transcriptApiFixtures[0])}
        onRequestReplacement={() => undefined}
        replacement={{
          file: new File(["replacement"], "interview-v2.docx"),
          state,
        }}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Replace transcript" }).length).toBeGreaterThan(0);
  });

  it("keeps View transcript available while replacing and blocks concurrent lifecycle actions", () => {
    render(
      <SessionTranscriptLifecycleWorkspace
        activeDocument={toTranscriptDocumentSummary(transcriptApiFixtures[0])}
        onRequestReplacement={() => undefined}
        replacement={{
          file: new File(["replacement"], "interview-v2.docx"),
          state: "replacement-processing",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "View transcript" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Replace transcript" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete transcript" })).not.toBeInTheDocument();
  });

  it("keeps removed and legacy Transcripts visible when no active Transcript remains", () => {
    const active = toTranscriptDocumentSummary(transcriptApiFixtures[0]);
    render(
      <SessionTranscriptLifecycleWorkspace
        legacyDocuments={[{
          ...active,
          id: "legacy-transcript",
          filename: "legacy-interview.docx",
          isPrimary: false,
          lifecycleStatus: "legacy",
        }]}
        removedDocuments={[{
          ...active,
          id: "removed-transcript",
          filename: "removed-interview.docx",
          isPrimary: false,
          lifecycleStatus: "tombstoned",
        }]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Upload transcript" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transcript history" })).toBeInTheDocument();
    expect(screen.getByText("Removed transcript")).toBeInTheDocument();
    expect(screen.getByText("Legacy transcript")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View transcript" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Delete transcript" })).not.toBeInTheDocument();
  });
});
