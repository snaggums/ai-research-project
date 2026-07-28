import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AIProviderSettingsForm } from "@/components/research/ai-provider-settings-form";
import { mockAISettingsValues } from "@/mocks/fixtures/settings";

describe("AIProviderSettingsForm", () => {
  it("saves normalized provider settings", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <AIProviderSettingsForm
        initialValues={{ ...mockAISettingsValues, base_url: "  " }}
        onSave={onSave}
        onTest={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save settings" }));
    expect(onSave).toHaveBeenCalledWith({ ...mockAISettingsValues, base_url: null });
  });

  it("runs a configuration test independently from save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onTest = vi.fn();
    render(
      <AIProviderSettingsForm initialValues={mockAISettingsValues} onSave={onSave} onTest={onTest} />,
    );

    await user.click(screen.getByRole("button", { name: "Test config" }));
    expect(onTest).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("exposes operation feedback and disables unavailable settings", () => {
    render(
      <AIProviderSettingsForm
        initialValues={mockAISettingsValues}
        onSave={() => undefined}
        onTest={() => undefined}
        state="load-error"
        statusMessage="Check the service connection."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Settings unavailable");
    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
  });

  it("distinguishes API key detection from a verified provider connection", () => {
    render(
      <AIProviderSettingsForm
        apiKeyEnvVar="OPENAI_API_KEY"
        hasApiKey
        initialValues={{ ...mockAISettingsValues, provider: "openai", model: "gpt-5.6-terra" }}
        onSave={() => undefined}
        onTest={() => undefined}
        state="test-success"
        statusMessage="Connected to openai using gpt-5.6-terra. No research data was sent."
      />,
    );

    expect(screen.getByText("API key detected · OPENAI_API_KEY")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Connection and model verified");
    expect(screen.getByRole("status")).toHaveTextContent("No research data was sent.");
  });
});

