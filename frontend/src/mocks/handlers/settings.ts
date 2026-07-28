import { http, HttpResponse } from "msw";

import type { AISettings, AISettingsPayload, AISettingsTestResult } from "@/api/types";
import { detectedOpenAISettings } from "@/mocks/fixtures/settings";

export const SETTINGS_API_BASE_URL = "http://localhost:8000/api";

const providerKeyEnvVars: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  azure_openai: "AZURE_OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

let settingsStore: AISettings;

export function resetAISettingsStore() {
  settingsStore = structuredClone(detectedOpenAISettings);
}

resetAISettingsStore();

function keyMetadata(provider: string) {
  const apiKeyEnvVar = providerKeyEnvVars[provider] ?? null;
  return {
    api_key_env_var: apiKeyEnvVar,
    has_api_key: apiKeyEnvVar !== null,
  };
}

function testResult(settings: AISettings): AISettingsTestResult {
  const unavailable = settings.model.toLowerCase().includes("invalid")
    || settings.model.toLowerCase().includes("unavailable");
  const missingKey = settings.api_key_env_var !== null && !settings.has_api_key;

  if (unavailable || missingKey) {
    return {
      ok: false,
      message: `Could not connect to ${settings.provider} using ${settings.model}. Check the API key, model access, billing, and network connection.`,
      provider: settings.provider,
      model: settings.model,
      api_key_env_var: settings.api_key_env_var,
      has_api_key: settings.has_api_key,
    };
  }

  return {
    ok: true,
    message: settings.provider === "mock"
      ? "Mock configuration verified. No external provider was contacted."
      : `Connected to ${settings.provider} using ${settings.model}. No research data was sent.`,
    provider: settings.provider,
    model: settings.model,
    api_key_env_var: settings.api_key_env_var,
    has_api_key: settings.has_api_key,
  };
}

export const settingsHandlers = [
  http.get(`${SETTINGS_API_BASE_URL}/settings/ai`, () => HttpResponse.json(settingsStore)),
  http.put(`${SETTINGS_API_BASE_URL}/settings/ai`, async ({ request }) => {
    const payload = await request.json() as AISettingsPayload;
    settingsStore = {
      ...settingsStore,
      ...payload,
      base_url: payload.base_url?.trim() || null,
      ...keyMetadata(payload.provider),
      updated_at: "2026-07-28T18:00:00Z",
    };
    return HttpResponse.json(settingsStore);
  }),
  http.post(`${SETTINGS_API_BASE_URL}/settings/ai/test`, () =>
    HttpResponse.json(testResult(settingsStore))),
];
