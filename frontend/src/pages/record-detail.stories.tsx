import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { toSessionSummary } from "@/adapters/sessions";
import { insufficientRecordScope, readyRecordScope, recordSummaries, recordSynthesis } from "@/mocks/fixtures/records";
import { sessionApiFixtures } from "@/mocks/fixtures/sessions";
import { RecordDetailView, type RecordDetailViewProps } from "./record-views";

function StoryPage(props: RecordDetailViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeGlobalItem="records" activeGlobalSubItem={props.record?.id ?? "record-1"} context="workspace"><RecordDetailView {...props} /></ApplicationShell></div>;
}

const meta = {
  title: "Page Templates/Records/Record Detail",
  component: StoryPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    record: recordSummaries[0],
    scope: readyRecordScope,
    sessions: sessionApiFixtures.filter((session) => session.related_records.some((record) => record.id === "record-1")).map(toSessionSummary),
    synthesis: recordSynthesis,
  },
} satisfies Meta<typeof StoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const InsufficientData: Story = { args: { record: recordSummaries[1], scope: insufficientRecordScope, sessions: sessionApiFixtures.slice(0, 1).map(toSessionSummary), synthesis: undefined } };
export const Loading: Story = { args: { record: undefined, routeState: "loading", scope: undefined, sessions: [] } };
export const Error: Story = { args: { onRetry: () => undefined, record: undefined, routeState: "error", scope: undefined, sessions: [] } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
