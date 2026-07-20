import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { participantSummaries } from "@/mocks/fixtures/participants";
import {
  ParticipantsCollectionView,
  type ParticipantsCollectionViewProps,
} from "@/pages/participant-views";

function ParticipantsCollectionStory(
  props: Omit<ParticipantsCollectionViewProps, "onSearchChange" | "search">,
) {
  const [search, setSearch] = React.useState("");
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell
        activeProjectItem="participants"
        context="project"
        project={{ id: props.projectId, name: props.projectName }}
      >
        <ParticipantsCollectionView {...props} onSearchChange={setSearch} search={search} />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Participants/Participants Collection",
  component: ParticipantsCollectionStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    participants: participantSummaries,
    projectId: "alpha-project",
    projectName: "Alpha Project",
    state: "ready",
  },
} satisfies Meta<typeof ParticipantsCollectionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Loading: Story = { args: { participants: [], state: "loading" } };
export const Empty: Story = { args: { participants: [], state: "empty" } };
export const Error: Story = { args: { participants: [], state: "error" } };
export const NotFound: Story = { args: { participants: [], state: "not-found" } };
