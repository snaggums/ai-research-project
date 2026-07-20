import * as React from "react";

import type { TranscriptContext } from "@/domain/types";

export interface TranscriptContextPassageProps extends React.HTMLAttributes<HTMLElement> {
  context: TranscriptContext;
}

export function TranscriptContextPassage({ className, context, ...props }: TranscriptContextPassageProps) {
  return <section aria-labelledby="transcript-context-heading" className={`grid gap-5 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] p-4 sm:p-6 ${className ?? ""}`} {...props}>
    <h2 className="text-xl font-semibold" id="transcript-context-heading">Transcript context</h2>
    <p className="text-xs font-semibold">Focused passage · {context.result.speaker} · {context.result.location} · Relevance {Math.round(context.result.relevance * 100)}%</p>
    {context.passages.map((passage) => <div className={passage.id === context.focusedPassageId ? "flex gap-3 rounded-[var(--air-radius-sm)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-4" : "grid gap-1"} key={passage.id}>{passage.id === context.focusedPassageId ? <span aria-hidden="true" className="w-1 shrink-0 rounded-full bg-[var(--air-color-interaction-progress)]" /> : null}<div className="grid gap-1"><h3 className="text-sm font-medium">{passage.speaker} · {passage.location}</h3><p className="leading-6">{passage.text}</p></div></div>)}
  </section>;
}
