import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  ApplicationShell,
  PageHeader,
  SectionNavigation,
} from "@/components/application";
import {
  AskProjectWorkspace,
  type AskProjectWorkspaceProps,
} from "@/components/research/ask-project-workspace";
import {
  askProjectAnsweredTurns,
  askProjectGeneratingTurns,
  askProjectInsufficientEvidenceTurns,
  askProjectQuestion,
  askProjectSuggestedQuestions,
  emptyAskProjectSourceAvailability,
} from "@/mocks/fixtures/ask-project";

const project = {
  id: "healthcare-fraud-project",
  name: "Healthcare Fraud Project",
};

function ProjectAskStoryPage(props: AskProjectWorkspaceProps) {
  const root = `/projects/${project.id}`;

  return (
    <div
      onClickCapture={(event) => {
        const link = (event.target as HTMLElement).closest("a");
        if (link && !link.getAttribute("href")?.startsWith("#")) {
          event.preventDefault();
        }
      }}
    >
      <ApplicationShell
        activeProjectItem="ask-project"
        context="project"
        project={project}
      >
        <div className="grid gap-6">
          <PageHeader
            breadcrumbs={[
              { href: "/projects", label: "Projects" },
              { href: `${root}/overview`, label: project.name },
              { label: "Ask this project" },
            ]}
            description="Ask grounded questions across every searchable Session in this Project."
            title={project.name}
          />
          <SectionNavigation
            activeId="ask"
            items={[
              { href: `${root}/overview`, id: "overview", label: "Overview" },
              {
                href: `${root}/participants`,
                id: "participants",
                label: "Participants",
              },
              { href: `${root}/sessions`, id: "sessions", label: "Sessions" },
              { href: `${root}/ask`, id: "ask", label: "Ask this project" },
            ]}
            label="Project sections"
          />
          <AskProjectWorkspace {...props} />
        </div>
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Projects/Ask This Project",
  component: ProjectAskStoryPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
Desktop Project route for grounded questions across searchable Session transcripts.

- Canonical route: \`/projects/:projectId/ask\`.
- Ask this project is active in the left Project navigation and horizontal Project section navigation.
- Ask remains disabled until a suggested question is selected or a custom question is entered.
- New chat clears the current conversation and retains suggestions.
- [Approved Desktop Suggested questions page](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1147-1694)
        `,
      },
    },
    layout: "fullscreen",
  },
  args: {
    onAsk: fn(),
    onNewChat: fn(),
    onOpenSessions: fn(),
    onOpenTranscriptContext: fn(),
    onRetry: fn(),
    onSuggestedQuestion: fn(),
    state: "suggested",
    suggestedQuestions: askProjectSuggestedQuestions,
  },
  argTypes: {
    onAsk: { control: false },
    onNewChat: { control: false },
    onOpenSessions: { control: false },
    onOpenTranscriptContext: { control: false },
    onRetry: { control: false },
    onSuggestedQuestion: { control: false },
    turns: { control: false },
  },
} satisfies Meta<typeof ProjectAskStoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuggestedQuestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const projectNavigation = canvas.getByRole("navigation", {
      name: "Project navigation",
    });
    const sectionNavigation = canvas.getByRole("navigation", {
      name: "Project sections",
    });

    await expect(
      within(projectNavigation).getByRole("link", {
        name: "Ask this project",
      }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      within(sectionNavigation).getByRole("link", {
        name: "Ask this project",
      }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Ask this project" }),
    ).toBeVisible();
    const askButton = canvas.getByRole("button", { name: "Ask" });
    await expect(askButton).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: askProjectSuggestedQuestions[0] }),
    );
    await expect(askButton).toBeEnabled();
  },
};

export const Answered: Story = {
  args: {
    state: "answered",
    turns: askProjectAnsweredTurns,
  },
};

export const NewChat: Story = {
  args: {
    state: "answered",
    turns: askProjectAnsweredTurns,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New chat" }));
    await expect(args.onNewChat).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole("list", { name: "Ask Project conversation" }),
    ).not.toBeInTheDocument();
  },
};

export const GeneratingAnswer: Story = {
  args: {
    state: "generating",
    turns: askProjectGeneratingTurns,
  },
};

export const RecoverableError: Story = {
  args: {
    initialQuestion: askProjectQuestion,
    state: "recoverable-error",
    turns: askProjectGeneratingTurns,
  },
};

export const InsufficientEvidence: Story = {
  args: {
    state: "insufficient-evidence",
    turns: askProjectInsufficientEvidenceTurns,
  },
};

export const NoSearchableSources: Story = {
  args: {
    sourceAvailability: emptyAskProjectSourceAvailability,
    state: "no-sources",
  },
};
