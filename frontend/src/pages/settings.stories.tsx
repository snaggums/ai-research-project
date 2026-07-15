import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import type { AIProviderSettingsFormState } from "@/components/research/ai-provider-settings-form";
import { mockAISettingsValues } from "@/mocks/fixtures/settings";
import { SettingsView } from "@/pages/project-views";

function SettingsStory({ active = "ai", state = "ready" }: { active?: "profile" | "ai"; state?: AIProviderSettingsFormState }) {
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell activeGlobalItem={null} context="workspace">
        <SettingsView
          active={active}
          aiSettingsProps={active === "ai" ? {
            initialValues: mockAISettingsValues,
            onSave: () => undefined,
            onTest: () => undefined,
            state,
          } : undefined}
        />
      </ApplicationShell>
    </div>
  );
}

const meta = {
  title: "Page Templates/Settings/Settings",
  component: SettingsStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AIProviderSettings: Story = {};
export const AIProviderSaveSuccess: Story = { args: { state: "save-success" } };
export const AIProviderTestFailure: Story = { args: { state: "test-failure" } };
export const UserProfile: Story = { args: { active: "profile" } };
