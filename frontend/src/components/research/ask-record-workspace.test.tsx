import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  askRecordAnsweredTurns,
  askRecordCitations,
  askRecordFollowUpQuestion,
  askRecordGeneratingTurns,
  askRecordInsufficientEvidenceTurns,
  askRecordSuggestedQuestions,
  emptyAskRecordSourceAvailability,
} from "@/mocks/fixtures/ask-record";
import { AskRecordWorkspace } from "./ask-record-workspace";
import { EvidenceCitationCard } from "./evidence-citation-card";

describe("Ask Record Storybook components", () => {
  it("presents the complete Record evidence hierarchy and opens transcript context", async () => {
    const user = userEvent.setup();
    const onOpenTranscriptContext = vi.fn();
    render(
      <EvidenceCitationCard
        citation={askRecordCitations[0]}
        onOpenTranscriptContext={onOpenTranscriptContext}
      />,
    );

    expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText("Checkout usability test")).toBeInTheDocument();
    expect(screen.getByText("S005_Simplified_Transcript.docx")).toBeInTheDocument();
    expect(screen.getByText("Jordan · 08:42")).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", {
        name: "Open transcript context for citation 1",
      }),
    );
    expect(onOpenTranscriptContext).toHaveBeenCalledWith(askRecordCitations[0]);
  });

  it("supports Session citations without redundant Project and Session metadata", () => {
    render(
      <EvidenceCitationCard
        citation={{
          excerpt: askRecordCitations[0].excerpt,
          id: "session-citation",
          reference: 1,
          speakerTimestamp: askRecordCitations[0].speakerTimestamp,
          transcript: askRecordCitations[0].transcript,
        }}
        context="session"
      />,
    );

    expect(screen.queryByText("Project")).not.toBeInTheDocument();
    expect(screen.queryByText("Session")).not.toBeInTheDocument();
    expect(screen.getByText("S005_Simplified_Transcript.docx")).toBeInTheDocument();
  });

  it("moves a suggested question into the composer without submitting it", async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn();
    const onSuggestedQuestion = vi.fn();
    render(
      <AskRecordWorkspace
        onAsk={onAsk}
        onSuggestedQuestion={onSuggestedQuestion}
        suggestedQuestions={askRecordSuggestedQuestions}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: askRecordSuggestedQuestions[0] }),
    );
    expect(screen.getByRole("textbox", { name: "Ask this record" })).toHaveValue(
      askRecordSuggestedQuestions[0],
    );
    expect(onSuggestedQuestion).toHaveBeenCalledWith(
      askRecordSuggestedQuestions[0],
    );
    expect(onAsk).not.toHaveBeenCalled();
  });

  it("renders an ordered multi-turn thread with grounded follow-up answers", () => {
    render(
      <AskRecordWorkspace
        onAsk={() => undefined}
        state="answered"
        turns={askRecordAnsweredTurns}
      />,
    );

    const thread = screen.getByRole("list", { name: "Ask Record conversation" });
    const turns = within(thread).getAllByRole("listitem");
    expect(turns).toHaveLength(4);
    expect(within(turns[0]).getByText(askRecordSuggestedQuestions[0])).toBeInTheDocument();
    expect(within(turns[1]).getByRole("heading", { name: "AIR answer" })).toBeInTheDocument();
    expect(within(turns[2]).getByText(askRecordFollowUpQuestion)).toBeInTheDocument();
    expect(within(turns[3]).getByRole("heading", { name: "AIR answer" })).toBeInTheDocument();
    expect(within(turns[3]).getAllByRole("link", { name: "Go to citation 1" })[0]).toHaveAttribute(
      "href",
      "#air-shared-requirements-answer-citation-1",
    );
    expect(
      document.querySelector("#air-shared-requirements-answer-citation-1"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Trace: latest Record Knowledge/),
    ).toHaveLength(2);
  });

  it("announces generation and disables the question composer", () => {
    render(
      <AskRecordWorkspace
        onAsk={() => undefined}
        state="generating"
        turns={askRecordGeneratingTurns}
      />,
    );

    expect(
      screen.getByRole("status", {
        name: "Generating an answer from Record evidence",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ask this record" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ask" })).toBeDisabled();
  });

  it("retains a failed question and exposes a recoverable retry action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <AskRecordWorkspace
        initialQuestion={askRecordFollowUpQuestion}
        onAsk={() => undefined}
        onRetry={onRetry}
        state="recoverable-error"
        turns={askRecordGeneratingTurns}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Answer could not be generated",
    );
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Ask this record" })).toHaveValue(
      askRecordFollowUpQuestion,
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("withholds unsupported conclusions and separates partially relevant evidence", () => {
    render(
      <AskRecordWorkspace
        onAsk={() => undefined}
        state="insufficient-evidence"
        turns={askRecordInsufficientEvidenceTurns}
      />,
    );

    expect(screen.getByText("No conclusion was generated.", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Partially relevant citations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Partially relevant")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AIR answer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AIR response" })).toBeInTheDocument();
  });

  it("explains source availability and omits the composer when nothing is searchable", async () => {
    const user = userEvent.setup();
    const onOpenRelatedSessions = vi.fn();
    render(
      <AskRecordWorkspace
        onOpenRelatedSessions={onOpenRelatedSessions}
        sourceAvailability={emptyAskRecordSourceAvailability}
        state="no-sources"
      />,
    );

    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("Not available")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Ask this record" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open related Sessions" }));
    expect(onOpenRelatedSessions).toHaveBeenCalledOnce();
  });

  it("has no automated semantic violations in answered and no-source states", async () => {
    const options = {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    };
    const answered = render(
      <AskRecordWorkspace
        onAsk={() => undefined}
        state="answered"
        turns={askRecordAnsweredTurns}
      />,
    );
    expect((await axe.run(answered.container, options)).violations).toEqual([]);
    answered.unmount();

    const noSources = render(
      <AskRecordWorkspace
        onOpenRelatedSessions={() => undefined}
        sourceAvailability={emptyAskRecordSourceAvailability}
        state="no-sources"
      />,
    );
    expect((await axe.run(noSources.container, options)).violations).toEqual([]);
  });
});
