import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import { participantSummaries, recordOptions } from "@/mocks/fixtures/participants";
import { ParticipantDetailView, type ParticipantDetailViewProps } from "@/pages/participant-views";

const alex = participantSummaries[0];
const defaultValues = {
  firstName: alex.firstName,
  lastName: alex.lastName,
  email: alex.email ?? "",
  organization: alex.organization ?? "",
  role: alex.role ?? "",
  recordIds: alex.recordIds,
  researcherNotes: alex.researcherNotes ?? "",
};

function ParticipantDetailStory(props: ParticipantDetailViewProps) {
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell
        activeProjectItem="participants"
        context="project"
        project={{ id: props.projectId, name: props.projectName }}
      >
        <ParticipantDetailView {...props} />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Participants/Participant Detail",
  component: ParticipantDetailStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    defaultValues,
    mode: "edit",
    onSubmit: () => undefined,
    participant: alex,
    projectId: "alpha-project",
    projectName: "Alpha Project",
    recordOptions,
    routeState: "ready",
  },
} satisfies Meta<typeof ParticipantDetailStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pristine: Story = {};
export const Submitting: Story = { args: { isSubmitting: true } };
export const RequestFailure: Story = { args: { submitError: "The participant could not be saved. Try again." } };
export const NotFound: Story = { args: { routeState: "not-found" } };
export const AddParticipant: Story = {
  args: {
    defaultValues: undefined,
    mode: "create",
    participant: undefined,
  },
};
