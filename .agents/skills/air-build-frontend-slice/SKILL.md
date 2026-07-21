---
name: air-build-frontend-slice
description: Implement an approved Sky-AIR Figma or component contract in React, Storybook, routing, frontend API adapters, React Query, and MSW. Use for approved AIR components, pages, route states, frontend API/MSW contracts, or Storybook-to-Figma parity work.
---

# Build an AIR frontend slice

Confirm the approved Figma/component contract and read the relevant architecture-pack and existing frontend patterns before coding. Do not invent a backend response shape when a backend contract exists.

1. Reuse design-system primitives, AIR tokens, and Lucide icons. Add or update TypeScript domain types.
2. Implement components as semantic data-and-callback contracts; keep fetching, mutations, routing, and orchestration at page/feature level.
3. Add meaningful Storybook variants, constrained/long content, and route states. Create deterministic MSW fixtures and handlers for server states.
4. Add adapters, query keys, and React Query hooks for server data; compose the route and page.
5. Cover loading, empty, no-results, error, disabled, populated, responsive, interaction, keyboard, focus, accessibility, and regression behavior. Run focused tests before broader gates.

Use React Query for remote/server state, React Router for URL and navigation state, React Hook Form for form state, local component state for transient interactions, and Zustand only when shared client-only state is necessary.
