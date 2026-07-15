import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageHeader } from "@/components/application/page-header";
import { SectionNavigation } from "@/components/application/section-navigation";
import { Button } from "@/components/ui/button";

const sessionItems = [
  { id: "overview", label: "Overview", href: "#overview" },
  { id: "participants", label: "Participants", href: "#participants" },
  { id: "transcript", label: "Transcript", href: "#transcript" },
  { id: "themes", label: "Themes", href: "#themes" },
  { id: "report", label: "Session Report", href: "#report" },
  { id: "ask", label: "Ask this session", href: "#ask" },
];

const meta = {
  title: "Application Foundation/Page Navigation",
  component: PageHeader,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto grid max-w-5xl gap-6 p-6"><Story /></div>],
  args: {
    title: "Participants",
    description: "Manage the people who take part in this project's research sessions.",
    breadcrumbs: [
      { href: "#projects", label: "Projects" },
      { href: "#alpha", label: "Alpha Project" },
      { label: "Participants" },
    ],
    actions: <Button size="small">Add participant</Button>,
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {};

export const SessionSectionNavigation: Story = {
  render: (args) => (
    <>
      <PageHeader {...args} description="Review one research session." title="Checkout workflow interview" />
      <SectionNavigation activeId="transcript" items={sessionItems} label="Session sections" />
    </>
  ),
};

