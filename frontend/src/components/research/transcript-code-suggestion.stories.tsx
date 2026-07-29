import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea";
import { transcriptCodingSuggestions } from "@/mocks/fixtures/transcript-coding";
import { TranscriptCodeSuggestion } from "./transcript-code-suggestion";
import type { TranscriptHighlightStatus } from "./transcript-coding-types";

function StatefulTranscriptCodeSuggestion(args: React.ComponentProps<typeof TranscriptCodeSuggestion>) {
  const [codeName, setCodeName] = React.useState(args.codeName);
  const [description, setDescription] = React.useState(args.description);
  const [status, setStatus] = React.useState<TranscriptHighlightStatus>(args.status ?? "suggested");
  const [editing, setEditing] = React.useState(false);
  const [rejected, setRejected] = React.useState(false);
  const [deletedEvidenceIds, setDeletedEvidenceIds] = React.useState<string[]>([]);
  const [uncodedEvidenceIds, setUncodedEvidenceIds] = React.useState<string[]>([]);
  const [removedAcceptedCode, setRemovedAcceptedCode] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string>();
  const [nameError, setNameError] = React.useState<string>();
  const [draftName, setDraftName] = React.useState(codeName);
  const [draftDescription, setDraftDescription] = React.useState(description);

  const visibleEvidence = args.evidence.filter(
    (passage) => !deletedEvidenceIds.includes(passage.id) && !uncodedEvidenceIds.includes(passage.id),
  );

  if (removedAcceptedCode) return null;

  if (rejected || visibleEvidence.length === 0) {
    return (
      <div
        className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"
        role="status"
      >
        <p className="font-medium text-[var(--air-color-text-primary)]">
          {rejected
            ? "Suggestion rejected."
            : uncodedEvidenceIds.length > 0
              ? "Code removed. Highlight saved as Uncoded."
              : "All accepted Highlights removed."}
        </p>
        <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">
          {rejected
            ? "The suggestion was removed from the review queue."
            : "The accepted card is no longer shown. The Code remains available in the Code library."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <form
        className="grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const nextName = draftName.trim();
          if (!nextName) return;
          if (
            status === "accepted" &&
            nextName.toLocaleLowerCase() === "workflow confidence" &&
            codeName.toLocaleLowerCase() !== "workflow confidence"
          ) {
            setNameError("A Code named Workflow confidence already exists.");
            return;
          }
          setNameError(undefined);
          setCodeName(nextName);
          setDescription(draftDescription.trim());
          setEditing(false);
        }}
      >
        <header>
          <h3 className="text-xl font-semibold leading-7">
            {status === "accepted" ? "Edit code" : "Edit code suggestion"}
          </h3>
          <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">
            {status === "accepted"
              ? "Changes update every Highlight using this Code."
              : "Revise the proposed code before accepting it."}
          </p>
        </header>
        <InputField
          error={nameError}
          label="Code name"
          onChange={(event) => {
            setDraftName(event.target.value);
            setNameError(undefined);
          }}
          required
          value={draftName}
        />
        <TextareaField
          label="Description"
          onChange={(event) => setDraftDescription(event.target.value)}
          value={draftDescription}
        />
        <footer className="flex justify-end gap-2">
          <Button
            onClick={() => {
              setDraftName(codeName);
              setDraftDescription(description);
              setNameError(undefined);
              setEditing(false);
            }}
            size="small"
            type="button"
            variant="gray-subtle"
          >
            Cancel
          </Button>
          <Button disabled={!draftName.trim()} size="small" type="submit" variant="brand">
            Save changes
          </Button>
        </footer>
      </form>
    );
  }

  return (
    <div className="grid gap-3">
      <TranscriptCodeSuggestion
        {...args}
        codeName={codeName}
        description={description}
        evidence={visibleEvidence}
        onDeleteHighlight={(highlightId) => {
          args.onDeleteHighlight?.(highlightId);
          setDeletedEvidenceIds((current) => [...current, highlightId]);
        }}
        onAccept={() => {
          args.onAccept?.();
          setStatus("accepted");
        }}
        onApplyCode={() => {
          args.onApplyCode?.();
          setActionMessage("Apply Code opened for this Highlight.");
        }}
        onEdit={() => {
          args.onEdit?.();
          setDraftName(codeName);
          setDraftDescription(description);
          setEditing(true);
        }}
        onEditCode={() => {
          args.onEditCode?.();
          setDraftName(codeName);
          setDraftDescription(description);
          setEditing(true);
        }}
        onReject={() => {
          args.onReject?.();
          setRejected(true);
        }}
        onRemoveAcceptedCode={() => {
          args.onRemoveAcceptedCode?.();
          setRemovedAcceptedCode(true);
        }}
        onRemoveCode={(highlightId) => {
          args.onRemoveCode?.(highlightId);
          setUncodedEvidenceIds((current) => [...current, highlightId]);
          setActionMessage("Code removed. Highlight saved as Uncoded.");
        }}
        status={status}
      />
      {actionMessage ? (
        <p
          className="rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-3 text-sm text-[var(--air-color-text-primary)]"
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}
    </div>
  );
}

const suggestion = transcriptCodingSuggestions[0];
const meta = {
  title: "Research Objects/Transcript Coding/Transcript Code Suggestion",
  component: TranscriptCodeSuggestion,
  render: (args) => <StatefulTranscriptCodeSuggestion {...args} />,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-[24.5rem] p-6"><Story /></div>],
  parameters: {
    docs: { description: { component: "Reviews one AI Code proposal, accepted Code, or uncoded Highlight with supporting evidence. Uncoded Highlights expose Apply code in the stable action footer. Accepted Remove clears the Code from every supporting Highlight and removes the entire accepted Code section; the Highlights remain Uncoded and the Code remains in the library." } },
  },
  args: {
    ...suggestion,
    onAccept: fn(),
    onApplyCode: fn(),
    onDeleteHighlight: fn(),
    onEdit: fn(),
    onEditCode: fn(),
    onRemoveAcceptedCode: fn(),
    onRemoveCode: fn(),
    onReject: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof TranscriptCodeSuggestion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SuggestedCollapsed: Story = {};
export const SuggestedSelected: Story = { args: { selected: true } };
export const SuggestedExpanded: Story = { args: { defaultEvidenceExpanded: true } };
export const Accepted: Story = { args: { status: "accepted" } };
export const AcceptedLongContent: Story = {
  args: {
    codeName: "Evidence needs structured allegation-linked organization",
    description: "Flat evidence lists lack types, clear labels, and links to the allegations each file supports, limiting later reviewers' ability to understand evidence context.",
    evidence: [
      {
        id: "long-accepted-evidence",
        excerpt: "I uploaded the four synthetic supporting documents and added a short description to each. Once I add the claim extract, audit spreadsheet, provider profile, and correspondence, they appear as one flat list. I need evidence types, clearer labels, and a way to connect each file to the allegation it supports.",
        location: "8:13",
        speaker: "Daniel Brooks",
      },
    ],
    provenance: "Researcher accepted AI suggestion",
    status: "accepted",
  },
};
export const AcceptedExpanded: Story = { args: { defaultEvidenceExpanded: true, status: "accepted" } };
export const AcceptedSelected: Story = { args: { selected: true, status: "accepted" } };
export const Uncoded: Story = { args: { codeName: "Uncoded highlight", description: "This saved Highlight does not yet have a Record code.", status: "uncoded" } };
export const UncodedRecordRequired: Story = {
  args: {
    applyCodeDisabled: true,
    applyCodeUnavailableReason: "Assign this Session to a Record before applying a Code.",
    codeName: "Uncoded highlight",
    description: "This saved Highlight does not yet have a Record code.",
    status: "uncoded",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Apply code" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Apply code" })).toHaveAccessibleDescription(
      "Assign this Session to a Record before applying a Code.",
    );
  },
};
export const Compact: Story = { args: { layout: "compact" } };
export const ExpandEvidence: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "View all supporting transcript evidence" }));
    await expect(canvas.getByRole("button", { name: "View less supporting transcript evidence" })).toBeInTheDocument();
  },
};
export const AcceptSuggestion: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Accept" }));
    await expect(args.onAccept).toHaveBeenCalled();
    await expect(canvas.getByText("Accepted")).toBeInTheDocument();
  },
};
export const ApplyCodeToUncoded: Story = {
  args: {
    codeName: "Uncoded highlight",
    description: "This saved Highlight does not yet have a Record code.",
    status: "uncoded",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Apply code" }));
    await expect(args.onApplyCode).toHaveBeenCalled();
    await expect(canvas.getByRole("status")).toHaveTextContent("Apply Code opened for this Highlight.");
  },
};
export const EditSuggestion: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(args.onEdit).toHaveBeenCalled();
    await userEvent.clear(canvas.getByRole("textbox", { name: "Code name" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Code name" }), "Content organization");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByText("Content organization")).toBeInTheDocument();
  },
};
export const EditAcceptedCode: Story = {
  args: { status: "accepted" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(args.onEditCode).toHaveBeenCalled();
    await userEvent.clear(canvas.getByRole("textbox", { name: "Code name" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Code name" }), "Workflow confidence");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByText("A Code named Workflow confidence already exists.")).toBeInTheDocument();
    await userEvent.clear(canvas.getByRole("textbox", { name: "Code name" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Code name" }), "Content organization");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByText("Content organization")).toBeInTheDocument();
  },
};
export const RejectSuggestion: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Reject" }));
    await expect(args.onReject).toHaveBeenCalled();
    await expect(canvas.getByRole("status")).toHaveTextContent("Suggestion rejected.");
  },
};
export const RemoveAcceptedCode: Story = {
  args: { defaultEvidenceExpanded: true, status: "accepted" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Remove" }));
    await expect(args.onRemoveAcceptedCode).toHaveBeenCalled();
    await expect(canvas.queryByText(suggestion.codeName)).not.toBeInTheDocument();
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
  },
};
export const RemoveCode: Story = {
  args: { defaultEvidenceExpanded: true, status: "accepted" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const firstPassage = suggestion.evidence[0];
    const secondPassage = suggestion.evidence[1];
    await userEvent.click(canvas.getByRole("button", {
      name: `Remove ${suggestion.codeName} code from ${firstPassage.speaker}, ${firstPassage.location}`,
    }));
    await expect(args.onRemoveCode).toHaveBeenCalledWith(firstPassage.id);
    await expect(canvas.queryByLabelText(`Highlight from ${firstPassage.speaker}, ${firstPassage.location}`)).not.toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent("Code removed. Highlight saved as Uncoded.");
    await expect(canvas.getByLabelText(`Highlight from ${secondPassage.speaker}, ${secondPassage.location}`)).toHaveTextContent(suggestion.codeName);
  },
};
export const DeleteHighlight: Story = {
  args: { defaultEvidenceExpanded: true, status: "accepted" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const firstPassage = suggestion.evidence[0];
    const secondPassage = suggestion.evidence[1];
    await userEvent.click(canvas.getByRole("button", {
      name: `Delete highlight from ${firstPassage.speaker}, ${firstPassage.location}`,
    }));
    await expect(page.getByRole("dialog", { name: "Delete highlight?" })).toBeInTheDocument();
    await expect(args.onDeleteHighlight).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "Delete highlight" }));
    await expect(args.onDeleteHighlight).toHaveBeenCalledWith(firstPassage.id);
    await expect(canvas.queryByText(firstPassage.excerpt, { exact: false })).not.toBeInTheDocument();
    await expect(canvas.getByText(secondPassage.excerpt, { exact: false })).toBeInTheDocument();
  },
};
