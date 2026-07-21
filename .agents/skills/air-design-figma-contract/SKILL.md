---
name: air-design-figma-contract
description: Create or update Sky-AIR Figma components and page templates while preserving the approved AIR design system and producing implementation-ready React contracts. Use for AIR component, responsive-template, Transcript Coding workspace, or Figma/design-system reconciliation requests; use alongside the installed Figma skills.
---

# Create an AIR Figma contract

Use alongside the relevant installed Figma skills; do not duplicate their tool procedures. First inspect approved AIR variables, tokens, components, templates, and the applicable files in `project-context/v2-architecture-pack/`. Reuse existing components before creating anything new.

1. Preserve AIR colors, typography, spacing, radii, light-only behavior, approved focus treatment, and responsive conventions.
2. Use nested AIR instances and the swappable Lucide icon component with meaningful instance properties; avoid detached vectors and parallel controls.
3. Define anatomy, content rules, properties, variants, responsive states, loading/empty/error/disabled states, and accessibility behavior. Keep variant ordering consistent.
4. Use two-column full-width form rows and single-column full-width textareas where applicable; preserve logical reading and keyboard order when stacked.
5. Update source components so templates inherit changes. Verify layout, contrast, keyboard focus, labels, and responsive behavior.
6. Document the React-facing contract: typed data/callback inputs, semantic behavior, and which Figma states are real data states rather than a React `state` prop.

Pause only when the current Figma workflow requires approval. Keep detailed domain, route, and component requirements in canonical sources rather than copying them into this skill.
