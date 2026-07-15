# React and Storybook Component Contract Map

Status: Approved; I1 Shared application foundation implemented and awaiting review  
Date: July 14, 2026  
Source of truth: Approved Sky AIR Figma Research Objects and Page Templates

## 1. Outcome

The existing React design-system primitives are a sound implementation base.
The application layer is not yet aligned with the approved Figma architecture:
the frontend still renders the complete V1 workflow from one `ProjectsPage`,
has no route tree, and does not contain standalone shared-shell or Research
Object components.

The recommended implementation strategy is Storybook-first:

1. preserve the approved primitive APIs;
2. add canonical frontend domain types, fixtures, and transport adapters;
3. build shared application composites in Storybook;
4. build Research Object components in dependency order;
5. compose approved page templates in Storybook with MSW-backed route states;
6. add the application router and connect existing APIs;
7. implement missing backend entities, endpoints, and the idempotent V1 data
   migration;
8. run final Figma parity, accessibility, API, migration, and end-to-end checks.

No React behavior was changed during this audit.

## 2. Audit baseline

### 2.1 Current frontend

| Area | Current state | Assessment |
| --- | --- | --- |
| Framework | React 18, TypeScript, Vite | Reuse. |
| Server state | TanStack Query | Reuse with normalized query keys. |
| Forms | React Hook Form and Zod installed | Reuse; current V1 form code does not yet use them consistently. |
| Routing | `react-router-dom` installed, but `main.tsx` renders `ProjectsPage` directly | New route architecture required. |
| Component library | 29 UI implementation files | Reuse approved primitives. |
| Storybook | 31 story files, Storybook 9, Docs, a11y, pseudo-states | Reuse and extend. |
| Application pages | One monolithic `ProjectsPage.tsx` | Replace with feature routes and containers. |
| Styling | AIR tokens plus compatibility aliases | Reuse canonical `--air-*` tokens. |
| Icons | `lucide-react` | Reuse; no separate React Icon wrapper is required. |

### 2.2 Baseline verification

- `npm run build`: passed;
- `npm run test:run`: 11 files and 49 tests passed;
- `npm run build-storybook`: passed;
- Storybook reported only the expected no-MDX notice and bundle-size warnings;
  neither blocks component implementation.

### 2.3 Current backend

The backend currently implements:

- Project CRUD;
- Project-owned Participants and Record relationships;
- Project-owned Sessions, Session Participants, and Record/Common Component
  relationships;
- Session-owned Documents and one optional primary transcript;
- Session-scoped transcript retrieval and context;
- Session-scoped Themes and review lifecycle;
- Session Reports, ordered report items, evidence, and revisions;
- persisted Ask this session conversations, messages, and citations;
- Project-owned Documents and extracted Chunks;
- Project-scoped retrieval;
- Project-scoped chat;
- Project-owned Themes and Theme Evidence;
- AI provider settings;
- exports, although exports remain outside the approved V2 UI scope;
- an additive, idempotent V1 Project data backfill into deterministic imported
  Sessions.

Product Knowledge entities remain future work; V2 stores only explicit
Session/Participant references to Record and Common Component identifiers.

## 3. Canonical implementation conventions

### 3.1 Figma-to-React translation

- Figma `Viewport` variants become responsive CSS or container behavior, not a
  public React prop.
- Figma hover, active, and focus examples remain CSS-driven interaction states.
- Data lifecycle values such as `Processing`, `Approved`, or `Failed` remain
  typed React props because they represent application data.
- Figma boolean visibility properties become optional data or slots where
  possible. For example, a missing description hides the description; callers
  should not normally pass both `description` and `showDescription`.
- Figma instance swaps become typed React nodes, data-driven items, or render
  slots. Lucide icons remain React nodes.
- Default and Compact layouts may use a `layout` prop only when markup changes.
  Purely responsive width changes remain CSS-driven.
- Page templates are Storybook compositions and route components, not one
  enormous configurable component.

### 3.2 Domain and transport boundaries

React components consume camelCase domain models. API modules may retain the
current snake_case transport format, but convert it at the API/query boundary.
Components must not know backend field names.

```ts
type EntityId = string;

type LifecycleStatus =
  | "ai-generated"
  | "researcher-reviewed"
  | "approved"
  | "superseded";

type ProcessingStatus =
  | "uploaded"
  | "processing"
  | "complete"
  | "failed";

type SessionType =
  | "interview"
  | "usability-test"
  | "focus-group"
  | "working-session"
  | "design-critique"
  | "other";

type ProductReference = {
  id: EntityId;
  name: string;
};
```

### 3.3 Component ownership

- `components/ui`: reusable design-system primitives only;
- `components/application`: shell, navigation, collection, feedback, and route
  composites reusable across product areas;
- `components/research`: presentation components for Project, Participant,
  Session, Transcript, Theme, and Session Report objects;
- `features/*`: forms, route containers, query hooks, mutations, and feature
  orchestration;
- `routes/*`: route-level composition and error/loading boundaries;
- `mocks/fixtures`: canonical Storybook and test fixtures;
- `api`: transport types, request functions, and transport-to-domain adapters.

## 4. Existing primitive contract map

| Figma family | React status | Contract decision |
| --- | --- | --- |
| Button, Icon Button, Link, Button Set | Implemented | Reuse normalized semantic variants and full-word sizes. |
| Input, Textarea, Search, Select, Multi-select, Date, Password | Implemented | Reuse field composites; forms use React Hook Form adapters. |
| Checkbox, Radio, Toggle | Implemented | Reuse native controlled/uncontrolled contracts. |
| Badge, Chip, Tooltip | Implemented | Reuse semantic tones and accessible interactions. |
| Alert, Spinner, Progress, Tabs | Implemented | Reuse; lifecycle examples remain data-driven. |
| Avatar, Accordion, Breadcrumbs | Implemented | Reuse; update stale Study example copy in stories. |
| Cards | Implemented generic primitives | Do not reuse generic Card as a substitute for a Research Object contract. |
| Video, Dialog, Notifications | Implemented | Reuse where page composition requires them. |

No new primitive token or visual-state API is required for the approved page
templates.

## 5. Shared application component contracts

These components are new React work even when a partial visual pattern exists
inside `ProjectsPage.tsx`.

### 5.1 Global Header and shells

```ts
type GlobalHeaderProps = {
  workspaceName: string;
  projectName?: string;
  showProjectSearch?: boolean; // defaults to false in V2
  notificationsLabel?: string;
  settingsLabel?: string;
  onOpenNavigation?: () => void;
};

type ProjectNavigationItem =
  | "overview"
  | "participants"
  | "sessions"
  | "ask-project";

type ApplicationShellProps = {
  context: "workspace" | "project";
  project?: { id: EntityId; name: string };
  activeProjectItem?: ProjectNavigationItem;
  children: React.ReactNode;
};
```

`ApplicationShell` composes `GlobalHeader`, `GlobalNavigation`, and
`ProjectNavigation`. Project search remains hidden by default and is reserved
for V3. The main content region owns the skip-link target.

### 5.2 Page and section navigation

```ts
type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
};

type SectionNavigationItem = {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
};

type SectionNavigationProps = {
  label: string;
  items: SectionNavigationItem[];
  activeId: string;
};
```

`SectionNavigation` is route navigation, not an ARIA tablist. Session workspace
tabs use child routes and may use the existing Tabs presentation with links.

### 5.3 Collection and route support

```ts
type EntityCollectionProps = {
  title: string;
  countLabel?: string;
  controls?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  state?: "ready" | "loading" | "empty" | "no-results" | "error";
  stateContent?: React.ReactNode;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
};

type SharedRouteStateProps = {
  state: "loading" | "recoverable-error" | "not-found" | "unavailable-source";
  onRetry?: () => void;
  returnHref?: string;
};
```

Additional new reusable contracts:

| Component | Required public API |
| --- | --- |
| `DropdownMenu` | Data-driven items, optional icon, destructive tone, disabled state, selection callback; keyboard navigation and focus restoration are internal. |
| `FileDropzone` | Accept rules, max size, selected files, `onFilesSelected`, rejection text, disabled state. |
| `ProcessingStatus` | Typed processing status, label, optional detail, progress value. |
| `MetadataList` | Array of label/value pairs with semantic `dl` markup. |
| `ErrorSummary` | Heading and field-linked errors; focus target after invalid submission. |

## 6. Research Object contract map

### 6.1 Project family

```ts
type ProjectSummary = {
  id: EntityId;
  name: string;
  description?: string;
  participantCount: number;
  sessionCount: number;
  readyTranscriptCount?: number;
  updatedAt: string;
};

type ProjectCardProps = {
  project: ProjectSummary;
  href: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

type ProjectFormValues = {
  name: string;
  description?: string;
};
```

| Component | React status | Contract |
| --- | --- | --- |
| `ProjectCard` | Extract/new | One primary link plus separate edit/delete controls; no nested interactive elements. |
| `ProjectForm` | Extract/refactor | `mode`, `defaultValues`, `onSubmit`, `onCancel`, `isSubmitting`, `submitError`; React Hook Form + Zod. |
| `ProjectSummary` | New | `project`, counts, transcript summary, recommended action, optional recent activity slot. |
| `ProjectWorkflowSummary` | New | Data-driven ordered steps and progress; no fixed 25/50/75/100 API. |

### 6.2 Participant family

```ts
type ParticipantSummary = {
  id: EntityId;
  projectId: EntityId;
  firstName: string;
  lastName: string;
  email?: string;
  organization?: string;
  role?: string;
  recordIds: EntityId[];
  sessionCount: number;
  researcherNotes?: string;
};

type ParticipantFormValues = Pick<
  ParticipantSummary,
  "firstName" | "lastName" | "email" | "organization" | "role" |
    "recordIds" | "researcherNotes"
>;
```

| Component | React status | Contract |
| --- | --- | --- |
| `ParticipantListItem` | New | `participant`, optional `href`, direct `onEdit` and `onDelete`; Default/Compact is responsive. |
| `ParticipantForm` | New | `mode`, values, Record options, submit/cancel callbacks, pending and request-error state. |
| `ParticipantPicker` | New | `participants`, controlled `value`, `onValueChange`, optional add action, error, disabled. |

V2 does not add Phone number, Persona, browser, experience, technical
proficiency, device, accessibility-needs, or Project reference ID to the
canonical Participant type. Dormant Figma visibility properties for Persona or
Reference ID must remain hidden and must not create accidental backend fields.

### 6.3 Session family

```ts
type SessionSummary = {
  id: EntityId;
  projectId: EntityId;
  title: string;
  type: SessionType;
  startsAt?: string;
  durationMinutes?: number;
  participants: ParticipantSummary[];
  documentCount: number;
  transcriptStatus: ProcessingStatus | "none";
  themeStatus: "not-generated" | "generating" | LifecycleStatus | "failed";
  reportStatus: "not-generated" | "generating" | LifecycleStatus | "failed";
  relatedRecords: ProductReference[];
  relatedCommonComponents: ProductReference[];
  updatedAt: string;
};
```

| Component | React status | Contract |
| --- | --- | --- |
| `SessionListItem` | New | Compact overview representation with `session`, `href`, edit/delete callbacks. |
| `SessionCollectionItem` | New | Full Sessions page row/card with all filterable statuses and relationships plus `Open session`. |
| `SessionForm` | New | Title/type required; separate date/time controls; Participant Picker; mode and mutation states. |
| `SessionParticipantGroup` | New | V2 public contract is compact summary plus edit action. Expanded Figma examples are not exposed as a V2 `layout` API. |
| `SessionSummary` | New | Type, date, duration, Records, and Common Components; no moderator field. |

### 6.4 Transcript family

```ts
type TranscriptDocumentSummary = {
  id: EntityId;
  projectId: EntityId;
  sessionId: EntityId;
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  status: ProcessingStatus;
  isPrimary: boolean;
  uploadedAt: string;
  processedAt?: string;
  errorMessage?: string;
};
```

| Component | React status | Contract |
| --- | --- | --- |
| `TranscriptUploader` | Extract/new | Selected file, accept rules, upload progress, processing status, cancel/retry callbacks. |
| `TranscriptDocumentItem` | Extract/refactor | Document data, `href`, set-primary, retry, delete actions; Delete uses an accessible Trash2 Icon Button. |
| `TranscriptPreview` | Extract/refactor | Document and structured transcript turns; source actions supplied as a slot. |
| `TranscriptSearchResult` | New | Speaker, location, relevance, excerpt, and `Open transcript context`; retrieval only. |

### 6.5 Theme and Session Report family

```ts
type ThemeStatus = "ai-generated" | "researcher-reviewed" | "approved" | "rejected";
type SessionReportStatus = LifecycleStatus;
type SessionReportItemType =
  | "requirement"
  | "decision"
  | "action-item"
  | "open-question"
  | "key-insight";
```

| Component | React status | Contract |
| --- | --- | --- |
| `ThemeCard` | Extract/refactor | Theme summary, status, evidence preview/count, review/edit/reject actions. |
| `ThemeEvidenceDetail` | New | Theme metadata and data-driven evidence items with transcript-context links. |
| `SessionReportItem` | New | Typed item, provenance, evidence preview, edit/context actions. |
| `SessionReport` | New | Report metadata, ordered sections, lifecycle, review/edit/regenerate/approve/create-revision actions. |
| `AskThisSession` | Extract/refactor | Suggested questions, conversation turns, pending/error state, composer, citations, context links. |

Theme status and Session ownership are missing from the current API. Report and
conversation persistence are entirely new backend work.

### 6.6 Settings

`AIProviderSettingsForm` should be extracted from the V1 page and retain the
existing `AISettingsPayload`, load/save/test hooks, and nine Figma data states.
The User Profile tab remains an intentional empty-state route.

## 7. Page-template and route contracts

| Route | Route component | Required stories/states | Backend readiness |
| --- | --- | --- | --- |
| `/projects` | `ProjectsIndexPage` | Populated, Loading, Empty, Error; three viewports | Existing API needs summary counts. |
| `/projects/new` | `CreateProjectRoute` | Pristine, Validation Error, Submitting, Request Failure; dialog/full-page | Project create exists. |
| `/projects/:projectId/edit` | `EditProjectRoute` | Same form states | Project update exists. |
| `/projects/:projectId/overview` | `ProjectOverviewPage` | Populated, No Sessions, Loading, Error, Not Found | Summary endpoint/new aggregation required. |
| `/projects/:projectId/participants` | `ParticipantsPage` | Populated, Loading, Empty, Error, Not Found | New backend. |
| `/projects/:projectId/participants/:participantId` | `ParticipantDetailPage` | Pristine, Validation Error, Submitting, Request Failure, Not Found | New backend; approved page is the edit form. |
| `/projects/:projectId/sessions` | `SessionsPage` | Populated, Loading, Empty, No Results, Error | New backend and filters. |
| `/projects/:projectId/sessions/:sessionId/*` | `SessionWorkspaceRoute` | Six child destinations and route states | Mostly new backend. |
| `.../documents/:documentId` | `TranscriptDetailPage` | Ready, Loading, Unavailable, Error | Existing document detail must enforce Session ownership. |
| `/settings/profile` | `UserProfileSettingsPage` | Empty placeholder | No backend in scope. |
| `/settings/ai` | `AIProviderSettingsPage` | Ready plus load/save/test outcomes | Existing API. |

The Session workspace child routes are:

- `overview`;
- `participants`;
- `transcript`;
- `themes`;
- `report`;
- `ask`.

Every page template receives real data from route/query containers. Storybook
uses fixtures and MSW handlers rather than public `state` props on production
pages.

## 8. Query and mutation contracts

Recommended TanStack Query keys:

```ts
["projects"]
["projects", projectId]
["projects", projectId, "participants", searchParams]
["projects", projectId, "sessions", searchParams]
["projects", projectId, "sessions", sessionId]
["projects", projectId, "sessions", sessionId, "documents"]
["projects", projectId, "sessions", sessionId, "themes"]
["projects", projectId, "sessions", sessionId, "report"]
["projects", projectId, "sessions", sessionId, "conversations"]
["settings", "ai"]
```

Mutations invalidate the narrowest owning aggregate. Deleting a Participant
invalidates the Project Participant collection and affected Session summaries;
deleting a transcript invalidates its Session documents, Session summary,
Themes, Report, and retrieval queries.

## 9. Backend and migration dependency map

### 9.1 Required data-model work

| Backend change | Needed by |
| --- | --- |
| `participants` table with Project owner and approved fields | Participant components and routes. |
| `sessions` table with Project owner, type, timestamp, duration, description | Sessions routes and workspace. |
| `session_participants` membership table | Picker, Participant Group, reports. |
| Add `session_id` and `is_primary` to Documents | Transcript workspace and context route. |
| Add Session ownership and lifecycle to Themes | Session Themes workspace. |
| Session Report and Report Item tables with provenance/history | Report workspace. |
| Session-scoped search endpoint | Search this transcript. |
| Session-scoped chat plus conversation/message persistence | Ask this session. |
| Record/Common Component reference endpoints or feature-gated empty options | Session filters, form relationships, summary. |

### 9.2 V1 preservation

The existing `projects` table remains the Project aggregate; no Study rename is
needed for the current codebase. The migration must:

1. preserve every Project ID and record;
2. create one deterministic import Session for each Project that owns V1
   Documents;
3. attach those Documents to that Session without duplicating them;
4. attach existing Themes and Evidence to the appropriate migrated Session or
   retain explicit Project scope until the Session migration is complete;
5. be idempotent when its backfill is run more than once.

## 10. Audit exceptions requiring explicit treatment

These findings do not block Storybook component construction, but must not be
silently translated into production contracts:

1. The architecture pack still contains historical Study-centered migration
   text. React and the current backend use Project. The Domain Map needs a
   Project terminology amendment before database migration work begins.
2. Participant List Item Figma sources still expose optional Persona and
   Reference ID examples, and the expanded Session Participant Group includes
   Persona. The approved Participant Form no longer captures those fields.
   They remain hidden/dormant in V2 and are omitted from the canonical type.
3. The approved Session Participant Group no longer expands in the Session
   Overview. React exposes only the compact summary; detailed roles and
   organizations belong on the Participants destination.
4. The Route Map still describes Participant Detail as a read-only detail plus
   related Sessions. The approved page template is an editable Participant
   Form and controls the React route contract.
5. The Route Map still names moderator in Session header metadata. The approved
   Session Summary uses duration instead.
6. A Session Report source example still contains `First checkout study` in
   participant notes. Production fixtures must use `First checkout project`,
   and the source-only Figma copy should receive a small cleanup.
7. Existing primitive Storybook stories contain several old Study example
   strings. Those examples should be normalized to Project during the first
   implementation scope.
8. Figma processing examples sometimes say Themes and research objects are
   extracted automatically. Runtime copy must match actual behavior: transcript
   extraction completes before the user explicitly chooses Generate themes.

### 10.1 Figma source traceability

The following live source nodes anchor visual parity reviews. A node ID points
to the component set or public page-template set, not to a detached example.

| Contract family | Figma source node |
| --- | --- |
| Project Application Shell | `478:27471` |
| Project Card | `262:141` |
| Project Form | `267:513` |
| Project Summary | `274:37` |
| Participant List Item | `280:57` |
| Participant Form | `284:6236` |
| Participant Picker | `296:218` |
| Session List Item | `307:581` |
| Session Collection Item | `487:511` |
| Session Form | `312:7101` |
| Session Participant Group | `320:6533` |
| Session Summary | `500:32620` |
| Transcript Uploader | `325:6449` |
| Transcript Document Item | `331:6722` |
| Transcript Preview | `339:6682` |
| Transcript Search Result | `510:34561` |
| Theme Card | `533:37827` |
| Theme Evidence Detail | `537:37451` |
| Session Report Item | `550:39599` |
| Session Report | `554:42624` |
| AI Provider Settings Form | `440:1522` |
| Projects Index template | `354:9799` |
| Create/Edit Project template | `364:5626` |
| Project Overview template | `370:38458` |
| Participants Collection template | `371:28374` |
| Participant Detail template | `373:29889` |
| Sessions Collection template | `495:37913` |
| Session Detail workspace | `504:2972` |
| Transcript Detail template | `566:3239` |
| Shared Route State | `572:285` |
| Settings template | `449:2147` |

Formal `.figma.ts` Code Connect templates are not created by this audit. The
manual node-to-contract map is sufficient for implementation; formal Code
Connect can be evaluated separately after library publication and plan
eligibility are confirmed.

## 11. Implementation scopes and approval gates

### I1. Shared application foundation

Implementation status: Complete and approved on July 14, 2026.

- canonical domain types and fixtures;
- router skeleton and route boundaries;
- Global Header, navigation, Application Shell;
- Page Header, Section Navigation, Dropdown Menu;
- Entity Collection, Empty State, Metadata List, Processing Status,
  File Dropzone, Error Summary, and Shared Route State;
- Storybook and accessibility coverage.

### I2. Project and Settings

Implementation status: Complete and approved on July 14, 2026.

- Project Card, Form, Summary, Workflow Summary;
- AI Provider Settings Form extraction;
- 05.1, 05.2, 05.3, and 05.10 Storybook page compositions.
- live Project CRUD and AI settings route integration using normalized adapters;
- responsive, loading, empty, no-results, error, save, and test states;
- interaction, route, and automated accessibility coverage.

### I3. Participants

Implementation status: Complete and approved on July 14, 2026.

- Participant List Item, Form, and Picker;
- 05.4 and 05.5 page compositions;
- typed frontend API contracts for list, detail, create, update, and delete;
- deterministic Project-scoped MSW handlers with search and ownership-aware
  Not Found behavior;
- live collection, create, and edit route containers using TanStack Query;
- responsive, loading, empty, no-results, error, validation, submitting,
  request-failure, and Not Found coverage;
- API, interaction, route, and automated accessibility tests.

The I3 frontend contract uses the existing public Project terminology and API
facade:

```text
GET    /api/projects/{projectId}/participants?q={search}
POST   /api/projects/{projectId}/participants
GET    /api/projects/{projectId}/participants/{participantId}
PATCH  /api/projects/{projectId}/participants/{participantId}
DELETE /api/projects/{projectId}/participants/{participantId}
```

I7 now implements these endpoints and Project ownership checks. MSW remains the
deterministic Storybook and frontend-test boundary.

### I4. Sessions

Implementation status: Complete and approved on July 15, 2026.

- Session List Item, Collection Item, Form, Participant Group, and Summary;
- 05.6 Sessions Collection plus Session Overview and Participants compositions;
- typed Project-scoped Session API contracts for list, detail, create, update,
  and delete;
- deterministic MSW handlers supporting transcript-aware search plus Session
  type, transcript status, analysis status, date, Record, and Common Component
  filters;
- live collection, create, edit, Overview, and Participants route containers
  using TanStack Query;
- responsive populated, loading, empty, no-results, error, and Not Found states;
- API, interaction, route, and automated accessibility tests.

The component checkpoint preserves the approved Figma exceptions: Session
Participant Group exposes the compact summary only, Duration appears under
Session details, and the second Session Summary section is named
Relationships. Session Form keeps separate date and time controls and combines
them only at the application/API adapter boundary.

The Participants route uses the canonical Participant, Role, Organization, and
Notes contract. It renders a responsive table at medium and larger widths and
stacked participant cards on small viewports; the removed Persona field is not
reintroduced.

The I4 frontend contract is:

```text
GET    /api/projects/{projectId}/sessions
POST   /api/projects/{projectId}/sessions
GET    /api/projects/{projectId}/sessions/{sessionId}
PATCH  /api/projects/{projectId}/sessions/{sessionId}
DELETE /api/projects/{projectId}/sessions/{sessionId}
```

List requests accept `q`, `type`, `transcript_status`, `analysis_status`,
`date`, `record_id`, and `common_component_id`. I7 now implements these filters
and ownership rules; MSW remains the deterministic Storybook/test boundary.

### I5. Transcript workspace

Implementation status: Complete and approved on July 15, 2026.

- Transcript Uploader, Document Item, Preview, Search Result;
- Transcript tab and 05.8 Transcript Detail compositions.
- typed Session-scoped Document, retrieval search, and source-context API
  contracts with normalized domain adapters;
- deterministic MSW handlers for list, upload, processing retry, primary
  transcript selection, delete, retrieval search, and transcript context;
- live Transcript child-route and Transcript Context route containers using
  TanStack Query;
- empty, selected-file, uploading, request-error, processing, ready, failed,
  search-results, no-results, viewing, unavailable, loading, and recoverable
  error states;
- interaction, API, route, and automated accessibility coverage.

Search remains retrieval-only: it returns source excerpts, speakers, transcript
locations, and relevance, then opens a surrounding transcript context. It does
not synthesize an answer. Synthesis remains the responsibility of Ask this
session in I6.

The I5 frontend contract is:

```text
GET    /api/projects/{projectId}/sessions/{sessionId}/documents
POST   /api/projects/{projectId}/sessions/{sessionId}/documents
GET    /api/projects/{projectId}/sessions/{sessionId}/documents/{documentId}
POST   /api/projects/{projectId}/sessions/{sessionId}/documents/{documentId}/process
POST   /api/projects/{projectId}/sessions/{sessionId}/documents/{documentId}/primary
DELETE /api/projects/{projectId}/sessions/{sessionId}/documents/{documentId}
GET    /api/projects/{projectId}/sessions/{sessionId}/documents/{documentId}/search?q={query}
GET    /api/projects/{projectId}/sessions/{sessionId}/documents/{documentId}/context/{resultId}
```

I7 now implements these Session-owned document, processing, retrieval, context,
and storage contracts. MSW remains the deterministic Storybook/test boundary.

### I6. Synthesis workspaces

Implementation status: Complete and approved on July 15, 2026.

- Theme Card and Evidence Detail;
- Session Report Item and Report;
- Ask this session;
- Themes, Report, and Ask child-route compositions.

The I6 implementation adds normalized domain adapters and keeps the existing V1
Project-level Theme and Chat APIs intact. Theme Cards present concise evidence
previews; complete supporting evidence opens Theme Evidence Detail or transcript
context rather than expanding every card. Session Report sections follow the
canonical order: Session Information, Session Participants, Executive Summary,
Requirements, Decisions, Action Items, Open Questions, Key Insights, and
Detailed Notes.

Ask this session is synthesis scoped to one Session. It persists conversation
turns in the frontend contract and renders grounded citations that open the same
Transcript Context route used by retrieval-only Search this transcript. Search
and Ask remain separate interactions and endpoints.

The I6 frontend contract is:

```text
GET   /api/projects/{projectId}/sessions/{sessionId}/themes
POST  /api/projects/{projectId}/sessions/{sessionId}/themes/generate
PATCH /api/projects/{projectId}/sessions/{sessionId}/themes/{themeId}

GET   /api/projects/{projectId}/sessions/{sessionId}/report
POST  /api/projects/{projectId}/sessions/{sessionId}/report/generate
PATCH /api/projects/{projectId}/sessions/{sessionId}/report
POST  /api/projects/{projectId}/sessions/{sessionId}/report/revisions

GET   /api/projects/{projectId}/sessions/{sessionId}/conversations
POST  /api/projects/{projectId}/sessions/{sessionId}/conversations/ask
```

I7 now implements the persistence, generation, provenance, revision, citation,
and nested ownership contracts. Deterministic MSW handlers remain the
Storybook/frontend-test boundary.

### I7. Backend integration and migration

Implementation status: Approved on July 15, 2026 after manual acceptance fixes.

- additive database migration for Participants, Sessions, Session membership,
  Session Reports, persisted Conversations, and citations;
- deterministic UUIDv5 `Imported research` Session per V1 Project with
  Documents, protected by a unique migration marker;
- idempotent V1 backfill that preserves existing Project, Document, Chunk,
  Theme, and ThemeEvidence IDs, counts, content, and relationships;
- Project/Session ownership checks on Participants, Sessions, transcripts,
  Themes, Reports, revisions, conversations, and citation context;
- live frontend routes use the real HTTP clients; MSW is confined to Storybook
  and automated frontend tests;
- the legacy Project document API remains a compatibility facade and assigns
  new uploads to the same deterministic imported Session;
- isolated migration replay and backend integration suite verify the contract.

### I8. Final implementation QA

Implementation status: Approved on July 15, 2026.

- Figma parity at Desktop, Tablet, and Mobile;
- Storybook a11y checks and interaction tests;
- component/unit, API, migration, and end-to-end tests;
- keyboard, focus, loading, error, empty, no-results, and Not Found behavior;
- stop for approval before the next vertical slice.

Verification evidence:

- 72 Storybook story files compile in the production Storybook build, with the
  a11y addon configured to treat violations as errors;
- 140 frontend component, interaction, route, API, and axe accessibility tests
  pass across 36 test files;
- 20 backend integration, ownership, API, and migration-contract tests pass;
- the isolated V1-to-V2 migration replay preserves IDs, counts, ownership, and
  relationships and passes a second idempotent execution;
- the V2 Playwright golden path creates a Project, Participant, and Session;
  uploads, polls, downloads, searches, and opens transcript context; generates
  Themes and a Session Report; marks the report reviewed; and asks a cited
  Session-scoped question;
- the responsive Playwright gate verifies the shared `100rem` header and shell
  alignment at Desktop, mobile navigation at Tablet and Mobile, absence of
  horizontal overflow, Escape dismissal, and skip-link focus transfer;
- loading, empty, no-results, recoverable error, Not Found, keyboard focus, and
  responsive states remain covered by the component and route suites.

## 12. Definition of done

Each component or page is complete only when:

- its React props match this contract map;
- its stories cover approved data and responsive states;
- interaction states derive from native behavior rather than visual props;
- Storybook a11y reports no errors;
- keyboard order and focus restoration are verified;
- component or interaction tests cover behavior that can regress;
- API-dependent stories use MSW and deterministic fixtures;
- the implementation passes build, tests, Storybook build, and visual review;
- the user approves the scope before the next scope begins.
