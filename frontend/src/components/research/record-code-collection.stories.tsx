import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  RecordCodeCollection,
  type RecordCodeCollectionProps,
} from "./record-code-collection";
import { recordCodeDetails } from "./record-code-story-data";
import { sortRecordCodeStoryValues } from "./record-code-story-utils";
import type { RecordCodeSortValue } from "./record-code-types";

type CollectionStoryProps = Omit<
  RecordCodeCollectionProps,
  "onClearSearch" | "onQueryChange" | "onSortChange" | "query" | "sort"
> & {
  initialQuery?: string;
  initialSort?: RecordCodeSortValue;
};

function CollectionStory({
  codes,
  initialQuery = "",
  initialSort = "most-highlights",
  ...props
}: CollectionStoryProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [sort, setSort] = React.useState<RecordCodeSortValue>(initialSort);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCodes = sortRecordCodeStoryValues(
    codes.filter((code) => code.name.toLocaleLowerCase().includes(normalizedQuery)),
    sort,
  );

  return (
    <RecordCodeCollection
      {...props}
      codes={visibleCodes}
      onClearSearch={() => setQuery("")}
      onQueryChange={setQuery}
      onSortChange={setSort}
      query={query}
      sort={sort}
    />
  );
}

const meta = {
  title: "Research Objects/Record/Record Code Collection",
  component: CollectionStory,
  tags: ["autodocs"],
  args: {
    codes: recordCodeDetails,
    onRetry: fn(),
    onSelectCode: fn(),
    onViewRelatedSessions: fn(),
    selectedCodeId: recordCodeDetails[0].id,
    sessionCount: 5,
    totalCodeCount: recordCodeDetails.length,
  },
  decorators: [(Story) => <div className="min-h-[980px] p-6"><Story /></div>],
} satisfies Meta<typeof CollectionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const SortOpen: Story = { args: { defaultSortOpen: true } };
export const MostSessionsSelected: Story = { args: { initialSort: "most-sessions" } };
export const MostRecentEvidenceSelected: Story = {
  args: { initialSort: "most-recent-evidence" },
};
export const NameAscendingSelected: Story = { args: { initialSort: "name-asc" } };
export const NameDescendingSelected: Story = { args: { initialSort: "name-desc" } };
export const SortInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sortBy = canvas.getByRole("combobox", { name: "Sort by" });
    const codeList = () => within(canvas.getByRole("list", {
      name: "Accepted Record Codes",
    })).getAllByRole("button");

    await userEvent.click(sortBy);
    await userEvent.click(canvas.getByRole("option", { name: "Name Z–A" }));
    await expect(codeList()[0]).toHaveTextContent(
      "Submission readiness requires explicit criteria and audit receipt",
    );

    await userEvent.click(sortBy);
    await userEvent.click(canvas.getByRole("option", { name: "Name A–Z" }));
    await expect(codeList()[0]).toHaveTextContent(
      "Allegation classification is ambiguous for overlapping fraud types",
    );

    await userEvent.click(sortBy);
    await userEvent.click(canvas.getByRole("option", { name: "Most recent evidence" }));
    await expect(codeList()[1]).toHaveTextContent(
      "Need for clear supervisory workflow controls",
    );

    await userEvent.click(sortBy);
    await userEvent.click(canvas.getByRole("option", { name: "Most Sessions" }));
    await expect(codeList()[2]).toHaveTextContent(
      "Explicit submission readiness and audit receipt",
    );

    await userEvent.click(sortBy);
    await userEvent.click(canvas.getByRole("option", { name: "Most highlights" }));
    await expect(codeList()[2]).toHaveTextContent(
      "Explicit submission readiness and audit receipt",
    );
  },
};
export const Loading: Story = {
  args: {
    codes: [],
    selectedCodeId: undefined,
    sessionCount: 0,
    state: "loading",
    totalCodeCount: 0,
  },
};
export const NoResults: Story = { args: { initialQuery: "delivery" } };
export const Empty: Story = {
  args: { codes: [], sessionCount: 5, state: "empty", totalCodeCount: 0 },
};
export const Error: Story = { args: { codes: [], state: "error" } };
