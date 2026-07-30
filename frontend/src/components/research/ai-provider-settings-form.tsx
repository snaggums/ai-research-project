import * as React from "react";

import type { AISettingsPayload } from "@/api/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AIProviderSettingsFormState =
  | "ready"
  | "loading"
  | "load-error"
  | "saving"
  | "save-success"
  | "save-error"
  | "testing"
  | "test-success"
  | "test-failure";

export interface AIProviderSettingsFormProps extends React.HTMLAttributes<HTMLElement> {
  apiKeyEnvVar?: string | null;
  hasApiKey?: boolean;
  initialValues: AISettingsPayload;
  onSave: (values: AISettingsPayload) => void;
  onTest: () => void;
  state?: AIProviderSettingsFormState;
  statusMessage?: string;
}

const providers = ["openai", "gemini", "openrouter", "azure_openai", "ollama", "mock"];
const embeddingProviders = ["openai", "ollama", "mock"];

const stateFeedback: Partial<Record<AIProviderSettingsFormState, { title: string; tone: "info" | "success" | "error" }>> = {
  loading: { title: "Loading settings", tone: "info" },
  "load-error": { title: "Settings unavailable", tone: "error" },
  saving: { title: "Saving settings", tone: "info" },
  "save-success": { title: "Settings saved", tone: "success" },
  "save-error": { title: "Settings not saved", tone: "error" },
  testing: { title: "Testing connection and model", tone: "info" },
  "test-success": { title: "Connection and model verified", tone: "success" },
  "test-failure": { title: "Connection failed", tone: "error" },
};

export function AIProviderSettingsForm({
  apiKeyEnvVar,
  className,
  hasApiKey = false,
  initialValues,
  onSave,
  onTest,
  state = "ready",
  statusMessage,
  ...props
}: AIProviderSettingsFormProps) {
  const [values, setValues] = React.useState<AISettingsPayload>(initialValues);
  const disabled = state === "loading" || state === "load-error" || state === "saving";
  const testing = state === "testing";
  const feedback = stateFeedback[state];
  const apiKeyStatus = apiKeyEnvVar
    ? `${hasApiKey ? "API key detected" : "API key not detected"} · ${apiKeyEnvVar}`
    : `API key not required · ${values.provider}`;

  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const update = <Key extends keyof AISettingsPayload>(key: Key, value: AISettingsPayload[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <section
      className={cn(
        "rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6",
        className,
      )}
      {...props}
    >
      <div>
        <h2 className="text-xl font-semibold">AI provider settings</h2>
        <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">
          Store provider metadata here; keep real keys in the backend environment.
        </p>
      </div>

      <form
        className="mt-5 grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...values, base_url: values.base_url?.trim() || null });
        }}
      >
        <SelectField
          disabled={disabled}
          label="Provider"
          onValueChange={(value) => update("provider", value)}
          options={providers.map((provider) => ({ label: provider, value: provider }))}
          value={values.provider}
        />
        <InputField
          disabled={disabled}
          label="Model"
          onChange={(event) => update("model", event.currentTarget.value)}
          value={values.model}
        />
        <InputField
          disabled={disabled}
          label="Base URL"
          onChange={(event) => update("base_url", event.currentTarget.value)}
          optional
          placeholder="Optional for OpenRouter, Azure, Ollama, or gateways"
          value={values.base_url ?? ""}
        />
        <SelectField
          disabled={disabled}
          label="Embedding provider"
          onValueChange={(value) => update("embedding_provider", value)}
          options={embeddingProviders.map((provider) => ({ label: provider, value: provider }))}
          value={values.embedding_provider}
        />
        <InputField
          disabled={disabled}
          label="Embedding model"
          onChange={(event) => update("embedding_model", event.currentTarget.value)}
          value={values.embedding_model}
        />
        <div className="flex min-h-12 items-center rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] px-3 text-sm text-[var(--air-color-text-secondary)]">
          {apiKeyStatus}
        </div>

        {feedback ? (
          <Alert
            className="md:col-span-2"
            message={statusMessage}
            size={statusMessage ? "large" : "small"}
            title={feedback.title}
            tone={feedback.tone}
          />
        ) : null}

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button disabled={disabled || !values.provider || !values.model} size="small" type="submit">
            {state === "saving" ? "Saving…" : "Save settings"}
          </Button>
          <Button disabled={disabled || testing} onClick={onTest} size="small" type="button" variant="gray-subtle">
            {testing ? "Testing…" : "Test config"}
          </Button>
        </div>
      </form>
    </section>
  );
}

