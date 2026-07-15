import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import type { SessionFilters } from "@/api/types";
import { toSessionSummary } from "@/adapters/sessions";
import { ApplicationShell } from "@/components/application";
import { sessionApiFixtures, sessionCommonComponentOptions, sessionRecordOptions } from "@/mocks/fixtures/sessions";
import { emptySessionFilters } from "./session-view-data";
import { SessionsCollectionView, type SessionsCollectionViewProps } from "./session-views";

function StoryPage(props: Omit<SessionsCollectionViewProps, "filters" | "onFiltersChange"> & { initialFilters?: SessionFilters }) {
  const [filters, setFilters] = React.useState(props.initialFilters ?? emptySessionFilters);
  return <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ApplicationShell activeProjectItem="sessions" context="project" project={{ id: props.projectId, name: props.projectName }}><SessionsCollectionView {...props} filters={filters} onFiltersChange={setFilters} /></ApplicationShell></div>;
}

const meta = { title: "Page Templates/Sessions/Sessions Collection", component: StoryPage, tags: ["autodocs"], parameters: { layout: "fullscreen" }, args: { commonComponentOptions: sessionCommonComponentOptions, projectId: "alpha-project", projectName: "Alpha Project", recordOptions: sessionRecordOptions, sessions: sessionApiFixtures.map(toSessionSummary), state: "ready" } } satisfies Meta<typeof StoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Loading: Story = { args: { sessions: [], state: "loading" } };
export const Empty: Story = { args: { sessions: [], state: "empty" } };
export const NoResults: Story = { args: { initialFilters: { ...emptySessionFilters, search: "unmatched session" }, sessions: [], state: "no-results" } };
export const Error: Story = { args: { onRetry: () => undefined, sessions: [], state: "error" } };
export const NotFound: Story = { args: { sessions: [], state: "not-found" } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
