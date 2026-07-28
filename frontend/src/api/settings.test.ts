import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { getAISettings, testAISettings, updateAISettings } from "@/api/settings";
import { liveAISettingsValues } from "@/mocks/fixtures/settings";
import { API_BASE_URL, server } from "@/test/server";

describe("AI settings API", () => {
  it("keeps API key detection separate from provider verification", async () => {
    const settings = await getAISettings();

    expect(settings.api_key_env_var).toBe("OPENAI_API_KEY");
    expect(settings.has_api_key).toBe(true);

    const result = await testAISettings();

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Connected to openai using gpt-5.6-terra. No research data was sent.");
  });

  it("tests the saved provider and model", async () => {
    await updateAISettings({
      ...liveAISettingsValues,
      model: "unavailable-model",
    });

    const result = await testAISettings();

    expect(result.ok).toBe(false);
    expect(result.model).toBe("unavailable-model");
    expect(result.message).toContain("Could not connect");
  });

  it("surfaces an actionable backend error message", async () => {
    server.use(
      http.post(`${API_BASE_URL}/settings/ai/test`, () =>
        HttpResponse.json({ detail: "Provider request timed out." }, { status: 504 })),
    );

    await expect(testAISettings()).rejects.toThrow("Provider request timed out.");
  });
});
