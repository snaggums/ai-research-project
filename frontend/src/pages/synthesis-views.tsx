import { Sparkles } from "lucide-react";

import { EmptyState, SharedRouteState } from "@/components/application";
import { AskThisSession } from "@/components/research/ask-this-session";
import { SessionReport } from "@/components/research/session-report";
import { ThemeCard } from "@/components/research/theme-card";
import { ThemeEvidenceDetail } from "@/components/research/theme-evidence-detail";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SessionConversation, SessionReport as SessionReportValue, SessionTheme, ThemeEvidenceDetail as ThemeEvidenceDetailValue, ThemeStatus } from "@/domain/types";

export interface SessionThemesWorkspaceViewProps {
  errorMessage?: string;
  generating?: boolean;
  onEdit?: (theme: SessionTheme) => void;
  onGenerate: () => void;
  onCloseReview?: () => void;
  onOpenContext?: (href: string) => void;
  onReview?: (theme: SessionTheme) => void;
  onRetry?: () => void;
  onStatusChange?: (themeId: string, status: ThemeStatus) => void;
  projectId: string;
  selectedThemeId?: string;
  sessionId: string;
  state?: "ready" | "loading" | "error";
  themes: SessionTheme[];
}

export function SessionThemesWorkspaceView({ errorMessage, generating = false, onCloseReview, onEdit, onGenerate, onOpenContext, onRetry, onReview, onStatusChange, projectId, selectedThemeId, sessionId, state = "ready", themes }: SessionThemesWorkspaceViewProps) {
  const selected = themes.find((theme) => theme.id === selectedThemeId);
  const contextHref = (evidence: ThemeEvidenceDetailValue) => `/projects/${projectId}/sessions/${sessionId}/documents/${evidence.documentId}?result=${evidence.contextResultId}`;
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <div className="grid gap-3"><Alert message={errorMessage ?? "Check your connection and try again."} size="large" title="Themes could not be loaded" tone="error" />{onRetry ? <Button className="justify-self-start" onClick={onRetry} size="small">Retry</Button> : null}</div>;
  if (generating) return <div aria-live="polite" className="grid justify-items-center gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-6 py-16 text-center"><Spinner label="Generating themes" size="medium" /><div><h2 className="text-xl font-semibold">Generating themes…</h2><p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">AIR is identifying patterns and supporting evidence in this Session.</p></div></div>;
  if (selected) return <div className="grid gap-4"><Button className="justify-self-start" onClick={onCloseReview} size="small" variant="text">Back to themes</Button><ThemeEvidenceDetail contextHref={contextHref} onApprove={() => onStatusChange?.(selected.id, "approved")} onEdit={() => onEdit?.(selected)} onOpenContext={onOpenContext} onReject={() => onStatusChange?.(selected.id, "rejected")} theme={selected} /></div>;
  if (!themes.length) return <EmptyState description="Generate structured themes from this Session’s transcript and evidence." primaryAction={<Button onClick={onGenerate} size="small" variant="brand"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate themes</Button>} title="No themes yet" />;
  return <section aria-labelledby="themes-heading" className="grid gap-4"><header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold" id="themes-heading">Themes</h2><p className="text-sm text-[var(--air-color-text-secondary)]">Review generated patterns and inspect their supporting evidence.</p></div><Button onClick={onGenerate} size="small" variant="brand"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate themes</Button></header><div className="grid gap-4">{themes.map((theme) => <ThemeCard key={theme.id} onEdit={() => onEdit?.(theme)} onReject={() => onStatusChange?.(theme.id, "rejected")} onReview={() => onReview?.(theme)} theme={theme} />)}</div></section>;
}

export interface SessionReportWorkspaceViewProps {
  errorMessage?: string;
  generating?: boolean;
  onApprove?: () => void;
  onCreateRevision?: () => void;
  onEdit?: () => void;
  onGenerate: () => void;
  onOpenContext?: (itemId: string) => void;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onReview?: () => void;
  report?: SessionReportValue;
  state?: "ready" | "loading" | "error";
}

export function SessionReportWorkspaceView({ errorMessage, generating = false, onApprove, onCreateRevision, onEdit, onGenerate, onOpenContext, onRegenerate, onRetry, onReview, report, state = "ready" }: SessionReportWorkspaceViewProps) {
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <div className="grid gap-3"><Alert message={errorMessage ?? "Check your connection and try again."} size="large" title="Session Report could not be loaded" tone="error" />{onRetry ? <Button className="justify-self-start" onClick={onRetry} size="small">Retry</Button> : null}</div>;
  if (generating) return <div aria-live="polite" className="grid justify-items-center gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-6 py-16 text-center"><Spinner label="Generating Session Report" size="medium" /><div><h2 className="text-xl font-semibold">Generating Session Report…</h2><p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">AIR is organizing requirements, decisions, actions, questions, and insights.</p></div></div>;
  if (!report) return <EmptyState description="Generate a structured Session Report from reviewed research evidence." primaryAction={<Button onClick={onGenerate} size="small"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate Session Report</Button>} title="No Session Report yet" />;
  return <SessionReport onApprove={onApprove} onCreateRevision={onCreateRevision} onEdit={onEdit} onOpenContext={onOpenContext} onRegenerate={onRegenerate} onReview={onReview} report={report} />;
}

export interface AskThisSessionWorkspaceViewProps {
  conversation?: SessionConversation;
  errorMessage?: string;
  onAsk: (question: string) => Promise<void> | void;
  onOpenContext?: (href: string) => void;
  projectId: string;
  sessionId: string;
  state?: "ready" | "loading" | "error";
  suggestedQuestions: string[];
}

export function AskThisSessionWorkspaceView(props: AskThisSessionWorkspaceViewProps) {
  return <AskThisSession {...props} />;
}
