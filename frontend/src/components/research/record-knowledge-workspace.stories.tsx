import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { recordSynthesisItems } from "@/mocks/fixtures/records";
import {
  RecordKnowledgeWorkspace,
  type RecordKnowledgeWorkspaceProps,
} from "./record-knowledge-workspace";

type WorkspaceStoryProps = Omit<
  RecordKnowledgeWorkspaceProps,
  "expandedItemIds" | "onQueryChange" | "onToggleItem" | "query"
> & {
  initialExpandedItemIds?: string[];
  initialQuery?: string;
};

function WorkspaceStory({
  initialExpandedItemIds = [],
  initialQuery = "",
  ...props
}: WorkspaceStoryProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [expandedItemIds, setExpandedItemIds] = React.useState(
    () => new Set(initialExpandedItemIds),
  );

  function toggleItem(itemId: string) {
    setExpandedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <RecordKnowledgeWorkspace
        {...props}
        expandedItemIds={expandedItemIds}
        onQueryChange={setQuery}
        onToggleItem={toggleItem}
        query={query}
      />
    </div>
  );
}

const meta = {
  title: "Research Objects/Record/Record Knowledge Workspace",
  component: WorkspaceStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <main className="min-h-screen bg-[var(--air-color-bg-canvas)] p-8"><Story /></main>],
  args: {
    items: recordSynthesisItems,
    onOpenEvidence: () => undefined,
    onRetry: () => undefined,
    onStatusChange: () => undefined,
  },
} satisfies Meta<typeof WorkspaceStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Loading: Story = { args: { items: [], state: "loading" } };
export const Empty: Story = { args: { items: [], state: "empty" } };
export const Error: Story = { args: { items: [], state: "error" } };
export const SearchResults: Story = {
  args: {
    initialExpandedItemIds: [
      "record-decision-literal-search",
      "record-action-evidence-links",
    ],
    initialQuery: "knowledge",
  },
};
export const NoResults: Story = { args: { initialQuery: "chargeback" } };
export const LongContent: Story = {
  args: {
    items: [
      {
        ...recordSynthesisItems[0],
        title: "Checkout confirmation must explain payment success while preserving complete order, delivery, and participant context",
        summary: "This deliberately long summary verifies that the approved disclosure, lifecycle badge, provenance, source summary, and evidence actions wrap without clipping or changing their logical reading order.",
      },
      ...recordSynthesisItems.slice(1),
    ],
  },
};
