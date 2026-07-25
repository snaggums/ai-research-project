import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RecordSearchToolbar, type RecordSearchToolbarProps } from "./record-search-toolbar";

function ToolbarStory(props: RecordSearchToolbarProps) {
  const [query, setQuery] = React.useState(props.query);
  return (
    <div className="max-w-5xl">
      <RecordSearchToolbar
        {...props}
        onClear={() => setQuery("")}
        onQueryChange={setQuery}
        query={query}
        resultContext={query ? props.resultContext : "Latest synthesis"}
        resultCount={query ? props.resultCount : 9}
      />
    </div>
  );
}

const meta = {
  title: "Research Objects/Record/Record Search Toolbar",
  component: ToolbarStory,
  tags: ["autodocs"],
  args: {
    onClear: () => undefined,
    onQueryChange: () => undefined,
    query: "",
    resultContext: "Latest synthesis",
    resultCount: 9,
  },
} satisfies Meta<typeof ToolbarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {};
export const Matching: Story = {
  args: { query: "knowledge", resultContext: "Match “knowledge”", resultCount: 3 },
};
export const NoResults: Story = {
  args: { query: "chargeback", resultContext: "No matches for “chargeback”", resultCount: 0 },
};
export const DisabledWhileLoading: Story = {
  args: { disabled: true, resultContext: "Loading latest synthesis", resultCount: 0 },
};
