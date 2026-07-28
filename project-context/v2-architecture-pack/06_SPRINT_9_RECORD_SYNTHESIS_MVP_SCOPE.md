# Sprint 9 Record Synthesis MVP Scope

Status: Approved for implementation
Date: July 15, 2026
Delivery target: Eight working days, July 16-27, 2026
Depends on: Approved Sprint 8 Project, Participant, Session, Transcript,
Session Report, evidence, and citation contracts

## 1. Objective

The MVP connects research Sessions to product Records and automatically
synthesizes Requirements, Decisions, and Action Items across every eligible
Session related to a selected Record.

The researcher assigns each Session to one of three fixed Records once. The
researcher does not create a second manual grouping for synthesis.

```text
Medicaid Fraud Documenter
  <- Checkout interview
  <- Checkout usability test
  <- Mobile design critique

Generate Record synthesis
  -> Requirements
  -> Decisions
  -> Action Items
  -> Evidence and source Session links
```

## 2. Terminology

A Record is not a Session type or a free-form tag. It is a workspace-level
Product Knowledge object representing functionality being designed. For the
MVP, each Session is assigned to one fixed Record.

The interface uses a single-select field labeled **Record** with `Medicare Fraud Documenter`,
`Medicaid Fraud Documenter`, and `Medicare Fraud Finder` as its only options.

## 3. MVP domain contracts

### 3.1 Record

Minimum fields:

| Field | Requirement |
| --- | --- |
| `id` | Stable fixed identifier: `record-1`, `record-2`, or `record-3`. |
| `name` | Fixed display value: `Medicare Fraud Documenter`, `Medicaid Fraud Documenter`, or `Medicare Fraud Finder`. |

The three Records are seeded by the migration and are read-only in the MVP.
They are workspace-level and may be related to Sessions from more than one
Project. The MVP runs inside one controlled workspace and does not introduce
Record creation/editing, multi-tenant identity, or permissions.

### 3.2 Session-Record relationship

The MVP relationship contains:

- `session_id`;
- `record_id`;
- creation timestamp; and
- optional relationship provenance.

The existing provisional `session_relationships` Record references must be
normalized to the three fixed IDs without deleting or duplicating Session data.
The underlying schema may remain extensible for multiple Records per Session,
but the MVP API and interface accept one selected Record.

Common Component fields, filters, relationship summaries, and synthesis scope
are removed from the MVP interface. Existing provisional Common Component data
is preserved in storage and is not deleted by this scope reduction.

### 3.3 Session Transcript

The MVP exposes one Primary Transcript per Session:

- the transcript uploader is available only when the Session has no transcript;
- a researcher deletes the existing transcript before uploading a replacement;
- Session search, Themes, Report generation, and evidence use that transcript;
- additional transcript management is absent from the MVP interface; and
- the database may retain its existing multi-Document capability for future
  focus-group, split-recording, corrected-version, or translation workflows.

### 3.4 Record Synthesis Run

A `RecordSynthesisRun` records one generation request and the exact source
snapshot used by that request:

- Record ID;
- status: queued, processing, complete, or failed;
- eligible Session IDs;
- exact Session Report revision IDs;
- provider, model, and prompt version;
- created and completed timestamps; and
- recoverable error detail.

Generation automatically includes all eligible Sessions related to the Record.
There is no Session picker in the MVP. The results screen still lists the
included and excluded Sessions so the scope is transparent.

### 3.5 Record Synthesis Item

The MVP produces these item types only:

- Requirement;
- Decision; and
- Action Item.

Each item contains:

- title and concise summary;
- AI Generated, Researcher Reviewed, Approved, or Superseded status;
- source Session Report item IDs;
- supporting evidence and transcript context links;
- provider/model/prompt provenance; and
- researcher edit provenance.

The generator may consolidate equivalent source items, but every consolidated
item must retain all of its source links.

## 4. Source eligibility

A related Session is eligible when it has a latest Researcher Reviewed or
Approved Session Report with evidence-linked Requirements, Decisions, or Action
Items.

The MVP:

- requires at least two eligible related Sessions before generation;
- automatically includes all eligible related Sessions;
- displays ineligible Sessions and the reason they are excluded;
- never includes an unrelated Session merely because it is in the same Project;
- snapshots exact Report revisions for reproducibility; and
- never silently incorporates a revised Report into a completed run.

AI Generated Session Reports are excluded from the MVP synthesis source. An
explicit opt-in workflow may be added after the prototype.

## 5. Information architecture

Add a workspace-level **Records** destination and links from related Sessions.

Proposed routes:

| Route | Purpose |
| --- | --- |
| `/records` | Fixed Records collection. |
| `/records/:recordId` | Record overview, related Sessions, latest synthesis, and source scope. |
| `/records/:recordId/synthesis` | Empty, processing, results, and failed synthesis states. |

The Record detail page contains:

1. Record summary;
2. Related Sessions;
3. Requirements;
4. Decisions;
5. Action Items; and
6. Generate or regenerate synthesis action.

The MVP does not add a separate Project Synthesis destination. Synthesis is
launched from the Record it updates.

## 6. Figma scope

### Research Objects

1. **Record List Item** - name, related Session count, last
   synthesized timestamp, and Open Record action.
2. **Record Field** - reusable single-select composition for Session create/edit
   forms with Medicare Fraud Documenter, Medicaid Fraud Documenter, and Medicare Fraud Finder.
3. **Record Summary** - stable Record metadata and synthesis readiness.
4. **Record Synthesis Scope Summary** - included and excluded Sessions with
   eligibility reasons.
5. **Record Synthesis Item** - Requirement, Decision, and Action Item variants
   with status, sources, evidence preview, and review action.
6. **Record Synthesis Results** - grouped Requirements, Decisions, and Action
   Items with generation provenance.

### Page templates

1. Records Collection - populated, empty, loading, and error;
2. Record Detail - ready and insufficient-data;
3. Record Synthesis - processing, results, and failed;
4. Record Synthesis evidence detail - reuse the approved transcript context
   pattern.

Desktop and Mobile are designed explicitly. Tablet follows the approved shared
shell and responsive rules unless a composition requires a dedicated variant.
No new design tokens are allowed.

## 7. Frontend and Storybook scope

- typed Record and Record Synthesis domain contracts;
- deterministic fixtures for eligible, insufficient, processing, complete, and
  failed states;
- MSW handlers for every new endpoint;
- Records collection, Record detail, and Record synthesis page stories;
- fixed Record field integrated into Session Form;
- native keyboard behavior, focus visibility, loading announcements, and error
  recovery;
- React routes use real HTTP clients outside Storybook/tests; and
- page and component tests cover the primary workflow and accessibility.

## 8. Backend scope

Proposed endpoints:

```text
GET    /api/records
GET    /api/records/{recordId}

GET    /api/records/{recordId}/sessions
PUT    /api/projects/{projectId}/sessions/{sessionId}/record

GET    /api/records/{recordId}/synthesis/eligibility
GET    /api/records/{recordId}/synthesis/latest
POST   /api/records/{recordId}/synthesis
PATCH  /api/records/{recordId}/synthesis/items/{itemId}
```

The backend must provide:

- three seeded Records plus additive Session-Record, Synthesis Run, Synthesis
  Item, and source-link persistence;
- migration of provisional Record references;
- deterministic mock generation and the existing live-provider abstraction;
- idempotency for a client request key;
- evidence and transcript-context ownership validation;
- no raw API-key persistence; and
- source revision and generation provenance.

## 9. Hard MVP boundaries

Deferred until after the prototype:

- Common Components;
- custom Record creation, editing, or deletion;
- multiple Records per Session in the interface;
- multiple-transcript management in the interface;
- manual synthesis groups or Session selection;
- cross-Record and arbitrary Project synthesis;
- full synthesis-run history UI;
- contradictory-evidence classification;
- advanced duplicate resolution;
- the full Theme workspace;
- Evidence Explorer;
- Insights and Recommendations;
- Product Knowledge reporting;
- Project Chat expansion;
- authentication and multi-user authorization;
- global Project search;
- CSV Participant import; and
- public deployment with real research data.

Completed Synthesis Runs remain persisted for provenance, but the MVP interface
shows only the latest run.

## 10. MVP acceptance workflow

1. Create or edit at least two Sessions and select Medicaid Fraud Documenter for both.
2. Upload one Primary Transcript to each Session and generate reviewed Session
   Reports.
3. Confirm a second transcript cannot be added while the Primary Transcript is
   present.
4. Open Medicaid Fraud Documenter and verify both Sessions appear automatically.
5. Generate Record synthesis without manually selecting Sessions.
6. Verify grouped Requirements, Decisions, and Action Items.
7. Verify every item identifies its source Sessions and source Report items.
8. Open supporting transcript context.
9. Mark an item Researcher Reviewed or Approved.
10. Regenerate after a Report revision and verify the completed prior run keeps
    its original source snapshot.

## 11. API-key and deployment boundary

For the local or access-restricted MVP:

- real provider keys remain server-side in `backend/.env` or are injected by
  the hosting platform;
- the UI stores provider/model metadata only;
- keys are never returned to React, written to the database, logged, or
  committed; and
- mock generation remains available for safe demonstrations.

A managed secret service, authentication, and authorization are production
hardening tasks, not prerequisites for the controlled prototype.
