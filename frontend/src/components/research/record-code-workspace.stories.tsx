import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import {
  RecordCodeWorkspace,
  type RecordCodeWorkspaceProps,
} from "./record-code-workspace";
import { recordCodeDetails } from "./record-code-story-data";
import { sortRecordCodeStoryValues } from "./record-code-story-utils";
import type {
  RecordCodeDetailValue,
  RecordCodeSortValue,
} from "./record-code-types";

type WorkspaceStoryProps = Omit<
  RecordCodeWorkspaceProps,
  | "codes"
  | "onClearSearch"
  | "onQueryChange"
  | "onSelectCode"
  | "onSortChange"
  | "query"
  | "selectedCode"
  | "sort"
> & {
  details: RecordCodeDetailValue[];
  initialQuery?: string;
  initialSelectedCodeId?: string;
  initialSort?: RecordCodeSortValue;
};

function WorkspaceStory({
  collectionState = "ready",
  details,
  initialQuery = "",
  initialSelectedCodeId = recordCodeDetails[0].id,
  initialSort = "most-highlights",
  ...props
}: WorkspaceStoryProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedCodeId, setSelectedCodeId] = React.useState(initialSelectedCodeId);
  const [sort, setSort] = React.useState<RecordCodeSortValue>(initialSort);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCodes = collectionState === "ready"
    ? sortRecordCodeStoryValues(
        details.filter((code) => code.name.toLocaleLowerCase().includes(normalizedQuery)),
        sort,
      )
    : [];
  const selectedCode = details.find((code) => code.id === selectedCodeId);

  return (
    <RecordCodeWorkspace
      {...props}
      codes={visibleCodes}
      collectionState={collectionState}
      onClearSearch={() => setQuery("")}
      onQueryChange={setQuery}
      onSelectCode={setSelectedCodeId}
      onSortChange={setSort}
      query={query}
      selectedCode={selectedCode}
      sort={sort}
    />
  );
}

const meta = {
  title: "Research Objects/Record/Record Transcript Codes Workspace",
  component: WorkspaceStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    details: recordCodeDetails,
    eligibleSessionCount: 5,
    onOpenInTranscriptCoding: fn(),
    onRetryCollection: fn(),
    onRetryComparison: fn(),
    onViewRelatedSessions: fn(),
    totalCodeCount: recordCodeDetails.length,
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen min-w-[1184px] bg-[var(--air-color-bg-canvas)] p-8">
        <div className="mx-auto max-w-[1120px]">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof WorkspaceStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const SortOpen: Story = { args: { defaultSortOpen: true } };
export const NoResults: Story = { args: { initialQuery: "delivery" } };
export const Empty: Story = {
  args: {
    collectionState: "empty",
    details: [],
    initialSelectedCodeId: "",
    totalCodeCount: 0,
  },
};
export const CollectionError: Story = {
  args: { collectionState: "error" },
};
export const ComparisonError: Story = {
  args: { comparisonState: "error" },
};
export const NoSelection: Story = {
  args: { comparisonState: "no-selection", initialSelectedCodeId: "" },
};
