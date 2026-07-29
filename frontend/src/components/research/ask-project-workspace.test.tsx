import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  askProjectAnsweredTurns,
  askProjectSuggestedQuestions,
  emptyAskProjectSourceAvailability,
} from "@/mocks/fixtures/ask-project";
import { AskProjectWorkspace } from "./ask-project-workspace";

describe("Ask Project Storybook components", () => {
  it("fills the composer from a suggested question without submitting", async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn();
    const onSuggestedQuestion = vi.fn();
    render(
      <AskProjectWorkspace
        onAsk={onAsk}
        onSuggestedQuestion={onSuggestedQuestion}
        suggestedQuestions={askProjectSuggestedQuestions}
      />,
    );

    expect(
      screen.getByText(
        "Select a suggested question or enter your own question to enable Ask.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: askProjectSuggestedQuestions[0] }),
    );
    expect(
      screen.getByRole("textbox", { name: "Ask this project" }),
    ).toHaveValue(askProjectSuggestedQuestions[0]);
    expect(onSuggestedQuestion).toHaveBeenCalledWith(
      askProjectSuggestedQuestions[0],
    );
    expect(onAsk).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Ask" })).toBeEnabled();
  });

  it("starts a new chat and retains Project suggestions", async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();
    render(
      <AskProjectWorkspace
        onAsk={() => undefined}
        onNewChat={onNewChat}
        state="answered"
        suggestedQuestions={askProjectSuggestedQuestions}
        turns={askProjectAnsweredTurns}
      />,
    );

    await user.click(screen.getByRole("button", { name: "New chat" }));
    expect(onNewChat).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("list", { name: "Ask Project conversation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Suggested questions" }),
    ).toBeInTheDocument();
  });

  it("shows Session metadata but omits redundant Project metadata in citations", () => {
    render(
      <AskProjectWorkspace
        onAsk={() => undefined}
        state="answered"
        turns={askProjectAnsweredTurns}
      />,
    );

    const thread = screen.getByRole("list", {
      name: "Ask Project conversation",
    });
    expect(within(thread).queryByText("Healthcare Fraud Project")).not.toBeInTheDocument();
    expect(within(thread).getByText("Checkout usability test")).toBeInTheDocument();
    expect(within(thread).getByText("S014_Checkout_Transcript.docx")).toBeInTheDocument();
    expect(within(thread).getByText("Marcus • 00:08:42")).toBeInTheDocument();
    expect(
      within(thread).getByText(/Trace: Project Sessions/),
    ).toBeInTheDocument();
  });

  it("explains unavailable Project sources and opens Sessions", async () => {
    const user = userEvent.setup();
    const onOpenSessions = vi.fn();
    render(
      <AskProjectWorkspace
        onOpenSessions={onOpenSessions}
        sourceAvailability={emptyAskProjectSourceAvailability}
        state="no-sources"
      />,
    );

    expect(
      screen.getByText("No searchable Project sources"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This Project has no Sessions with searchable active Transcripts.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Ask this project" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open Sessions" }));
    expect(onOpenSessions).toHaveBeenCalledOnce();
  });

  it("has no automated semantic violations in answered and no-source states", async () => {
    const options = {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    };
    const answered = render(
      <AskProjectWorkspace
        onAsk={() => undefined}
        state="answered"
        turns={askProjectAnsweredTurns}
      />,
    );
    expect((await axe.run(answered.container, options)).violations).toEqual([]);
    answered.unmount();

    const noSources = render(
      <AskProjectWorkspace
        onOpenSessions={() => undefined}
        sourceAvailability={emptyAskProjectSourceAvailability}
        state="no-sources"
      />,
    );
    expect((await axe.run(noSources.container, options)).violations).toEqual([]);
  });
});
