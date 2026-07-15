import * as React from "react";
import { ArrowUpRight, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextareaField } from "@/components/ui/textarea";
import type { SessionCitation, SessionConversation } from "@/domain/types";

export interface AskThisSessionProps {
  conversation?: SessionConversation;
  errorMessage?: string;
  onAsk: (question: string) => Promise<void> | void;
  onOpenContext?: (href: string) => void;
  projectId: string;
  sessionId: string;
  state?: "ready" | "loading" | "error";
  suggestedQuestions: string[];
}

export function AskThisSession({ conversation, errorMessage, onAsk, onOpenContext, projectId, sessionId, state = "ready", suggestedQuestions }: AskThisSessionProps) {
  const [question, setQuestion] = React.useState("");
  const citationHref = (citation: SessionCitation) => `/projects/${projectId}/sessions/${sessionId}/documents/${citation.documentId}?result=${citation.contextResultId}`;
  const submit = async () => {
    const value = question.trim();
    if (!value || state === "loading") return;
    await onAsk(value);
    setQuestion("");
  };
  return <section aria-labelledby="ask-session-heading" className="grid gap-5">
    <header><h2 className="text-xl font-semibold" id="ask-session-heading">Ask this session</h2><p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Generate a grounded answer using only this Session’s transcript and evidence.</p></header>
    {!conversation?.turns.length ? <div className="grid gap-3 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4"><h3 className="font-semibold">Suggested questions</h3><div className="flex flex-wrap gap-2">{suggestedQuestions.map((suggestion) => <Button key={suggestion} onClick={() => setQuestion(suggestion)} size="small" variant="gray-subtle">{suggestion}</Button>)}</div></div> : null}
    {conversation?.turns.length ? <div aria-live="polite" className="grid gap-4">{conversation.turns.map((turn) => <article className={turn.role === "assistant" ? "grid gap-3 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] border-l-4 border-l-[var(--air-color-interaction-accent)] bg-[var(--air-color-bg-surface)] p-4" : "ml-auto max-w-[48rem] rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-selected)] p-4"} key={turn.id}><h3 className="text-sm font-semibold">{turn.role === "assistant" ? "AIR answer" : "You"}</h3><p className="text-sm leading-6">{turn.content}</p>{turn.citations.length ? <div className="grid gap-2"><h4 className="text-sm font-semibold">Citations</h4>{turn.citations.map((citation) => { const href = citationHref(citation); return <div className="grid gap-2 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-3" key={citation.id}><p className="text-xs text-[var(--air-color-text-secondary)]">{citation.documentName} · {citation.speaker} · {citation.location}</p><p className="text-sm">“{citation.excerpt}”</p><Button asChild className="justify-self-start" size="small" variant="gray-subtle"><a href={href} onClick={onOpenContext ? (event) => { event.preventDefault(); onOpenContext(href); } : undefined}>Open transcript context<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a></Button></div>; })}</div> : null}</article>)}</div> : null}
    {state === "loading" ? <div aria-live="polite" className="flex items-center gap-3 rounded-[var(--air-radius-lg)] bg-[var(--air-color-bg-subtle)] p-4"><Spinner label="Searching this session" /><div><p className="font-semibold">Searching this session…</p><p className="text-sm text-[var(--air-color-text-secondary)]">Retrieving transcript passages and evidence for a grounded answer.</p></div></div> : null}
    {state === "error" ? <Alert message={errorMessage ?? "Retrieval failed. Your question has been retained so you can try again."} size="large" title="Answer could not be generated" tone="error" /> : null}
    <form className="grid items-end gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => { event.preventDefault(); void submit(); }}><TextareaField disabled={state === "loading"} label="Ask this session" onChange={(event) => setQuestion(event.currentTarget.value)} placeholder="Ask a cited question about this session…" value={question} /><Button disabled={!question.trim() || state === "loading"} size="small" type="submit"><Send aria-hidden="true" className="h-4 w-4" />Ask</Button></form>
  </section>;
}
