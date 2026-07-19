import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { recordSummaries } from "@/mocks/fixtures/records";
import { RecordsCollectionView, type RecordsCollectionViewProps } from "./record-views";

function StoryPage(props: RecordsCollectionViewProps) {
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeGlobalItem="records" context="workspace"><RecordsCollectionView {...props} /></ApplicationShell></div>;
}

const meta = {
  title: "Page Templates/Records/Records Collection",
  component: StoryPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { records: recordSummaries, state: "ready" },
} satisfies Meta<typeof StoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Loading: Story = { args: { records: [], state: "loading" } };
export const Empty: Story = { args: { records: [], state: "empty" } };
export const Error: Story = { args: { onRetry: () => undefined, records: [], state: "error" } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
