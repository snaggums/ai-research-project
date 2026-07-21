---
name: air-audit-ui
description: Audit Sky-AIR Figma, Storybook, and React experiences for approved-design parity and WCAG 2.2 AA accessibility. Use for component parity reviews, Storybook-versus-Figma checks, final accessibility reviews, responsive regressions, or keyboard and focus issues. Do not implement fixes unless explicitly requested.
---

# Audit AIR UI

Treat approved Figma as the visual source of truth. Inspect the relevant Figma contract, Storybook stories, React implementation, existing tests, and AIR token/focus conventions.

1. Compare layout, spacing, typography, colors, icons, variants, content constraints, and responsive behavior.
2. Check behavior separately: interactions, focus placement/token use, keyboard navigation, logical tab order, and state transitions.
3. Check accessible names, labels, descriptions, errors, contrast, non-color state cues, and loading, empty, no-results, error, and disabled states.
4. Run applicable deterministic accessibility checks.
5. Report evidence-backed findings ordered by severity, with affected surface, expected/observed behavior, reproduction, and a concise recommendation.

Do not make changes unless explicitly asked.
