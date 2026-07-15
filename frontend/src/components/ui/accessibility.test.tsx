import axe from "axe-core";
import { render } from "@testing-library/react";
import { Info, Plus } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import { InputField } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { NotificationItem } from "@/components/ui/notification";
import { PasswordField } from "@/components/ui/password-field";
import { Progress } from "@/components/ui/progress";
import { Radio } from "@/components/ui/radio";
import { Spinner } from "@/components/ui/spinner";
import { Tabs } from "@/components/ui/tabs";
import { TextareaField } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";

describe("design system accessibility", () => {
  it("has no automated semantic violations in representative component states", async () => {
    const { container } = render(
      <main>
        <Button>Continue</Button>
        <IconButton icon={<Plus aria-hidden="true" />} label="Add item" />
        <Link href="#details">Project details</Link>
        <InputField label="Project name" hint="Use a recognizable name." />
        <PasswordField label="Password" />
        <TextareaField label="Description" />
        <Checkbox label="Include archived sessions" description="Include archived sessions in results." />
        <Radio label="Moderated" name="format" />
        <Toggle label="Synthesis notifications" />
        <Avatar alt="Jordan Lee" initials="JL" showNotification showStatus size="large" />
        <Badge>In progress</Badge>
        <Chip>Interviews</Chip>
        <Alert title="Project uploaded" tone="success" />
        <Progress label="Project upload" value={50} />
        <Spinner label="Loading projects" />
        <Accordion title="Project details" content="Supporting details" />
        <Breadcrumbs items={[{ href: "#projects", label: "Projects" }, { label: "Project details" }]} />
        <Tabs
          aria-label="Project sections"
          items={[
            { content: "Overview content", label: "Overview", value: "overview" },
            { content: "Sessions content", label: "Sessions", value: "sessions" },
          ]}
        />
        <NotificationItem actorName="Jordan Lee" time="Today" title="mentioned you" />
        <IconButton icon={<Info aria-hidden="true" />} label="More information" />
      </main>,
    );

    const result = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });

    expect(result.violations).toEqual([]);
  });
});
