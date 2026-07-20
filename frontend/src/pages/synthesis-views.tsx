import * as React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

import { EmptyState, SharedRouteState } from "@/components/application";
import { AskThisSession } from "@/components/research/ask-this-session";
import { SessionReport } from "@/components/research/session-report";
import { SessionReportEvidence } from "@/components/research/session-report-evidence";
import { ThemeCard } from "@/components/research/theme-card";
import { ThemeEvidenceDetail } from "@/components/research/theme-evidence-detail";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { TextareaField } from "@/components/ui/textarea";
import type { SessionConversation, SessionReport as SessionReportValue, SessionReportItem, SessionTheme, ThemeEvidenceDetail as ThemeEvidenceDetailValue, ThemeStatus } from "@/domain/types";

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
  onEditItem?: (itemId: string, payload: { title: string; summary: string }) => void;
  onEditReport?: (payload: { executiveSummary: string; detailedNotes: string }) => void;
  onGenerate: () => void;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onReview?: () => void;
  report?: SessionReportValue;
  state?: "ready" | "loading" | "error";
}

export function SessionReportWorkspaceView({ errorMessage, generating = false, onApprove, onCreateRevision, onEditItem, onEditReport, onGenerate, onRegenerate, onRetry, onReview, report, state = "ready" }: SessionReportWorkspaceViewProps) {
  const [editingItem, setEditingItem] = React.useState<SessionReportItem>();
  const [itemTitle, setItemTitle] = React.useState("");
  const [itemSummary, setItemSummary] = React.useState("");
  const [editingReport, setEditingReport] = React.useState(false);
  const [executiveSummary, setExecutiveSummary] = React.useState("");
  const [detailedNotes, setDetailedNotes] = React.useState("");
  const [evidenceItemId, setEvidenceItemId] = React.useState<string>();
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const reportScrollPosition = React.useRef(0);

  const beginItemEdit = (item: SessionReportItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemSummary(item.summary);
  };
  const beginReportEdit = () => {
    if (!report) return;
    setExecutiveSummary(report.executiveSummary);
    setDetailedNotes(report.detailedNotes);
    setEditingReport(true);
  };
  const beginEvidenceReview = (itemId: string) => {
    reportScrollPosition.current = window.scrollY;
    setEvidenceItemId(itemId);
  };
  const closeEvidenceReview = () => {
    setEvidenceItemId(undefined);
    if (!window.navigator.userAgent.toLowerCase().includes("jsdom")) {
      window.requestAnimationFrame(() => window.scrollTo({ top: reportScrollPosition.current, behavior: "auto" }));
    }
  };
  React.useEffect(() => {
    if (evidenceItemId) workspaceRef.current?.scrollIntoView?.({ block: "start" });
  }, [evidenceItemId]);
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <div className="grid gap-3"><Alert message={errorMessage ?? "Check your connection and try again."} size="large" title="Session Report could not be loaded" tone="error" />{onRetry ? <Button className="justify-self-start" onClick={onRetry} size="small">Retry</Button> : null}</div>;
  if (generating) return <div aria-live="polite" className="grid justify-items-center gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-6 py-16 text-center"><Spinner label="Generating Session Report" size="medium" /><div><h2 className="text-xl font-semibold">Generating Session Report…</h2><p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">AIR is organizing requirements, decisions, actions, questions, and insights.</p></div></div>;
  if (!report) return <EmptyState description="Generate a structured Session Report from reviewed research evidence." primaryAction={<Button onClick={onGenerate} size="small"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate Session Report</Button>} title="No Session Report yet" />;
  const evidenceItem = report.items.find((item) => item.id === evidenceItemId);
  return <div className="grid gap-4" ref={workspaceRef}>
    {evidenceItem ? <>
      <Button className="justify-self-start" onClick={closeEvidenceReview} size="small" variant="text"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Session Report</Button>
      <SessionReportEvidence item={evidenceItem} />
    </> : <SessionReport onApprove={onApprove} onCreateRevision={onCreateRevision} onEditItem={onEditItem ? beginItemEdit : undefined} onEditReport={onEditReport ? beginReportEdit : undefined} onOpenContext={beginEvidenceReview} onRegenerate={onRegenerate} onReview={onReview} report={report} />}
    <Dialog
      className="w-[42rem]"
      description="Update the researcher-facing title and summary. Supporting transcript evidence is preserved."
      onOpenChange={(open) => { if (!open) setEditingItem(undefined); }}
      onPrimary={() => { if (editingItem && itemTitle.trim() && itemSummary.trim()) onEditItem?.(editingItem.id, { title: itemTitle.trim(), summary: itemSummary.trim() }); }}
      open={Boolean(editingItem)}
      primaryLabel="Save changes"
      size="large"
      title="Edit report item"
    >
      <div className="grid gap-4 py-2"><InputField label="Title" onChange={(event) => setItemTitle(event.currentTarget.value)} required value={itemTitle} /><TextareaField label="Summary" onChange={(event) => setItemSummary(event.currentTarget.value)} required value={itemSummary} /></div>
    </Dialog>
    <Dialog
      className="w-[42rem]"
      description="Update the report-level executive summary and detailed notes. Requirements, decisions, actions, questions, and insights are edited on their individual cards."
      onOpenChange={setEditingReport}
      onPrimary={() => { if (executiveSummary.trim() && detailedNotes.trim()) onEditReport?.({ executiveSummary: executiveSummary.trim(), detailedNotes: detailedNotes.trim() }); }}
      open={editingReport}
      primaryLabel="Save changes"
      size="large"
      title="Edit Session Report"
    >
      <div className="grid gap-4 py-2"><TextareaField label="Executive summary" onChange={(event) => setExecutiveSummary(event.currentTarget.value)} required value={executiveSummary} /><TextareaField label="Detailed notes" onChange={(event) => setDetailedNotes(event.currentTarget.value)} required value={detailedNotes} /></div>
    </Dialog>
  </div>;
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
