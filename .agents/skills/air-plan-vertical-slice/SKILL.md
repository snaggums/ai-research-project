---
name: air-plan-vertical-slice
description: Plan a new Sky-AIR vertical slice or cross-layer product change before implementation. Use for requests to plan a feature, assess impact across Figma, React, APIs, and the database, or create an implementation plan for an AIR research object. Do not use to implement the work unless explicitly asked.
---

# Plan AIR vertical slice

Read the relevant canonical sources before planning: `README.md`, `FEATURES.md`, `project-context/v2-architecture-pack/README.md`, and the applicable domain map, route map, research-object, page-template, and React/Storybook contract documents. Inspect the current code where the request affects an existing behavior.

Produce a concise vertical-slice contract:

1. State the user outcome, approved terminology, current behavior, scope, and deferrals.
2. Identify domain-model, ownership, provenance, route, API, persistence, and idempotent-migration effects.
3. Identify Figma research objects and page templates; specify component contracts, UI states, responsive behavior, and accessibility needs.
4. Specify frontend types, components, Storybook stories, API adapters, query keys/hooks, and deterministic MSW fixtures.
5. Specify backend models, schemas, services, routes, migrations/backfills, and contract compatibility.
6. Specify focused tests, accessibility checks, acceptance criteria, risks, dependencies, unresolved decisions, and approval checkpoints.
7. Finish with an ordered implementation plan in the repository sequence: Figma contract → Storybook → React → frontend API/MSW → backend → tests.

Do not invent decisions that canonical sources reserve for approval. Clearly label assumptions and stop for an approval checkpoint before crossing an unapproved boundary. Do not implement unless the user explicitly requests it.
