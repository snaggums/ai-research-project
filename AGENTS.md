# Sky-AIR repository guidance

AIR is an AI-assisted qualitative UX research workspace. Use the current terms: Project, Session, Participant, Transcript, Highlight, Code, Record, Theme, Session Report, and Record Synthesis. Use sentence case for interface labels.

Treat approved Figma as the visual source of truth. Implement approved work in this order: Figma contract → Storybook → React → frontend API/MSW → backend → tests. Use existing AIR tokens and Lucide icons; preserve light-only behavior unless the approved scope changes. Meet WCAG 2.2 AA and the approved AIR focus-ring behavior.

For new Figma work, Codex authors Desktop source variants only unless the user explicitly expands the scope. The user may add Tablet or Mobile variants manually; treat those as implementation inputs only after they are reviewed and approved. Preserve previously approved responsive work.

Use React Query for server state, React Router for route state, React Hook Form for form state, and local React state for transient interactions. Use Zustand only for genuinely shared client-only state. Preserve user data and migration invariants: migrations and backfills must be idempotent, and existing IDs and relationships must remain intact. Never commit API keys or real `.env` files.

Read [the architecture pack](project-context/v2-architecture-pack/README.md), especially the [domain map](project-context/v2-architecture-pack/01_DOMAIN_MAP.md), [route map](project-context/v2-architecture-pack/02_ROUTE_MAP.md), and [research-object inventory](project-context/v2-architecture-pack/03_SPRINT_8_RESEARCH_OBJECT_INVENTORY.md), before making detailed domain or route decisions.

Validate focused work first. Repository-wide gates run from the root with `./scripts/quality-gates.ps1`; see [README.md](README.md) for prerequisites and individual backend, migration replay, frontend, Storybook, and Playwright commands.
