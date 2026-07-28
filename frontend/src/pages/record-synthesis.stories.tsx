import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { alphaProject } from "@/mocks/fixtures/domain";
import { insufficientRecordScope, readyRecordScope, recordSummaries, recordSynthesis } from "@/mocks/fixtures/records";
import { RecordSynthesisView, type RecordSynthesisViewProps } from "./record-views";

const recordRootPath = `/projects/${alphaProject.id}/records`;

function StoryPage(props: RecordSynthesisViewProps) {
  const recordId = props.record?.id ?? "record-1";
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectChildId={recordId} activeProjectItem="records" context="project" project={{ id: alphaProject.id, name: alphaProject.name }}><RecordSynthesisView {...props} recordRootPath={recordRootPath} /></ApplicationShell></div>;
}

const failed = { ...recordSynthesis, id: "failed", status: "failed" as const, items: [], errorMessage: "AIR could not complete this synthesis. The eligible Session Reports remain available." };

const meta = {
  title: "Page Templates/Records/Record Synthesis",
  component: StoryPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { onGenerate: () => undefined, record: recordSummaries[0], scope: readyRecordScope, state: "results", synthesis: recordSynthesis },
} satisfies Meta<typeof StoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Results: Story = {};
export const Empty: Story = { args: { state: "empty", synthesis: undefined } };
export const Processing: Story = { args: { state: "processing", synthesis: { ...recordSynthesis, status: "processing", items: [] } } };
export const Failed: Story = { args: { state: "failed", synthesis: failed } };
export const InsufficientData: Story = { args: { record: recordSummaries[1], scope: insufficientRecordScope, state: "insufficient", synthesis: undefined } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
