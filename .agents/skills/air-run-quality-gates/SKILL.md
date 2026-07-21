---
name: air-run-quality-gates
description: Run and summarize the deterministic Sky-AIR repository quality gates. Use only when explicitly invoked to run the full validation sequence or diagnose its results, including backend tests, isolated migrations, frontend tests, accessibility checks, lint, production and Storybook builds, and Playwright workflows.
---

# Run AIR quality gates

Inspect `scripts/quality-gates.ps1` and reuse it rather than copying its commands. Read `README.md` for prerequisites and isolated service behavior.

1. Safely verify local prerequisites, services, and isolated test databases.
2. Run the supported quality-gate sequence.
3. Capture pass/fail status for backend tests, migration replay when applicable, frontend tests, accessibility tests, lint, production build, Storybook build, and Playwright workflows.
4. Distinguish application failures from infrastructure or service failures; report the first actionable error and relevant artifact paths.

Do not weaken tests or commit, push, merge, deploy, or alter production data.
