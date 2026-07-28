import type { AISettings, AISettingsPayload, AISettingsTestResult } from "@/api/types";

export const mockAISettingsValues: AISettingsPayload = {
  provider: "mock",
  model: "mock-chat",
  base_url: "",
  embedding_provider: "mock",
  embedding_model: "mock-hash-64",
};

export const liveAISettingsValues: AISettingsPayload = {
  ...mockAISettingsValues,
  provider: "openai",
  model: "gpt-5.6-terra",
};

export const detectedOpenAISettings: AISettings = {
  id: "00000000-0000-0000-0000-000000000001",
  ...liveAISettingsValues,
  base_url: null,
  api_key_env_var: "OPENAI_API_KEY",
  has_api_key: true,
  created_at: "2026-07-10T12:00:00Z",
  updated_at: "2026-07-10T12:00:00Z",
};

export const verifiedAISettingsResult: AISettingsTestResult = {
  ok: true,
  message: "Connected to openai using gpt-5.6-terra. No research data was sent.",
  provider: "openai",
  model: "gpt-5.6-terra",
  api_key_env_var: "OPENAI_API_KEY",
  has_api_key: true,
};

export const failedAISettingsResult: AISettingsTestResult = {
  ok: false,
  message:
    "Could not connect to openai using gpt-5.6-terra. Check the API key, model access, billing, and network connection.",
  provider: "openai",
  model: "gpt-5.6-terra",
  api_key_env_var: "OPENAI_API_KEY",
  has_api_key: true,
};
