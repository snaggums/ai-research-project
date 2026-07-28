import * as React from "react";
import { RefreshCw, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextareaField } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EvidenceCitationCard,
  type EvidenceCitation,
} from "./evidence-citation-card";

export type AskRecordWorkspaceState =
  | "suggested"
  | "answered"
  | "generating"
  | "recoverable-error"
  | "insufficient-evidence"
  | "no-sources";

export interface AskRecordAnswerSegment {
  citationReferences?: number[];
  text: string;
}

export interface AskRecordAnswerParagraph {
  id: string;
  segments: AskRecordAnswerSegment[];
}

export interface AskRecordResearcherTurn {
  content: string;
  id: string;
  role: "researcher";
}

export interface AskRecordAnsweredTurn {
  answer: AskRecordAnswerParagraph[];
  citations: EvidenceCitation[];
  id: string;
  response: "answer";
  role: "assistant";
  traceabilityNote?: string;
}

export interface AskRecordInsufficientEvidenceTurn {
  id: string;
  partialCitations: EvidenceCitation[];
  response: "insufficient-evidence";
  role: "assistant";
}

export type AskRecordConversationTurn =
  | AskRecordResearcherTurn
  | AskRecordAnsweredTurn
  | AskRecordInsufficientEvidenceTurn;

export interface AskRecordSourceAvailability {
  label: string;
  value: string;
}

export interface AskRecordWorkspaceProps
  extends React.HTMLAttributes<HTMLElement> {
  errorMessage?: string;
  initialQuestion?: string;
  onAsk?: (question: string) => Promise<void> | void;
  onOpenRelatedSessions?: () => void;
  onOpenTranscriptContext?: (citation: EvidenceCitation) => void;
  onRetry?: () => void;
  onQuestionChange?: (question: string) => void;
  onSuggestedQuestion?: (question: string) => void;
  question?: string;
  recordName?: string;
  sourceAvailability?: AskRecordSourceAvailability[];
  sourceDisclosure?: string;
  state?: AskRecordWorkspaceState;
  suggestedQuestions?: string[];
  turns?: AskRecordConversationTurn[];
}

const defaultSourceDisclosure =
  "Search includes all related Sessions, including Sessions excluded from the latest Record Synthesis.";

function ResearcherQuestion({ turn }: { turn: AskRecordResearcherTurn }) {
  const headingId = `${turn.id}-heading`;
  return (
    <article
      aria-labelledby={headingId}
      className="grid w-full gap-2 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-selected)] p-4"
    >
      <h3 className="text-sm font-semibold" id={headingId}>You</h3>
      <p className="text-base leading-6">{turn.content}</p>
    </article>
  );
}

function AnswerContent({
  onOpenTranscriptContext,
  responsePosition,
  turn,
}: {
  onOpenTranscriptContext?: (citation: EvidenceCitation) => void;
  responsePosition: number;
  turn: AskRecordAnsweredTurn;
}) {
  const headingId = `${turn.id}-heading`;
  const citationsHeadingId = `${turn.id}-citations-heading`;
  const citationAnchorId = (reference: number) =>
    `${turn.id}-citation-${reference}`;

  return (
    <article
      aria-labelledby={headingId}
      className="grid gap-5"
    >
      <div className="grid gap-4 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-brand)] bg-[var(--air-color-bg-surface)] p-5 md:p-6">
        <h3 className="text-sm font-semibold text-[var(--air-color-text-secondary)]" id={headingId}>
          AIR answer
        </h3>
        {turn.answer.map((paragraph) => (
          <p className="text-base leading-6" key={paragraph.id}>
            {paragraph.segments.map((segment, index) => (
              <React.Fragment key={`${paragraph.id}-${index}`}>
                {segment.text}
                {segment.citationReferences?.map((reference) => (
                  <React.Fragment key={reference}>
                    {" "}
                    <a
                      aria-label={`Go to citation ${reference}`}
                      className="font-semibold text-[var(--air-color-text-link)] underline decoration-1 underline-offset-2 outline-none focus-visible:rounded-[var(--air-radius-sm)] focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
                      href={`#${citationAnchorId(reference)}`}
                    >
                      [{reference}]
                    </a>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </p>
        ))}
        <p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">
          {turn.traceabilityNote ??
            "Trace: latest Record Knowledge → reviewed Session Report items → cited primary transcript passages."}
        </p>
      </div>

      <section
        aria-label={`Citations for AIR response ${responsePosition}`}
        className="grid gap-3"
      >
        <h4 className="font-semibold" id={citationsHeadingId}>
          Citations
        </h4>
        {turn.citations.map((citation) => (
          <EvidenceCitationCard
            anchorId={citationAnchorId(citation.reference)}
            citation={citation}
            key={citation.id}
            onOpenTranscriptContext={onOpenTranscriptContext}
          />
        ))}
      </section>
    </article>
  );
}

function InsufficientEvidenceContent({
  onOpenTranscriptContext,
  responsePosition,
  turn,
}: {
  onOpenTranscriptContext?: (citation: EvidenceCitation) => void;
  responsePosition: number;
  turn: AskRecordInsufficientEvidenceTurn;
}) {
  const headingId = `${turn.id}-heading`;
  const partialHeadingId = `${turn.id}-partial-evidence-heading`;
  const citationAnchorId = (reference: number) =>
    `${turn.id}-citation-${reference}`;

  return (
    <article
      aria-labelledby={headingId}
      className="grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-status-warning-border)] border-l-4 border-l-[var(--air-color-icon-warning)] bg-[var(--air-color-bg-surface)] p-4 md:p-5"
    >
      <h3 className="font-semibold" id={headingId}>AIR response</h3>
      <Alert
        message="AIR found related material, but not enough supporting transcript evidence to answer the question. No conclusion was generated."
        size="large"
        title="Not enough evidence"
        tone="warning"
      />
      {turn.partialCitations.length ? (
        <section
          aria-label={`Partially relevant citations for AIR response ${responsePosition}`}
          className="grid gap-3"
        >
          <div>
            <h4 className="font-semibold" id={partialHeadingId}>
              Partially relevant citations
            </h4>
            <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">
              These passages may help refine the question, but they do not support a conclusion.
            </p>
          </div>
          {turn.partialCitations.map((citation) => (
            <EvidenceCitationCard
              anchorId={citationAnchorId(citation.reference)}
              citation={{ ...citation, relevance: "partial" }}
              key={citation.id}
              onOpenTranscriptContext={onOpenTranscriptContext}
            />
          ))}
        </section>
      ) : null}
    </article>
  );
}

function QuestionComposer({
  disabled,
  onAsk,
  question,
  recordName,
  setQuestion,
}: {
  disabled: boolean;
  onAsk?: (question: string) => Promise<void> | void;
  question: string;
  recordName: string;
  setQuestion: (value: string) => void;
}) {
  async function submit() {
    const value = question.trim();
    if (!value || disabled || !onAsk) return;
    await onAsk(value);
  }

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <TextareaField
        disabled={disabled}
        label={`Ask ${recordName}`}
        onChange={(event) => setQuestion(event.currentTarget.value)}
        placeholder="Ask a cited question across this Record…"
        value={question}
      />
      <Button
        className="justify-self-end"
        disabled={disabled || !question.trim() || !onAsk}
        size="small"
        type="submit"
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        Ask
      </Button>
    </form>
  );
}

export function AskRecordWorkspace({
  className,
  errorMessage,
  initialQuestion = "",
  onAsk,
  onOpenRelatedSessions,
  onOpenTranscriptContext,
  onQuestionChange,
  onRetry,
  onSuggestedQuestion,
  question: controlledQuestion,
  recordName = "Medicaid Fraud Documenter",
  sourceAvailability = [],
  sourceDisclosure = defaultSourceDisclosure,
  state = "suggested",
  suggestedQuestions = [],
  turns = [],
  ...props
}: AskRecordWorkspaceProps) {
  const [internalQuestion, setInternalQuestion] = React.useState(initialQuestion);
  const errorSummaryRef = React.useRef<HTMLDivElement>(null);
  const generating = state === "generating";
  const composerQuestion = controlledQuestion ?? internalQuestion;

  function setComposerQuestion(value: string) {
    if (controlledQuestion === undefined) setInternalQuestion(value);
    onQuestionChange?.(value);
  }

  React.useEffect(() => {
    if (state === "recoverable-error") errorSummaryRef.current?.focus();
  }, [state]);

  function chooseSuggestion(suggestion: string) {
    setComposerQuestion(suggestion);
    onSuggestedQuestion?.(suggestion);
  }

  return (
    <section
      aria-labelledby="ask-record-heading"
      className={cn(
        "grid min-w-0 gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6",
        className,
      )}
      {...props}
    >
      <header className="grid gap-2">
        <h2 className="text-2xl font-semibold" id="ask-record-heading">
          Ask {recordName}
        </h2>
        <p className="text-sm leading-6 text-[var(--air-color-text-secondary)]">
          Ask across Record Knowledge, reviewed or approved Session Reports, and
          all related transcripts. Answers cite primary transcript evidence.
        </p>
      </header>

      <p className="rounded-[var(--air-radius-md)] bg-[var(--air-color-status-information-bg)] p-4 text-sm leading-6 text-[var(--air-color-status-information-text)]">
        {sourceDisclosure}
      </p>

      {state !== "no-sources" && suggestedQuestions.length ? (
        <section
          aria-labelledby="ask-record-suggestions-heading"
          className="grid gap-2"
        >
          <h3 className="font-semibold" id="ask-record-suggestions-heading">
            Suggested questions
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => chooseSuggestion(suggestion)}
                size="small"
                variant="gray-subtle"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {state === "suggested" && !turns.length ? (
        <section className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-5">
          <h3 className="font-semibold">No conversation yet</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--air-color-text-secondary)]">
            Ask a question to synthesize across this Record while preserving
            traceability to primary transcript passages.
          </p>
        </section>
      ) : null}

      {turns.length ? (
        <ol aria-label="Ask Record conversation" className="grid gap-4">
          {turns.map((turn, index) => {
            const responsePosition = turns
              .slice(0, index + 1)
              .filter((candidate) => candidate.role === "assistant").length;
            return (
              <li className="grid" key={turn.id}>
                {turn.role === "researcher" ? (
                  <ResearcherQuestion turn={turn} />
                ) : turn.response === "answer" ? (
                  <AnswerContent
                    onOpenTranscriptContext={onOpenTranscriptContext}
                    responsePosition={responsePosition}
                    turn={turn}
                  />
                ) : (
                  <InsufficientEvidenceContent
                    onOpenTranscriptContext={onOpenTranscriptContext}
                    responsePosition={responsePosition}
                    turn={turn}
                  />
                )}
              </li>
            );
          })}
        </ol>
      ) : null}

      {generating ? (
        <div
          aria-live="polite"
          className="flex min-h-32 items-center gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5"
        >
          <Spinner label="Generating an answer from Record evidence" />
          <div>
            <h3 className="font-semibold">Generating answer…</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--air-color-text-secondary)]">
              AIR is tracing Record Knowledge through reviewed Session Reports to supporting transcript passages.
            </p>
          </div>
        </div>
      ) : null}

      {state === "recoverable-error" ? (
        <div className="grid gap-3">
          <Alert
            ref={errorSummaryRef}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
            message={
              errorMessage ??
              "The answer could not be generated. Your question is still available, and no research data was changed."
            }
            size="large"
            title="Answer could not be generated"
            tone="error"
            tabIndex={-1}
          />
          {onRetry ? (
            <Button
              className="justify-self-start"
              onClick={onRetry}
              size="small"
              variant="gray-subtle"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {state === "no-sources" ? (
        <div className="grid gap-4">
          <Alert
            message="This Record has no primary transcripts or reviewed Session Reports available to search. AIR cannot generate a grounded answer yet."
            size="large"
            title="No searchable Record sources"
            tone="info"
          />
          {sourceAvailability.length ? (
            <section className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-5">
              <h3 className="font-semibold">Source availability</h3>
              <dl className="mt-4 grid gap-3">
                {sourceAvailability.map((item) => (
                  <div
                    className="flex flex-wrap gap-1 text-sm text-[var(--air-color-text-secondary)]"
                    key={item.label}
                  >
                    <dt>{item.label}:</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {onOpenRelatedSessions ? (
            <Button
              className="justify-self-start"
              onClick={onOpenRelatedSessions}
              size="small"
              variant="gray-subtle"
            >
              Open related Sessions
            </Button>
          ) : null}
        </div>
      ) : null}

      {state !== "no-sources" ? (
        <QuestionComposer
          disabled={generating}
          onAsk={onAsk}
          question={composerQuestion}
          recordName={recordName}
          setQuestion={setComposerQuestion}
        />
      ) : null}
    </section>
  );
}
