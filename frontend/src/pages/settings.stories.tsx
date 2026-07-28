import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApplicationShell } from "@/components/application";
import type { AIProviderSettingsFormState } from "@/components/research/ai-provider-settings-form";
import { liveAISettingsValues } from "@/mocks/fixtures/settings";
import { SettingsView } from "@/pages/project-views";

const statusMessages: Partial<Record<AIProviderSettingsFormState, string>> = {
  testing: "Sending a minimal request with the saved provider and model. No research data is included.",
  "test-success": "Connected to openai using gpt-5.6-terra. No research data was sent.",
  "test-failure":
    "Could not connect to openai using gpt-5.6-terra. Check the API key, model access, billing, and network connection.",
};

function SettingsStory({ active = "ai", state = "ready" }: { active?: "profile" | "ai"; state?: AIProviderSettingsFormState }) {
  return (
    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
      <ApplicationShell activeGlobalItem={null} context="workspace">
        <SettingsView
          active={active}
          aiSettingsProps={active === "ai" ? {
            apiKeyEnvVar: "OPENAI_API_KEY",
            hasApiKey: true,
            initialValues: liveAISettingsValues,
            onSave: () => undefined,
            onTest: () => undefined,
            state,
            statusMessage: statusMessages[state],
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
export const AIProviderConnectionVerified: Story = { args: { state: "test-success" } };
export const AIProviderConnectionFailed: Story = { args: { state: "test-failure" } };
export const UserProfile: Story = { args: { active: "profile" } };
