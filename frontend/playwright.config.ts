import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";


const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(currentDirectory, "../backend");
const backendPython = process.platform === "win32" ? ".\\.venv\\Scripts\\python.exe" : "./.venv/bin/python";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `${backendPython} -m uvicorn app.main:app --host 127.0.0.1 --port 8001`,
      cwd: backendDirectory,
      url: "http://127.0.0.1:8001/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: "postgresql+psycopg://qual_ai_e2e:qual_ai_e2e@127.0.0.1:5434/qual_ai_e2e",
        BACKEND_CORS_ORIGINS: "http://127.0.0.1:5174",
        UPLOAD_DIR: "./storage/uploads/e2e",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "",
        GEMINI_API_KEY: "",
        OPENROUTER_API_KEY: "",
        AZURE_OPENAI_API_KEY: "",
      },
    },
    {
      command: "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174",
      cwd: currentDirectory,
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: "http://127.0.0.1:8001/api",
      },
    },
  ],
});
