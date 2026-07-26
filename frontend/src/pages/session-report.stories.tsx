import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { toSessionReport } from "@/adapters/synthesis";
import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import type { SessionReport as SessionReportValue } from "@/domain/types";
import { SessionDetailView } from "./session-views";
import { SessionReportWorkspaceView, type SessionReportWorkspaceViewProps } from "./synthesis-views";

function StoryPage(props: SessionReportWorkspaceViewProps) {
  const [storyReport, setStoryReport] = React.useState(props.report);

  React.useEffect(() => {
    setStoryReport(props.report);
  }, [props.report]);

  const handleEditItem: SessionReportWorkspaceViewProps["onEditItem"] = props.onEditItem
    ? (itemId, payload) => {
      setStoryReport((current) => current ? {
        ...current,
        items: current.items.map((item) => {
          if (item.id !== itemId) return item;
          const ownership = payload.ownership && (item.type === "decision" || item.type === "action-item")
            ? {
              role: item.type === "decision" ? "decision-maker" as const : "assignee" as const,
              value: payload.ownership.status === "confirmed-empty" ? undefined : payload.ownership.value,
              status: payload.ownership.status,
              rationale: item.ownership?.rationale,
            }
            : item.ownership;
          return { ...item, title: payload.title, summary: payload.summary, ownership };
        }),
      } : current);
      props.onEditItem?.(itemId, payload);
    }
    : undefined;

  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: "alpha-project", name: "Alpha Project" }}><SessionDetailView activeTab="report" onEditSession={() => undefined} projectId="alpha-project" projectName="Alpha Project" session={toSessionSummary(sessionApiFixtures[0])} workspaceContent={<SessionReportWorkspaceView {...props} onEditItem={handleEditItem} report={storyReport} />} /></ApplicationShell></div>;
}
const report = toSessionReport(sessionReportFixture);
function withOwnership(source: SessionReportValue, confirmed: boolean): SessionReportValue {
  return {
    ...source,
    items: source.items.map((item) => item.type === "decision"
      ? { ...item, ownership: confirmed ? { role: "decision-maker", value: "Rachel Chen", status: "confirmed" } : { role: "decision-maker", status: "needs-review" } }
      : item.type === "action-item"
        ? { ...item, ownership: confirmed ? { role: "assignee", value: "Design team", status: "confirmed" } : { role: "assignee", status: "needs-review" } }
        : item),
  };
}
const meta = { title: "Page Templates/Sessions/Session Report Workspace", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { onApprove: () => undefined, onCreateRevision: () => undefined, onEditItem: () => undefined, onEditReport: () => undefined, onGenerate: () => undefined, onRegenerate: () => undefined, onReview: () => undefined, report } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Empty: Story = { args: { report: undefined } };
export const Generating: Story = { args: { generating: true } };
export const Error: Story = { args: { errorMessage: "Check your connection and try again.", state: "error" } };
export const ReadyForApproval: Story = { args: { report: withOwnership({ ...report, status: "researcher-reviewed" }, true) } };
export const ApprovalBlocked: Story = {
  args: { report: withOwnership({ ...report, status: "researcher-reviewed" }, false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Approve report" }));
    await expect(canvas.getByRole("alert")).toHaveFocus();
  },
};
export const EditDecisionOwnership: Story = {
  args: { report: withOwnership({ ...report, status: "researcher-reviewed" }, false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const decision = report.items.find((item) => item.type === "decision")!;
    await userEvent.click(canvas.getByRole("button", { name: decision.title }));
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    const dialog = within(document.body);
    await expect(dialog.getByRole("dialog", { name: "Edit report item" })).toBeVisible();
    await userEvent.click(dialog.getByRole("combobox", { name: /Decision maker/ }));
    await expect(dialog.getByRole("listbox", { name: "Decision maker options" })).toBeVisible();
  },
};
export const Approved: Story = { args: { report: { ...report, status: "approved" } } };
export const Evidence: Story = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(canvas.getByRole("button", { name: report.items[0].title })); await userEvent.click(canvas.getAllByRole("button", { name: "Open evidence" })[0]); } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
