# AIR V2 Domain Map

Status: Approved canonical domain model for AIR V2  
Version: 1.4
Replaces: AIR Domain Map v1.3
Scope: Canonical V2 domain direction with Sprint 8 and Record Synthesis MVP boundaries

## 1. Canonical domain map

### Interface terminology boundary

The approved product and implementation term is **Project**. Figma components,
page templates, navigation labels, client routes, services, and the existing
`projects` database table use Project and Projects in sentence case. AIR V2
does not introduce a parallel Study entity or rename the existing Project
aggregate.

```text
Workspace
|
+-- Projects
|   |
|   +-- Participants
|   |
|   +-- Sessions
|   |   |
|   |   +-- Session Participants
|   |   |
|   |   +-- Documents
|   |       +-- Transcript (only supported Sprint 8 type)
|   |   |
|   |   +-- Session Report
|   |   |   +-- Session Information
|   |   |   +-- Session Participants
|   |   |   +-- Executive Summary
|   |   |   +-- Requirements
|   |   |   +-- Decisions
|   |   |   +-- Action Items
|   |   |   +-- Open Questions
|   |   |   +-- Key Insights
|   |   |   +-- Detailed Notes
|   |   |
|   |   +-- Related Records
|   |   |
|   |   +-- Related Common Components
|   |
|   +-- Evidence
|   |
|   +-- Themes
|   |
|   +-- Insights
|   |
|   +-- Recommendations
|   |
|   +-- Chat Conversations
|       +-- Messages
|
+-- Product Knowledge
    |
    +-- Records
    |   |
    |   +-- Requirements
    |   |
    |   +-- Decision Log
    |   |
    |   +-- Action Items
    |   |
    |   +-- Chat Conversations
    |   |
    |   +-- Common Components
    |   |
    |   +-- Related Research
    |   |
    |   +-- Reporting
    |   |
    |   +-- Data Dictionary Terms
    |
    +-- Common Components
    |   |
    |   +-- Requirements
    |   |
    |   +-- Decision Log
    |   |
    |   +-- Action Items
    |   |
    |   +-- Related Records
    |   |
    |   +-- Related Research
    |
    +-- Reporting
    |
    +-- Data Dictionary
    |
    +-- Relationships
```

The Workspace is a conceptual boundary in V2; Sprint 8 does not introduce
authentication, tenancy, or team management.

### 1.1 Approved terminology and structural decisions

- Research Impact Links become **Relationships**.
- Shared Components become **Common Components**.
- Decisions use the interface label **Decision Log**.
- Participant memberships use the interface label **Session Participants**.
- Cross-cutting Knowledge is removed as a separate domain branch.
- A Session Report is the reviewed bridge between a Transcript and promoted
  Product Knowledge.
- Session Reports contain Session Information, Session Participants, Executive
  Summary, Requirements, Decisions, Action Items, Open Questions, Key Insights,
  and Detailed Notes, in that order.
- Participant metadata includes Organization.
- Project is the aggregate name at the interface, API, service, and database
  boundaries; child objects use `project_id` ownership.

## 2. Bounded contexts

### 2.1 Research workspace

The Project is the aggregate root for research activity. Participants belong to a
Project and may join multiple Sessions in that Project. A Session may contain
multiple Participants and Documents. A Session may also have explicit
relationships to Product Knowledge Records and Common Components.

A Session Report organizes the Session information, participants, synthesis,
notes, candidate Requirements, Decisions, Action Items, and Open Questions. It
is reviewed before knowledge is promoted into Product Knowledge.

Research artifacts - Evidence, Themes, Insights, Recommendations, and Chat -
are Project-scoped. They must not retrieve or cite content from another Project.

### 2.2 Product Knowledge

Product Knowledge is cross-Project and exists independently of a Project. A Record
represents functionality being designed and its workflow, for example:

```text
Record 1
  +-- Requirements
  +-- Decision Log
  +-- Action Items
  +-- Chat Conversations
```

A Record's display name remains generic by default, for example `Record 1`,
`Record 2`, and `Record 3`. A Record may reference multiple Common Components,
and a Common Component may be referenced by multiple Records. Examples of
Common Components include
Search, Document Upload, Timeline, Notes, Assignments, History, Comments, and
Notifications.

Records may also contain Related Research, Reporting references, and Data
Dictionary Terms. Common Components may contain Requirements, a Decision Log,
Action Items, Related Records, and Related Research. Records may have persistent
Chat Conversations.

Relationships connect Project research to Product Knowledge without changing the
ownership of either object. Product Knowledge may inform future research, and
approved research outcomes may update Product Knowledge.

Product Knowledge is not implemented in Sprint 8; the boundary is recorded now
to prevent Project objects from absorbing cross-Project responsibilities.

#### Record Synthesis MVP boundary

The controlled Record Synthesis MVP implements the first narrow Product
Knowledge workflow without changing the long-term domain model:

- the workspace contains three seeded, read-only Records with stable IDs
  `record-1`, `record-2`, and `record-3` and display names `Record 1`,
  `Record 2`, and `Record 3`;
- the MVP interface assigns each Session to exactly one Record through a
  single-select field, while the persistence model may remain extensible;
- a Record synthesis automatically includes every eligible related Session;
- eligibility requires the latest Researcher Reviewed or Approved Session
  Report with evidence-linked Requirements, Decisions, or Action Items;
- generation requires at least two eligible Sessions; and
- Common Components remain part of the canonical architecture but are omitted
  from the MVP interface and synthesis scope without deleting stored data.

The fixed catalog and single-Record interface are delivery constraints, not a
redefinition of Record ownership or the future Relationship model.

### 2.3 Relationship rules

Records and Common Components are connected through explicit Relationships,
not tags. Tags may be added later as optional secondary metadata, but they do
not replace the relationship model.

Every Requirement, Decision Log entry, and Action Item must belong to or relate
to at least one Record or Common Component. Cross-cutting Knowledge is not a
separate domain branch.

## 3. Canonical entities and Sprint 8 data contracts

The field lists below are minimum architectural contracts, not final form-copy
specifications.

### 3.1 Project

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable primary key; migrated V1 Project IDs are preserved. |
| `name` | text | Required display name. |
| `description` | text or null | Optional Project purpose or summary. |
| `created_at` | timestamp | Preserved during migration. |
| `updated_at` | timestamp | Preserved and updated normally. |

Project lifecycle statuses are not yet approved. Sprint 8 must not introduce a
status vocabulary merely to decorate cards. Archive behavior, if required,
must be approved separately.

### 3.2 Participant

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable primary key. |
| `project_id` | UUID | Required Project owner. |
| `first_name` | text | Required participant first name. |
| `last_name` | text | Required participant last name. |
| `email` | text or null | Optional email address. |
| `role` | text or null | Optional participant role or job function. |
| `organization` | text or null | Optional organization affiliation. |
| `researcher_notes` | text or null | Optional researcher notes. |
| `record_ids` | list of text IDs | Optional relationships to Product Knowledge Records. |
| `created_at` | timestamp | Audit field. |
| `updated_at` | timestamp | Audit field. |

Participant full names are derived for presentation from `first_name` and
`last_name`; a redundant `display_name` is not persisted. Participants are
Project-scoped in Sprint 8. Cross-Project participant identity is intentionally
excluded to avoid introducing identity matching and privacy rules without a
dedicated specification.

### 3.3 Session

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable primary key. |
| `project_id` | UUID | Required Project owner. |
| `title` | text | Required researcher-facing title. |
| `session_type` | enum or text | Interview, usability test, focus group, working session, design critique, or other. |
| `starts_at` | timestamp or null | Optional research date and time. |
| `duration_minutes` | integer or null | Optional Session duration. |
| `description` | text or null | Optional purpose or notes. |
| `primary_transcript_document_id` | UUID or null | Optional pointer to one Document owned by this Session. |
| `created_at` | timestamp | Audit field. |
| `updated_at` | timestamp | Audit field. |

The primary transcript is represented by a nullable Session reference rather
than an `is_primary` flag on every Document. This prevents more than one
Document from becoming primary.

### 3.4 Session-Participant relationship

| Field | Type | Requirement |
| --- | --- | --- |
| `session_id` | UUID | Composite primary/unique key member. |
| `participant_id` | UUID | Composite primary/unique key member. |
| `created_at` | timestamp | Audit field. |

Both referenced objects must belong to the same Project. The API and database
service layer must reject cross-Project relationships. The interface calls this
collection **Session Participants**; the database join table is
`session_participants`.

### 3.5 Document

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Existing V1 IDs are preserved. |
| `session_id` | UUID | Required Session owner after migration. |
| `document_type` | enum | `transcript` is the only accepted Sprint 8 value. |
| `filename` | text | Existing filename is preserved. |
| `file_path` | text | Existing storage reference is preserved. |
| `mime_type` | text or null | Existing MIME metadata is preserved. |
| `content` | text or null | Existing extracted text is preserved. |
| `status` | enum | Existing uploaded, processing, complete, and failed behavior is preserved. |
| `error_message` | text or null | Existing processing error is preserved. |
| `uploaded_at` | timestamp | Existing timestamp is preserved. |
| `processed_at` | timestamp or null | Existing timestamp is preserved. |

The architecture permits future Document types such as notes, requirements,
screenshots, and attachments, but Sprint 8 UI and APIs must reject them.

### 3.6 Session Report

The Session Report is a session-scoped research deliverable and the reviewed
bridge between source research and Product Knowledge. Its canonical sections
are:

1. Session Information;
2. Session Participants;
3. Executive Summary;
4. Requirements;
5. Decisions;
6. Action Items;
7. Open Questions;
8. Key Insights;
9. Detailed Notes.

The Session Participants section presents these columns:

| Participant | Role | Organization | Notes |
| --- | --- | --- | --- |
| Participant full name | Participant metadata | Participant metadata | Relevant researcher notes |

The Session Report is implemented with persisted revisions, ordered report
items, source evidence, and the AI Generated → Researcher Reviewed → Approved →
Superseded lifecycle.

### 3.7 Record Synthesis Run

A Record Synthesis Run is an immutable generation request and source snapshot.
It records:

| Field | Type | Requirement |
| --- | --- | --- |
| `id` | UUID | Stable run identifier. |
| `record_id` | text ID | One of the fixed MVP Record IDs. |
| `status` | enum | Queued, processing, complete, or failed. |
| `session_ids` | ordered list of UUIDs | Exact eligible Session scope used by the run. |
| `session_report_revision_ids` | ordered list of UUIDs | Exact reviewed/approved source revisions. |
| `provider` | text | Generation provenance. |
| `model` | text | Generation provenance. |
| `prompt_version` | text | Reproducible prompt contract. |
| `created_at` | timestamp | Audit field. |
| `completed_at` | timestamp or null | Audit field. |
| `error_detail` | text or null | Recoverable failure detail. |

Completed runs are never silently updated when a source Session Report changes.
Regeneration creates a new run and preserves prior source snapshots.

### 3.8 Record Synthesis Item

The MVP produces Requirement, Decision, and Action Item synthesis items only.
Each item belongs to one Record Synthesis Run and retains links to every source
Session Report item and supporting transcript evidence used to produce it.
Items use the canonical AI Generated, Researcher Reviewed, Approved, and
Superseded lifecycle. Equivalent source items may be consolidated only when all
source links remain intact.

## 4. Research artifact lineage

The following is the target lineage model for later V2 sprints:

```text
Project
  -> Session
      -> Document
          -> Transcript
              -> Session Report
                  -> Researcher Review
                      -> Relationship
                          -> Record and/or Common Component
                              -> Requirement / Decision Log / Action Item

Document
  -> Chunk / source span
      -> Evidence
          -> Theme
              -> Insight
                  -> Recommendation
```

Evidence is logically owned by the Project and retains source pointers to its
Session, Document, and chunk or source span. A dedicated Evidence Explorer can
therefore query across the Project while every item remains traceable.

Sprint 8 preserves the existing Theme and ThemeEvidence records. It does not
redesign their schema before the Cross-participant Synthesis and Evidence
Explorer requirements are approved.

Relationships preserve the connection between research and Product Knowledge.
They do not move Requirements, Decision Log entries, or Action Items into the
Project aggregate.

The promotion workflow is:

```text
Transcript
  -> Session Report
      -> Researcher Review
          -> Record Synthesis Run
              -> Requirement / Decision / Action Item
                  -> source Session Report items
                      -> transcript evidence
```

Session Report content remains session-scoped research until the researcher
promotes it. Promotion creates or updates Product Knowledge while retaining a
relationship back to the originating Session Report and Transcript.

## 5. Artifact status and provenance

Generated research artifacts use this approved review lifecycle:

```text
AI Generated
    -> Researcher Reviewed
        -> Approved
            -> Superseded
```

At minimum, future artifact models preserve:

- generation provider and model;
- generation timestamp;
- source version or provenance links;
- original generated content or revision history;
- researcher editor and edit timestamp when identity becomes available;
- approval timestamp and approver when identity becomes available;
- superseding artifact reference where applicable.

Because authentication is excluded, Sprint 8 must not invent user identities.
Identity-bearing audit fields remain nullable or use system/researcher labels
until authentication is specified.

## 6. Persistent Session Chat

Ask this session persists Conversations and Messages in V2. Conversation
lifecycle is Saved, Archived, or Deleted. Answers retain citations to the
Session transcript chunks used at answer time. Project-wide Ask remains a
separate navigation destination and is not embedded in Project Overview.

## 7. V1-to-V2 migration contract

### 7.1 Required transformation

```text
V1 Project                         V2 Project
|                                  |
+-- Documents          ->          +-- Imported research Session
|                                      +-- existing Documents
+-- Chunks             ->          +-- existing Chunks
|
+-- Themes             ->          +-- existing Themes
|
+-- ThemeEvidence      ->          +-- existing ThemeEvidence
```

### 7.2 Deterministic import Session

Each migrated Project receives exactly one Session for its existing Documents.

- Default title: `Imported research`.
- The Session ID is deterministic, preferably UUIDv5 generated from a fixed AIR
  V2 migration namespace and the Project ID.
- A unique migration marker such as `migration_source = 'v1-project'` prevents
  duplicate Sessions.
- Existing Documents are moved by reference; they are not copied.
- Existing Document, Chunk, Theme, and ThemeEvidence IDs remain unchanged.

If a V1 Project has no Documents, the migration does not need to create an empty
import Session. Creating a Session later remains a normal user action.

### 7.3 Staged database migration

1. Preserve the existing `projects` table, Project IDs, and timestamps.
2. Create `participants`, `sessions`, and `session_participants` plus Session
   Report and Conversation persistence tables.
3. Add nullable `documents.session_id` and `documents.document_type`.
4. Create one deterministic import Session for each Project that owns Documents.
5. Backfill each existing Document to that Session and set its type to
   `transcript`.
6. Validate that all Documents have a Session, then make `session_id` required.
7. Retain existing `project_id` ownership and `/projects` API routes.
8. Add Project- and Session-scoped ownership checks to every nested endpoint.
9. Retain the V1 Project document API as a compatibility facade that assigns
   new uploads to the deterministic imported Session.

### 7.4 Idempotency and integrity requirements

The migration must pass all of the following:

- Running its data-backfill logic twice creates no additional Project, Session,
  Document, Theme, or ThemeEvidence rows.
- Project count does not change.
- Document, Chunk, Theme, and ThemeEvidence counts do not change.
- Every existing Document ID and content checksum is unchanged.
- Every existing Theme and ThemeEvidence relationship resolves after migration.
- Every migrated Document belongs to exactly one Session.
- Every imported Session belongs to the same Project as its Documents did in V1.
- Deleting or rolling back is not used as a migration strategy.

### 7.5 Transparency requirements

- Users continue to see their existing Projects after upgrade.
- Existing research content remains available without manual re-upload.
- The imported Session behaves like a normal Session after migration.
- Migration implementation details are not exposed as errors or duplicate UI.
- A failure aborts safely and leaves the pre-migration data intact.

## 8. Sprint boundaries

### Sprint 8 includes

- preservation of V1 Projects with deterministic imported Sessions;
- Project CRUD and Project-centered navigation;
- Participant CRUD;
- Session CRUD;
- Session-to-Participant relationships;
- transcript Document upload and processing under a Session;
- selection of one optional primary transcript;
- preservation of existing Themes and Evidence;
- approved Figma, Storybook, React, API, migration, and accessibility coverage.

### Sprint 8 excludes

- cross-participant synthesis;
- Product Knowledge promotion from approved Session Reports;
- redesigned Theme or Evidence schemas;
- Evidence Explorer;
- Insights and Recommendations;
- Product Knowledge implementation;
- Project-wide Ask implementation;
- authentication, external integrations, audio/video, OCR, XLSX, and dark mode.

### Record Synthesis MVP includes

- the fixed Record 1, Record 2, and Record 3 catalog;
- one Record selection per Session in the interface;
- one Primary Transcript per Session in the interface;
- automatic synthesis across all eligible Sessions related to a Record;
- Requirements, Decisions, and Action Items with source lineage;
- persisted run snapshots and item review/approval status; and
- workspace-level Records collection, detail, synthesis, and evidence-context
  routes.

### Record Synthesis MVP excludes

- custom Record creation, editing, or deletion;
- multiple Record selection per Session in the interface;
- multiple-transcript management in the interface;
- Common Component fields, filters, summaries, and synthesis;
- manual synthesis groups or Session selection;
- cross-Record or arbitrary Project synthesis;
- manual Themes, manual transcript coding, and AI-assisted code review; and
- authentication, public access with real research data, and managed secrets.

## 9. V3 follow-ups

The following capabilities are explicitly deferred from V2 to V3:

- **Participant CSV import:** allow researchers to import Participants into the
  active Project from a CSV file. The workflow should include column mapping,
  required-field validation, duplicate review, and a clear import result
  summary; it must not silently overwrite existing Participant records.
- **Organization grouping in Session Reports:** allow the Session Participants
  section of a Session Report to be grouped by Organization. Participants
  without an Organization should remain visible in an explicit
  `No organization` group.

These follow-ups do not introduce an Organization aggregate or change the V2
Participant ownership model. Organization remains Participant metadata unless
a later architecture decision promotes it to a first-class domain object.
