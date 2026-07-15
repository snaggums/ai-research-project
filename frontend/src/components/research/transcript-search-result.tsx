import * as React from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TranscriptSearchResult as TranscriptSearchResultValue } from "@/domain/types";

export interface TranscriptSearchResultProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  layout?: "default" | "compact";
  onOpen?: React.MouseEventHandler<HTMLAnchorElement>;
  result: TranscriptSearchResultValue;
}

export function TranscriptSearchResult({ className, href, layout = "default", onOpen, result, ...props }: TranscriptSearchResultProps) {
  return <article className={`grid gap-2 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-3 ${className ?? ""}`} {...props}>
    <header className="flex flex-wrap items-center justify-between gap-2"><p><span className="text-sm font-medium">{result.speaker}</span> <span className="text-xs text-[var(--air-color-text-secondary)]">{result.location}</span></p><span className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] px-3 py-0.5 text-xs">{Math.round(result.relevance * 100)}% relevance</span></header>
    <p className="text-sm leading-5">{result.excerpt}</p>
    <div className={layout === "compact" ? "flex justify-stretch" : "flex justify-end"}><Button asChild className={layout === "compact" ? "w-full" : undefined} size="small" variant="gray-subtle"><a href={href} onClick={onOpen}>Open transcript context<ExternalLink aria-hidden="true" className="h-4 w-4" /></a></Button></div>
  </article>;
}
