# Transcript Coding Vertical Slice Contract

Status: Approved planning contract; Figma workspace approval required before Storybook or React implementation
Date: July 20, 2026
Depends on: Primary Transcript, Session, Record, evidence, and provenance contracts
Implementation boundary: Domain model, API contract, state model, and acceptance criteria only

## 1. Objective

AIR adds an evidence-first Transcript Coding workspace where a researcher can:

- select transcript text and save a Highlight without assigning a Code;
- apply an existing Record Code or create a new Record Code from selected text;
- generate AI Code Suggestions with explicit supporting transcript evidence;
- accept, edit, or reject each suggestion;
- review accepted and uncoded Highlights without scrolling the full Transcript;
- filter both the Transcript and Highlight List by accepted Codes and review
  status; and
- preserve source coordinates and provenance so Record-level aggregation and
  future video clips do not require a new evidence model.

This slice does not replace Themes, Session Reports, or Record Synthesis. Codes
organize source evidence; Themes and Reports interpret it; Record Synthesis
consolidates reviewed outcomes.

## 2. Approved terminology

| Term | Meaning |
| --- | --- |
| **Transcript passage** | Source text with stable Document coordinates and optional speaker/time metadata. |
| **Highlight** | A researcher- or AI-selected Transcript passage saved for review. A Highlight may have zero or more Codes. |
| **Code** | A reusable Record-owned label and definition applied to Highlights. |
| **Code assignment** | The relationship between one Highlight and one Code. |
| **Code Suggestion** | An AI proposal for one Code, supported by one or more Transcript passages and awaiting researcher review. |
| **Supporting transcript evidence** | The complete Transcript passages supporting a suggestion or accepted artifact. |
| **Uncoded Highlight** | A saved Highlight with no active Code assignments. |
| **Accepted Highlight** | A Highlight with at least one active Code assignment accepted or created by a researcher. |

The interface uses **Highlight**, not Tag, for selected source material. The
interface uses **Code**, not Theme, for the reusable classification applied to
that material.

## 3. Ownership and domain model

```text
Project
  -> Session
      -> Primary Transcript Document
          -> Highlight
              -> zero or more Code Assignments
          -> Code Suggestion
              -> one or more Supporting Transcript Evidence passages

Product Knowledge
  -> Record
      -> Code Dictionary
          -> Codes
              -> Code Assignments
                  -> Highlights from related Sessions
```

### 3.1 Ownership rules

- A Highlight belongs to one Project, Session, and Transcript Document.
- A Highlight remains source-owned by its Session even when displayed in a
  Record-level list.
- A Code belongs to exactly one Record.
- A Code Assignment may connect a Highlight only to a Code owned by the Record
  currently assigned to the Highlight's Session.
- An uncoded Highlight may be created when the Session has no Record.
- Creating or applying a Code requires the Session to have a Record.
- The server derives `project_id`, `document_id`, and `record_id` from the
  nested resources. Clients must not be able to create cross-owner links by
  submitting different IDs.
- If a Session has coded Highlights, changing its Record is rejected until the
  researcher removes or explicitly migrates those Code Assignments. Silent
  reassignment would corrupt Record-level meaning.
- Replacing or deleting a primary Transcript must warn about its dependent
  Highlights and Suggestions. Destructive behavior requires an explicit
  confirmed workflow; it must never silently orphan evidence.

### 3.2 Transcript Anchor value object

Every Highlight and suggestion evidence link stores a source anchor:

| Field | Type | Requirement |
| --- | --- | --- |
| `document_id` | UUID | Required owning Transcript Document. |
| `chunk_id` | UUID or null | Existing Chunk when the passage intersects one indexed chunk. |
| `block_id` | text or null | Stable Transcript block identifier returned by the current Transcript API. |
| `start_char` | integer | Required inclusive offset in normalized Document content. |
| `end_char` | integer | Required exclusive offset; must be greater than `start_char`. |
| `excerpt_snapshot` | text | Exact selected text retained for audit and resilience. |
| `speaker` | text or null | Speaker label when available. |
| `location` | text or null | Human-readable timestamp, page, paragraph, or block location. |
| `start_ms` | integer or null | Future media start time. |
| `end_ms` | integer or null | Future media end time. |
| `content_checksum` | text | Checksum of the normalized Transcript content used to validate offsets. |

`start_ms` and `end_ms` are nullable in the transcript-only slice. They reserve
the same Highlight contract for future audio/video clips without showing a
video control in the current UI.

### 3.3 Transcript Highlight

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable Highlight identifier. |
| `project_id` | UUID | Required Project owner, derived from Session. |
| `session_id` | UUID | Required Session owner. |
| `document_id` | UUID | Required Primary Transcript owner. |
| `anchor` | Transcript Anchor | Required source coordinates and snapshot. |
| `origin` | enum | `researcher` or `ai-suggestion`. Preserved for provenance but not exposed as an MVP filter. |
| `created_at` | timestamp | Audit field. |
| `updated_at` | timestamp | Audit field. |
| `deleted_at` | timestamp or null | Soft-delete audit field. |

`coded` and `uncoded` are derived states. They are not independently persisted:
a non-deleted Highlight with one or more active assignments is coded; a
non-deleted Highlight with none is uncoded.

### 3.4 Record Code

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable identifier. |
| `record_id` | fixed Record ID | Required Record owner. |
| `name` | text | Required, trimmed, case-insensitively unique within the Record. |
| `description` | text or null | Optional researcher-facing definition. |
| `status` | enum | `active` or `archived`; the current UI lists active Codes only. |
| `created_at` | timestamp | Audit field. |
| `updated_at` | timestamp | Audit field. |

The same Code may be applied to Highlights from many Sessions when every
Session is related to the Code's Record. Codes are not duplicated per Session.

### 3.5 Highlight Code Assignment

| Field | Type | Requirement |
| --- | --- | --- |
| `highlight_id` | UUID | Composite unique key member. |
| `code_id` | UUID | Composite unique key member. |
| `assignment_origin` | enum | `researcher`, `accepted-suggestion`, or `edited-suggestion`. |
| `suggestion_id` | UUID or null | Source suggestion when applicable. |
| `created_at` | timestamp | Audit field. |
| `removed_at` | timestamp or null | Removal provenance; active uniqueness excludes removed rows. |

Removing a Code Assignment does not delete the Highlight or the Code. If the
last active assignment is removed, the Highlight becomes uncoded.

### 3.6 Code Suggestion Run

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable generation-run identifier. |
| `project_id` | UUID | Derived Project owner. |
| `session_id` | UUID | Required Session scope. |
| `document_id` | UUID | Exact Primary Transcript used. |
| `record_id` | fixed Record ID | Required Code Dictionary owner. |
| `status` | enum | `queued`, `processing`, `complete`, or `failed`. |
| `provider` | text | Generation provenance. |
| `model` | text | Generation provenance. |
| `prompt_version` | text | Reproducible prompt contract. |
| `content_checksum` | text | Exact Transcript content version. |
| `created_at` | timestamp | Audit field. |
| `completed_at` | timestamp or null | Audit field. |
| `error_detail` | text or null | Recoverable failure detail. |

Generation is Session-scoped and uses only the Session's Primary Transcript.
It does not retrieve from another Session or Project.

### 3.7 Code Suggestion and Evidence

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable suggestion identifier. |
| `run_id` | UUID | Required generation run. |
| `record_id` | fixed Record ID | Required proposed Code owner. |
| `proposed_name` | text | Required proposed Code name. |
| `proposed_description` | text or null | Optional definition. |
| `confidence` | decimal or null | Model confidence when supported. |
| `status` | enum | `awaiting-review`, `accepted`, or `rejected`. |
| `was_edited` | boolean | True after a researcher changes the proposal before acceptance. |
| `accepted_code_id` | UUID or null | Code created or reused during acceptance. |
| `reviewed_at` | timestamp or null | Review audit field. |

Each suggestion has one or more ordered evidence rows. Each evidence row stores
a Transcript Anchor and its display order. The first complete passage is shown
by default; the remaining passages expand under **View all supporting
transcript evidence** and collapse under **View less supporting transcript
evidence**.

Accepting a suggestion is transactional:

1. create or reuse a case-insensitively matching active Record Code;
2. create or reuse one Highlight for each exact evidence anchor;
3. create missing Code Assignments for all of those Highlights;
4. mark the suggestion accepted and link `accepted_code_id`; and
5. return the affected Code and Highlights.

Repeated acceptance with the same idempotency key must not create duplicate
Codes, Highlights, or assignments.

## 4. API contracts

All routes extend the existing Project -> Session -> Primary Transcript
ownership checks. Mutation requests use an `Idempotency-Key` header.

### 4.1 Session coding workspace

```text
GET /api/projects/{projectId}/sessions/{sessionId}/coding
```

Returns:

- Primary Transcript metadata and blocks;
- current Code Suggestion Run status;
- suggestions awaiting review;
- accepted and uncoded Highlight counts;
- the active Record and available Record Codes; and
- filter metadata.

It returns `409` with a recoverable explanation when there is no complete
Primary Transcript. Suggestion generation and Code application return `409`
when the Session has no Record, while uncoded Highlight creation remains
available.

### 4.2 Highlights

```text
GET    /api/projects/{projectId}/sessions/{sessionId}/highlights
POST   /api/projects/{projectId}/sessions/{sessionId}/highlights
PATCH  /api/projects/{projectId}/sessions/{sessionId}/highlights/{highlightId}
DELETE /api/projects/{projectId}/sessions/{sessionId}/highlights/{highlightId}

POST   /api/projects/{projectId}/sessions/{sessionId}/highlights/{highlightId}/codes
DELETE /api/projects/{projectId}/sessions/{sessionId}/highlights/{highlightId}/codes/{codeId}
```

Supported Highlight query parameters:

- `status=all|accepted-coded|uncoded`;
- repeatable `code_id` values using match-any semantics;
- `view=transcript|list`;
- `cursor` and `limit` for the List view; and
- `include_media=false` in the transcript-only slice.

Suggestions awaiting review are retrieved from the Code Suggestions endpoint,
not represented as persisted Highlights before acceptance. The aggregate coding
workspace may present suggestions alongside Highlight filters without merging
their transport types.

Create Highlight request:

```json
{
  "anchor": {
    "block_id": "block-12",
    "start_char": 2410,
    "end_char": 2524,
    "excerpt_snapshot": "The selected Transcript passage",
    "content_checksum": "sha256:..."
  },
  "code_ids": [],
  "new_code": null
}
```

`code_ids` may be empty to save an uncoded Highlight. `new_code`, when supplied,
contains `name` and optional `description` and is created in the Session's
Record before assignment. The server rejects overlapping ownership, stale
checksums, invalid offsets, and cross-Record Code IDs.

### 4.3 Record Code Dictionary

```text
GET   /api/records/{recordId}/codes
POST  /api/records/{recordId}/codes
PATCH /api/records/{recordId}/codes/{codeId}
```

Code deletion is not included. A Code with evidence may later be archived, but
archive management is deferred until the Record-level Highlight workspace is
designed.

The following forward-compatible read endpoint may be implemented with this
slice or immediately afterward:

```text
GET /api/records/{recordId}/highlights
```

It returns a paginated cross-Session Highlight list grouped or filtered by
Record Code. It reuses the same Highlight List Item contract and exposes
nullable media preview metadata. A Record page is deferred, but this endpoint
shape prevents the Session workspace from becoming the only way to review
evidence.

### 4.4 AI Code Suggestions

```text
GET   /api/projects/{projectId}/sessions/{sessionId}/code-suggestions
POST  /api/projects/{projectId}/sessions/{sessionId}/code-suggestions/generate
PATCH /api/projects/{projectId}/sessions/{sessionId}/code-suggestions/{suggestionId}
POST  /api/projects/{projectId}/sessions/{sessionId}/code-suggestions/{suggestionId}/accept
POST  /api/projects/{projectId}/sessions/{sessionId}/code-suggestions/{suggestionId}/reject
```

- Generate creates a new immutable run against the current Primary Transcript
  checksum.
- Patch edits only an awaiting-review proposal's name or description.
- Accept uses the transactional behavior in section 3.7.
- Reject retains the suggestion and provenance but creates no Code,
  Highlight, or assignment.
- Accepted and rejected suggestions are immutable in this slice; reopening a
  review is deferred.

### 4.5 Error contract

All API errors use the existing HTTP status plus a stable application code and
researcher-readable detail. Minimum coding errors are:

| HTTP | Code | Meaning |
| --- | --- | --- |
| `404` | `session_not_found` | Session is outside the nested Project or does not exist. |
| `404` | `highlight_not_found` | Highlight is outside the nested Session or deleted. |
| `409` | `primary_transcript_required` | Coding requires a complete Primary Transcript. |
| `409` | `record_required_for_code` | A Code cannot be created or assigned until the Session has a Record. |
| `409` | `record_change_blocked_by_codes` | Record reassignment would strand active Code Assignments. |
| `409` | `stale_transcript_anchor` | The submitted checksum or offsets no longer match the Transcript. |
| `409` | `suggestion_already_reviewed` | Accept or reject was repeated with a different idempotency key. |
| `422` | `invalid_transcript_selection` | The selection is empty, reversed, or outside the Transcript. |
| `422` | `cross_record_code` | The Code does not belong to the Session's Record. |

## 5. State transitions

### 5.1 Suggestion generation run

```text
idle
  -> queued
      -> processing
          -> complete
          -> failed

failed -> queued (explicit retry creates a new run)
complete -> queued (explicit regenerate creates a new run)
```

The previous completed run and reviewed suggestions remain persisted when a
new run begins.

### 5.2 Code Suggestion

```text
awaiting-review
  -> awaiting-review + edited proposal
  -> accepted
  -> rejected
```

Accepted and rejected are terminal for the current slice. There is no bulk
Accept all or Reject all action.

### 5.3 Highlight and assignment

```text
text selection
  -> save Highlight
      -> uncoded Highlight
          -> apply/create Code
              -> accepted coded Highlight

accepted coded Highlight
  -> add another Code
  -> remove one Code Assignment
  -> uncoded Highlight (when last assignment is removed)
  -> deleted Highlight

uncoded Highlight
  -> deleted Highlight
```

Accepting a Code Suggestion enters the same accepted coded Highlight state; it
does not create a separate AI-only evidence type.

### 5.4 Workspace view state

The workspace has two independent, explicit controls:

- primary view: **Transcript** or **List**;
- right rail: **Suggestions awaiting review** or **Accepted highlights**.

**Filter highlights** opens a popover at Desktop and compact Desktop widths.
The filter does not replace the right rail. Applied filters display removable
chips plus a result count. Transcript view dims unrelated text and provides
Previous/Next match controls; List view returns only matching Highlight cards.

The MVP status filter values are:

- All highlights;
- Accepted coded highlights;
- Uncoded highlights; and
- Suggestions awaiting review.

Accepted Code selection is a searchable multi-select with match-any semantics.
The Provenance filter is explicitly deferred.

## 6. Lean Figma and responsive scope

Figma remains the visual source of truth for new interaction models, but AIR
will no longer create exhaustive visual variants for behavior that Storybook,
native browser state, or automated tests can express more efficiently.

For Transcript Coding and subsequent scopes until this decision is revisited:

- Codex creates and validates one 1440 px Desktop source composition only;
- Codex does not spend Figma MCP calls generating Tablet or Mobile variants;
- the user may add Tablet or Mobile variants manually after the Desktop
  contract is stable;
- user-authored responsive variants become implementation inputs only after
  review and approval;
- keep reusable primitives fluid and accessible, but do not claim phone
  support until a Mobile variant is approved;
- preserve existing mobile designs and implementation; this decision is
  prospective and does not require deleting approved prior work; and
- defer any missing responsive variant and small-viewport support policy rather
  than inferring it from the Desktop layout.

Figma must show the interaction-critical states only:

1. Suggestions awaiting review with collapsed evidence;
2. expanded supporting transcript evidence;
3. Accepted highlights;
4. manual text selection toolbar;
5. uncoded Highlight;
6. active Highlight filters in Transcript view;
7. filtered Highlight List view;
8. generation processing, no suggestions, and recoverable failure; and
9. Desktop layout and content constraints needed for later responsive work.

Hover, pressed, browser validation, keyboard focus, and minor loading
permutations remain design-system or Storybook responsibilities unless they
change workspace geometry.

## 7. Storybook and React gate

No Transcript Coding visual component or page implementation begins until the
core Figma workspace is approved. Before that approval, permitted work is
limited to this architecture contract, schema planning, deterministic example
data, and test planning.

After approval, implementation order is:

1. typed domain and transport contracts;
2. deterministic fixtures and MSW handlers;
3. Research Object components in Storybook;
4. workspace compositions in Storybook at approved viewport widths;
5. interaction and accessibility tests;
6. React route integration;
7. backend models, migration, services, and API routes; and
8. end-to-end acceptance workflow.

## 8. Acceptance criteria

### 8.1 Manual Highlight workflow

1. Given a complete Primary Transcript, dragging across valid text opens a
   compact selection toolbar with **Highlight** and **Apply code** only.
2. Highlight saves the exact passage without requiring a Code.
3. The saved passage appears in Accepted highlights as Uncoded and in List view
   when the Uncoded filter is active.
4. Apply code can select an existing active Code or create a new Code in the
   Session's Record.
5. Applying the Code once creates one Highlight and one assignment even if the
   user clicks twice or the request is retried.
6. Removing the final Code assignment retains the Highlight as Uncoded.
7. Deleting a Highlight removes it from Transcript and List views after
   confirmation without deleting its Record Code.

### 8.2 AI Suggestion workflow

1. Generate suggestions uses only the active Session's Primary Transcript.
2. Processing is announced without blocking navigation away from the page.
3. Each suggestion shows proposed name, definition, confidence/provenance when
   available, evidence count, and one complete supporting passage by default.
4. View all supporting transcript evidence expands the remaining complete
   passages; View less collapses them.
5. Accept creates or reuses one Record Code and produces coded Highlights for
   every supporting passage without duplicates.
6. Edit changes the proposed name or definition before acceptance and records
   edited-suggestion provenance.
7. Reject preserves the suggestion record but creates no accepted artifacts.
8. The interface does not provide Accept all or Reject all.

### 8.3 Filtering and navigation

1. Filter highlights is available after at least one saved Highlight or
   generated suggestion exists.
2. Status and Code filters can be combined, and multiple Codes use match-any
   semantics.
3. Active filters appear as removable chips and can be cleared together.
4. Transcript view emphasizes matching passages, dims unrelated text without
   making it unreadable, shows the match count, and supports Previous/Next.
5. List view shows one card per matching Highlight with speaker/location,
   complete excerpt, Code chips, status/provenance, Open in transcript, Edit
   codes, and Delete highlight.
6. Open in transcript returns to Transcript view, scrolls the source passage
   into view, moves focus to it, and does not lose the active filters.
7. The optional media region is absent when no media preview exists; no empty
   placeholder is shown in the transcript-only slice.

### 8.4 Ownership, lineage, and Record readiness

1. A Highlight cannot reference another Project, Session, or Document.
2. A Code cannot be assigned across Records.
3. An uncoded Highlight can be saved before Record assignment; Code creation
   and assignment provide a clear Record-required error.
4. Record reassignment is blocked while coded Highlights exist.
5. Record-level Highlight retrieval returns evidence from all related Sessions
   without copying or changing Highlight ownership.
6. Every accepted Code assignment resolves to its source Transcript anchor and,
   when applicable, the originating suggestion and generation run.
7. Future timestamps and media preview fields remain nullable and do not alter
   the transcript-only interface.

### 8.5 Accessibility and supported viewport

1. The complete coding workflow is keyboard operable at every approved
   viewport, beginning with the 1440 px Desktop contract.
2. Text selection actions have keyboard alternatives for selecting the focused
   Transcript block or opening an accessible range-selection control.
3. Focus returns predictably after closing the filter popover and after Accept,
   Edit, Reject, assignment removal, or deletion.
4. Status is never communicated by color alone.
5. Live processing, successful mutations, and recoverable errors are announced
   without moving focus unexpectedly.
6. Highlight emphasis and dimmed Transcript text retain WCAG 2.2 AA contrast.
7. No horizontal page overflow occurs at each approved viewport.
8. Tablet and phone acceptance tests are not required until their Figma
   variants are approved.

## 9. Explicit deferrals

- agent-authored Tablet and Mobile variants until explicitly requested;
- Provenance filtering;
- Record-level Highlight page design and implementation;
- Code groups, hierarchy, merge, archive management, and bulk recoding;
- bulk Accept all or Reject all;
- collaborative coding, comments, assignments, or reviewer identity;
- audio/video upload, playback, automatic clip generation, and reels;
- cross-Record Codes;
- manual Themes; and
- automatic promotion of Codes into Requirements, Decisions, or Action Items.
