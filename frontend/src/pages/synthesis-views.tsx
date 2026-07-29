import * as React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

import { EmptyState, SharedRouteState } from "@/components/application";
import { AskThisSession } from "@/components/research/ask-this-session";
import { SessionReport } from "@/components/research/session-report";
import { SessionReportEvidence } from "@/components/research/session-report-evidence";
import { SessionReportOwnershipEditor } from "@/components/research/session-report-ownership-editor";
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
  onEdit?: (themeId: string, payload: { name: string; summary: string }) => Promise<void> | void;
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
  const [editingTheme, setEditingTheme] = React.useState<SessionTheme>();
  const [themeName, setThemeName] = React.useState("");
  const [themeSummary, setThemeSummary] = React.useState("");
  const [editPending, setEditPending] = React.useState(false);
  const [editError, setEditError] = React.useState<string>();
  const selected = themes.find((theme) => theme.id === selectedThemeId);
  const contextHref = (evidence: ThemeEvidenceDetailValue) => `/projects/${projectId}/sessions/${sessionId}/documents/${evidence.documentId}?result=${evidence.contextResultId}`;
  const beginEdit = (theme: SessionTheme) => {
    setEditingTheme(theme);
    setThemeName(theme.name);
    setThemeSummary(theme.summary);
    setEditError(undefined);
  };
  const closeEditor = () => {
    if (editPending) return;
    setEditingTheme(undefined);
    setEditError(undefined);
  };
  const saveTheme = async () => {
    if (!editingTheme || !themeName.trim() || !themeSummary.trim() || editPending) return;
    setEditPending(true);
    setEditError(undefined);
    try {
      await onEdit?.(editingTheme.id, {
        name: themeName.trim(),
        summary: themeSummary.trim(),
      });
      setEditingTheme(undefined);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Theme changes could not be saved. Try again.");
    } finally {
      setEditPending(false);
    }
  };
  if (state === "loading") return <SharedRouteState state="loading" />;
  if (state === "error") return <div className="grid gap-3"><Alert message={errorMessage ?? "Check your connection and try again."} size="large" title="Themes could not be loaded" tone="error" />{onRetry ? <Button className="justify-self-start" onClick={onRetry} size="small">Retry</Button> : null}</div>;
  if (generating) return <div aria-live="polite" className="grid justify-items-center gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-6 py-16 text-center"><Spinner label="Generating themes" size="medium" /><div><h2 className="text-xl font-semibold">Generating themes…</h2><p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">AIR is identifying patterns and supporting evidence in this Session.</p></div></div>;
  if (!themes.length) return <EmptyState description="Generate structured themes from this Session’s transcript and evidence." primaryAction={<Button onClick={onGenerate} size="small" variant="brand"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate themes</Button>} title="No themes yet" />;
  const content = selected
    ? <div className="grid gap-4"><Button className="justify-self-start" onClick={onCloseReview} size="small" variant="text">Back to themes</Button><ThemeEvidenceDetail contextHref={contextHref} onApprove={() => onStatusChange?.(selected.id, "approved")} onEdit={() => beginEdit(selected)} onOpenContext={onOpenContext} onReject={() => onStatusChange?.(selected.id, "rejected")} theme={selected} /></div>
    : <section aria-labelledby="themes-heading" className="grid gap-4"><header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold" id="themes-heading">Themes</h2><p className="text-sm text-[var(--air-color-text-secondary)]">Review generated patterns and inspect their supporting evidence.</p></div><Button onClick={onGenerate} size="small" variant="brand"><Sparkles aria-hidden="true" className="h-4 w-4" />Generate themes</Button></header><div className="grid gap-4">{themes.map((theme) => <ThemeCard key={theme.id} onEdit={() => beginEdit(theme)} onReject={() => onStatusChange?.(theme.id, "rejected")} onReview={() => onReview?.(theme)} theme={theme} />)}</div></section>;
  const editorValid = Boolean(themeName.trim() && themeSummary.trim());

  return <>
    {content}
    <Dialog
      className="w-[42rem]"
      description="Update the Theme name and summary. Evidence and review status will not change."
      dismissible={!editPending}
      onOpenChange={(open) => { if (!open) closeEditor(); }}
      open={Boolean(editingTheme)}
      showActions={false}
      size="large"
      title="Edit theme"
    >
      <div className="grid gap-4 py-2">
        <InputField disabled={editPending} label="Theme name" maxLength={180} onChange={(event) => setThemeName(event.currentTarget.value)} required value={themeName} />
        <TextareaField disabled={editPending} label="Theme summary" onChange={(event) => setThemeSummary(event.currentTarget.value)} required value={themeSummary} />
        {editError ? <Alert size="small" title={editError} tone="error" /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button disabled={editPending} onClick={closeEditor} size="small" type="button" variant="gray-subtle">Cancel</Button>
          <Button disabled={!editorValid || editPending} onClick={() => void saveTheme()} size="small" type="button" variant="brand">{editPending ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </Dialog>
  </>;
}

export interface SessionReportWorkspaceViewProps {
  errorMessage?: string;
  generating?: boolean;
  onApprove?: () => void;
  onCreateRevision?: () => void;
  onEditItem?: (itemId: string, payload: { title: string; summary: string; ownership?: { status: "confirmed" | "confirmed-empty"; value?: string } }) => void;
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
  const [itemOwnershipValue, setItemOwnershipValue] = React.useState("");
  const [itemOwnershipConfirmedEmpty, setItemOwnershipConfirmedEmpty] = React.useState(false);
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
    setItemOwnershipValue(item.ownership?.value ?? "");
    setItemOwnershipConfirmedEmpty(item.ownership?.status === "confirmed-empty");
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
  const editingItemHasOwnership = editingItem?.type === "decision" || editingItem?.type === "action-item";
  const editingOwnershipIsValid = !editingItemHasOwnership
    || itemOwnershipConfirmedEmpty
    || Boolean(itemOwnershipValue.trim());
  const itemFormIsValid = Boolean(editingItem && itemTitle.trim() && editingOwnershipIsValid);
  return <div className="grid gap-4" ref={workspaceRef}>
    {evidenceItem ? <>
      <Button className="justify-self-start" onClick={closeEvidenceReview} size="small" variant="text"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Session Report</Button>
      <SessionReportEvidence item={evidenceItem} />
    </> : <SessionReport onApprove={onApprove} onCreateRevision={onCreateRevision} onEditItem={onEditItem ? beginItemEdit : undefined} onEditReport={onEditReport ? beginReportEdit : undefined} onOpenContext={beginEvidenceReview} onRegenerate={onRegenerate} onReview={onReview} report={report} />}
    <Dialog
      className="w-[42rem]"
      description="Update the report item. Supporting transcript evidence is preserved."
      onOpenChange={(open) => { if (!open) setEditingItem(undefined); }}
      onPrimary={() => {
        if (!editingItem || !itemFormIsValid) return;
        const hasOwnership = editingItem.type === "decision" || editingItem.type === "action-item";
        onEditItem?.(editingItem.id, {
          title: itemTitle.trim(),
          summary: itemSummary.trim(),
          ownership: hasOwnership ? {
            status: itemOwnershipConfirmedEmpty ? "confirmed-empty" : "confirmed",
            value: itemOwnershipConfirmedEmpty ? undefined : itemOwnershipValue.trim(),
          } : undefined,
        });
      }}
      open={Boolean(editingItem)}
      primaryDisabled={!itemFormIsValid}
      primaryLabel="Save changes"
      size="large"
      title="Edit report item"
    >
      <div className="grid gap-4 py-2">
        <InputField label="Title" onChange={(event) => setItemTitle(event.currentTarget.value)} required value={itemTitle} />
        <TextareaField label="Summary" onChange={(event) => setItemSummary(event.currentTarget.value)} optional value={itemSummary} />
        {editingItem && (editingItem.type === "decision" || editingItem.type === "action-item") ? (
          <SessionReportOwnershipEditor
            confirmedEmpty={itemOwnershipConfirmedEmpty}
            item={editingItem}
            onConfirmedEmptyChange={setItemOwnershipConfirmedEmpty}
            onValueChange={setItemOwnershipValue}
            participantNames={report.participants.map((participant) => participant.name)}
            value={itemOwnershipValue}
          />
        ) : null}
      </div>
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
  onNewChat?: () => void;
  onOpenContext?: (href: string) => void;
  projectId: string;
  sessionId: string;
  state?: "before-report" | "ready" | "loading" | "error";
  suggestedQuestions: string[];
}

export function AskThisSessionWorkspaceView(props: AskThisSessionWorkspaceViewProps) {
  return <AskThisSession {...props} />;
}
