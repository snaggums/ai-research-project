# AIR Record Synthesis MVP - 1.5-Week Delivery Roadmap

Status: Approved execution plan
Planning date: July 15, 2026
Delivery window: July 16-27, 2026
Capacity assumption: Eight focused working days with same-day approval feedback

## 1. Target outcome

At the end of the delivery window, a researcher can assign each Session to
Record 1, Record 2, or Record 3; upload one Primary Transcript; open that Record;
automatically synthesize all eligible related Session Reports; review
Requirements, Decisions, and Action Items; and trace every item to source
evidence and transcript context.

The target is a controlled local or access-restricted working prototype using
synthetic or non-sensitive research data.

## 2. Daily plan

### Day 1 - Thursday, July 16: Architecture lock and Figma setup

Deliverables:

- approve the Record Synthesis MVP scope and hard deferrals;
- update the canonical Domain Map and Route Map for Record-centered synthesis;
- audit existing Figma Record placeholders and reusable components;
- add the Records and Record Synthesis page structure in Figma;
- confirm the fixed Record 1, Record 2, and Record 3 catalog plus at least three
  Sessions, one Primary Transcript per Session, reviewed Session Reports, and
  evidence excerpts.

Approval checkpoint:

- fixed Record catalog and route placement;
- automatic inclusion of all eligible related Sessions;
- one Record and one Primary Transcript per Session in the MVP interface;
- Requirements, Decisions, and Action Items as the only MVP output types.

Exit criteria:

- no unresolved domain decision blocks component design.

### Day 2 - Friday, July 17: Figma Research Objects

Deliverables:

- Record List Item;
- fixed Record Field for Session Form;
- Record Summary;
- Record Synthesis Scope Summary;
- Record Synthesis Item variants;
- Record Synthesis Results composition;
- Default, Compact, loading, disabled, focus, and error behavior where relevant.

Approval checkpoint:

- approve each Research Object group before page composition.

Exit criteria:

- component contracts use existing AIR variables, typography, focus treatment,
  and Lucide icons with no new tokens.

### Day 3 - Monday, July 20: Figma page templates

Deliverables:

- Records Collection: populated, empty, loading, and error;
- Record Detail: ready and insufficient-data;
- Record Synthesis: processing, results, and failed;
- evidence-detail route using the existing transcript context pattern;
- Desktop and Mobile templates; Tablet responsive behavior documented.

Approval checkpoint:

- final Figma review for content, responsive behavior, navigation, state
  coverage, and accessibility intent.

Exit criteria:

- Figma is approved as the visual source of truth for implementation.

### Day 4 - Tuesday, July 21: Storybook and React components

Deliverables:

- Record and Record Synthesis TypeScript contracts;
- deterministic fixtures;
- Research Object components matching approved Figma;
- Storybook stories for component variants and page states;
- fixed Record Field integrated into Session Form;
- component interaction and axe accessibility tests.

Review checkpoint:

- Storybook review of component parity and keyboard focus.

Exit criteria:

- Storybook production build succeeds with accessibility violations treated as
  errors.

### Day 5 - Wednesday, July 22: Frontend routes and API/MSW contracts

Deliverables:

- fixed Records collection, detail, and synthesis routes;
- navigation links and breadcrumbs;
- removal of Common Component fields, filters, and relationship summaries from
  the MVP interface without deleting existing data;
- real frontend HTTP clients and query keys;
- deterministic MSW handlers for Storybook and tests;
- automatic synthesis scope summary;
- loading, empty, insufficient-data, processing, failed, and retry behavior;
- responsive and keyboard route tests.

Review checkpoint:

- local Storybook page-composition review.

Exit criteria:

- the complete workflow works with MSW before backend integration.

### Day 6 - Thursday, July 23: Backend persistence and migration

Implementation status: Complete and ready for checkpoint review on July 16,
2026. The work was completed ahead of the planned delivery date.

Deliverables:

- additive database migration for three seeded Records, Session-Record relationships,
  Record Synthesis Runs, Synthesis Items, and source links;
- preservation/backfill of provisional `session_relationships` Record data;
- read-only Record collection/detail and Session Record-assignment endpoints;
- eligibility and latest-run endpoints;
- service-layer ownership and source validation;
- migration replay and idempotency tests.

Exit criteria:

- existing Sprint 8 data, IDs, and relationships remain intact;
- the migration passes twice without duplicates.

Verification completed:

- migration `0007_record_synthesis` creates and seeds the fixed Record catalog;
- recognized provisional Record references are copied without deleting the
  original `session_relationships` rows;
- Session assignment, Record collection/detail, eligibility, latest synthesis,
  item review, and evidence-context contracts are covered by backend tests;
- migration seeding and backfill are replay-safe;
- the complete backend suite, frontend suite, frontend lint, and production
  build pass.

### Day 7 - Friday, July 24: Generation and end-to-end integration

Implementation status: Complete and ready for acceptance review on July 16,
2026. The work was completed ahead of the planned delivery date.

Deliverables:

- deterministic mock Record synthesis;
- live provider integration through the existing backend abstraction;
- automatic inclusion of eligible related Sessions;
- persisted Requirements, Decisions, and Action Items;
- evidence and transcript-context links;
- review/approve item lifecycle;
- client request idempotency;
- frontend connected to the real backend.

Acceptance checkpoint:

- manually run the MVP workflow using at least two related Sessions.

Exit criteria:

- a researcher can complete the core Record synthesis flow without database or
  developer intervention.

Verification completed:

- deterministic mock generation consolidates eligible evidence-linked
  Requirements, Decisions, and Action Items;
- the configured live-provider path uses the existing server-side provider and
  API-key abstraction and validates returned source Report item IDs;
- repeated requests with the same client request key return the same persisted
  run without duplicate sources or items;
- regeneration snapshots newly approved Session Report revisions while prior
  completed runs retain their original source references;
- synthesis items can progress from AI Generated to Researcher Reviewed and
  Approved through the real API;
- evidence links enforce Record, Project, Session, Document, and transcript
  context ownership;
- deleting a source Project safely removes affected immutable synthesis runs
  instead of retaining broken provenance;
- the full real-browser workflow passes against isolated PostgreSQL, backend,
  and frontend services.

Acceptance review workflow:

1. Assign Record 1 to at least two Sessions.
2. Upload one transcript to each Session.
3. Generate and review or approve each Session Report.
4. Open **Records > Record 1 > Synthesis**.
5. Select **Generate synthesis**.
6. Verify Requirements, Decisions, and Action Items appear with source counts.
7. Mark an AI Generated item as Researcher Reviewed, then approve it.
8. Open evidence and verify the cited transcript passage and surrounding context.
9. Regenerate after approving a revised Session Report and verify the latest
   synthesis reflects the revised source scope.

### Day 8 - Monday, July 27: Final QA, hardening, and handoff

Deliverables:

- Figma parity review at Desktop and Mobile;
- frontend lint, component tests, coverage, and production build;
- Storybook production build;
- backend API, ownership, migration, and idempotency tests;
- Playwright Record synthesis golden path;
- keyboard, focus, loading, error, and responsive checks;
- API-key/logging safety audit;
- README setup and manual acceptance instructions;
- clean Git commit and review branch push.

Final checkpoint:

- user approval of the working MVP before any post-MVP scope begins.

## 3. Required test data

Use synthetic data only:

- Record 1 related to two eligible Sessions;
- Record 2 related to one eligible and one ineligible Session;
- one Session related to two Records to verify item/source separation;
- one revised Session Report to verify source snapshots;
- evidence from distinct speakers and transcript locations; and
- an unrelated Session that must never appear in the Record synthesis.

## 4. Definition of done

The MVP is done when:

- Record 1, Record 2, and Record 3 are always available and read-only;
- each Session can select one Record through Session create/edit;
- each Session exposes one Primary Transcript in the MVP interface;
- a second transcript cannot be added until the existing transcript is deleted;
- Record detail automatically lists related Sessions;
- eligibility is transparent and generation requires two eligible Sessions;
- generation requires no second manual Session grouping;
- Requirements, Decisions, and Action Items are persisted and grouped;
- every synthesized item links to source Session Report items and transcript
  evidence;
- review and approval status persists;
- repeated requests do not create duplicate completed results;
- the prior source snapshot survives regeneration;
- no data crosses an unrelated Record unintentionally;
- no raw provider key reaches the browser, database, logs, or Git;
- automated quality gates pass; and
- the user approves the local acceptance workflow.

## 5. Scope protection rules

During this delivery window:

- new ideas are recorded in a post-MVP backlog unless required for the core
  workflow;
- visual refinements that do not affect usability wait until functional
  integration is stable;
- Common Components, custom Records, and arbitrary synthesis grouping remain deferred;
- authentication is not added; the prototype uses controlled access and
  synthetic/non-sensitive data; and
- a failed approval checkpoint moves later tasks rather than silently reducing
  evidence traceability, accessibility, migration safety, or API-key safety.

## 6. Schedule risks and responses

| Risk | Response |
| --- | --- |
| Figma decisions take more than one day | Reduce visual variants, not source traceability or core states. |
| Live AI output is inconsistent | Keep deterministic mock generation as the acceptance baseline. |
| Record migration reveals ambiguous placeholder IDs | Preserve original values and create explicit migration-review output. |
| Synthesis duplicate resolution is complex | Keep generated items separate when confidence is insufficient; defer advanced merging. |
| Hosted environment is not selected | Deliver a reproducible local Docker workflow and defer hosting. |
| Public access is requested | Require authentication/access-control planning or restrict the environment to synthetic data. |

## 7. Post-MVP backlog

Immediately after approval, evaluate:

1. full synthesis-run history and comparison;
2. advanced duplicate merging;
3. custom Records, multiple Record relationships, and Common Components;
4. Theme workspace and Evidence Explorer;
5. Insights and Recommendations;
6. Product Knowledge reporting;
7. authentication, workspaces, and role-based authorization; and
8. managed production secrets and deployment hardening.
