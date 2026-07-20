import type { Meta, StoryObj } from "@storybook/react-vite";

import { AIProviderSettingsForm } from "@/components/research/ai-provider-settings-form";
import { mockAISettingsValues } from "@/mocks/fixtures/settings";

const meta = {
  title: "Research Objects/Settings/AI Provider Settings Form",
  component: AIProviderSettingsForm,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-6"><Story /></div>],
  args: {
    apiKeyEnvVar: null,
    hasApiKey: false,
    initialValues: mockAISettingsValues,
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

export const Ready: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const LoadError: Story = { args: { state: "load-error" } };
export const Saving: Story = { args: { state: "saving" } };
export const SaveSuccess: Story = { args: { state: "save-success" } };
export const SaveError: Story = { args: { state: "save-error" } };
export const Testing: Story = { args: { state: "testing" } };
export const TestSuccess: Story = { args: { state: "test-success" } };
export const TestFailure: Story = { args: { state: "test-failure" } };

