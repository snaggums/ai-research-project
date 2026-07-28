import type { Meta, StoryObj } from "@storybook/react-vite";

import { AIProviderSettingsForm } from "@/components/research/ai-provider-settings-form";
import { liveAISettingsValues } from "@/mocks/fixtures/settings";

const meta = {
  title: "Research Objects/Settings/AI Provider Settings Form",
  component: AIProviderSettingsForm,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-6"><Story /></div>],
  args: {
    apiKeyEnvVar: "OPENAI_API_KEY",
    hasApiKey: true,
    initialValues: liveAISettingsValues,
    onSave: () => undefined,
    onTest: () => undefined,
    state: "ready",
  },
  argTypes: {
    state: {
      control: "select",
      options: ["ready", "loading", "load-error", "saving", "save-success", "save-error", "testing", "test-success", "test-failure"],
    },
  },
} satisfies Meta<typeof AIProviderSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const APIKeyDetected: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const LoadError: Story = { args: { state: "load-error" } };
export const Saving: Story = { args: { state: "saving" } };
export const SaveSuccess: Story = { args: { state: "save-success" } };
export const SaveError: Story = { args: { state: "save-error" } };
export const TestingConnectionAndModel: Story = {
  args: {
    state: "testing",
    statusMessage: "Sending a minimal request with the saved provider and model. No research data is included.",
  },
};
export const ConnectionAndModelVerified: Story = {
  args: {
    state: "test-success",
    statusMessage: "Connected to openai using gpt-5.6-terra. No research data was sent.",
  },
};
export const ConnectionFailed: Story = {
  args: {
    state: "test-failure",
    statusMessage:
      "Could not connect to openai using gpt-5.6-terra. Check the API key, model access, billing, and network connection.",
  },
};

