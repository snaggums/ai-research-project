# Sprint 8 Research Object Inventory

Status: Proposed for approval  
Scope: Components to design and normalize before Sprint 8 implementation

## 1. Purpose

Sprint 8 introduces the first product-specific layer above the approved Sky AIR
design system. These are Research Object components: reusable representations
of Project, Participant, Session, and transcript Document concepts. `Study` may
remain an internal migration/entity term, but it is not used in new interface
labels or component specifications.

The order is mandatory:

1. Confirm existing design-system coverage and fill only blocking primitive gaps.
2. Design Research Object components in Figma.
3. Approve component anatomy, properties, states, and responsive behavior.
4. Normalize component contracts in Storybook and React.
5. Compose approved components into page templates.
6. Approve page templates before implementing the vertical slice.

## 2. Existing design-system dependencies

Reuse the normalized components already implemented where appropriate:

- Button, Icon Button, Link, and Button Set;
- Input Field, Textarea Field, Select Field, Multi-select Field, Search Field,
  and Date Field;
- Checkbox, Radio, Toggle, Badge, Chip, Tooltip, Alert, Spinner, Progress, and
  Tabs;
- Avatar, Accordion, Breadcrumbs, Card, Dialog, Notifications, and other
  approved Tier 2 components.

All product components use canonical `--air-*` tokens, Lucide icons, the
approved light-only theme, and `color/interaction/focus` focus treatment.
Icons retain a canonical 24 by 24 component frame with Scale constraints.
Consuming controls set the rendered instance size; small Icon Buttons use a
centered 16 by 16 Icon instance rather than separate 16 px icon variants.

## 3. Blocking reusable gaps

These gaps should be resolved before Research Object components are finalized.
They are reusable system components, not Project-specific product objects.

| Component | Purpose | Required behavior |
| --- | --- | --- |
| `AppShell` | Global and active-Project structure | Reusable Global Header, Global Navigation, Project Navigation, main landmark, responsive navigation, skip link, and active-Project route state. |
| `PageHeader` | Page identity and actions | Title, optional description, breadcrumbs/back link, responsive actions. |
| `SectionNavigation` | Local section or tab navigation | Current-page semantics, keyboard access, overflow behavior. |
| `DropdownMenu` | Contextual actions | Keyboard navigation, Escape/outside close, focus restoration, destructive separation. |
| `EntityCollection` | Reusable list shell | Heading, count, actions, loading, empty, error, optional search/filter slot. |
| `EmptyState` | No-data guidance | Icon, title, explanation, optional primary and secondary actions. |
| `FileDropzone` | Transcript intake | Browse and drag/drop, file requirements, keyboard equivalent, rejection feedback. |
| `ProcessingStatus` | Asynchronous document status | Uploaded, processing, complete, failed; label and icon, not color alone. |
| `MetadataList` | Compact labeled values | Responsive label/value layout and semantic description-list markup. |
| `ErrorSummary` | Form submission errors | Links to invalid fields and receives focus after failed submission. |

`EntityCollection` may render Cards on narrow viewports and structured rows on
wide viewports. A generic enterprise Data Table is not required unless the
approved page layouts demonstrate a real tabular need.

### Active Project shell contract

When no Project is active, the shell exposes the Projects destination. When a
Project is active, the navigation exposes Back to Projects, Project identity,
Overview, Participants, Sessions, and Ask this project. Both shell component
sets compose the reusable `Global Header` and `Global Navigation`; active
Project navigation is supplied by the reusable `Project Navigation` set.

Project-wide retrieval search is deferred to V3. The `Global Header` retains a
`Show Project search` boolean for that future capability, but it defaults to
false in V2 across Desktop, Tablet, and Mobile. Route-owned search remains in
scope for Sessions collections and transcripts.

The active-Project navigation replaces the horizontal Project-level Section
Navigation. Session detail retains its own local tab navigation.

## 4. Research Object components

### 4.1 Project Card

Component: `ProjectCard`

Purpose: represent a Project in the Projects collection.

Anatomy:

- Project name;
- optional description;
- Participant count;
- Session count;
- transcript processing summary when available;
- last updated date;
- open action;
- overflow actions for edit and delete when permitted.

Figma properties:

- `Description`: boolean;
- `Counts`: boolean;
- `Processing status`: boolean;
- `Actions`: boolean;
- visual state examples: Default, Hover, Active, Keyboard Focus, Disabled only
  if a real disabled use case is approved.

React contract:

```ts
type ProjectCardProps = {
  project: ProjectSummary;
  href: string;
  onEdit?: () => void;
  onDelete?: () => void;
};
```

The card has one primary navigation target. Nested action buttons must not
create invalid nested interactive elements. Keyboard focus surrounds only the
active target.

### 4.2 Project Form

Component: `ProjectForm`

Purpose: shared Create and Edit Project form content.

Fields:

- Project name - required;
- description - optional.

States:

- Create and Edit modes;
- pristine;
- validation error;
- submitting;
- request failure;
- success navigation handled by the route.

The form uses the approved three-button set only when a third action has a real
workflow meaning. Default Project creation uses Cancel and Continue/Create.

### 4.3 Project Summary

Component: `ProjectSummary`

Purpose: orient the researcher on the Project overview.

Anatomy:

- Project name and description;
- Participant and Session summaries;
- transcript processing summary;
- next recommended action;
- optional recent-activity slot for later expansion.

This component must remain useful with zero Participants and zero Sessions.

### 4.4 Participant List Item

Component: `ParticipantListItem`

Purpose: represent a Participant in collections and selection contexts.

Anatomy:

- Avatar or initials;
- full name derived from required first and last name;
- optional reference ID;
- optional email address and phone number in expanded metadata contexts;
- optional role and Organization;
- optional persona;
- Session count;
- optional note excerpt;
- navigation target;
- overflow actions.

React contract:

```ts
type ParticipantListItemProps = {
  participant: ParticipantSummary;
  href: string;
  onEdit?: () => void;
  onDelete?: () => void;
};
```

Participant records are Project-scoped. The UI must not imply that they are
global identities or shared across Projects.

### 4.5 Participant Form

Component: `ParticipantForm`

Fields:

- first name - required;
- last name - required;
- email address - optional;
- Organization - optional;
- role - optional;
- related Records - optional multi-select;
- researcher notes - optional.

The canonical form order groups standard fields into two-column, full-width
rows. Researcher notes use one full-width textarea row. Related Records use the
approved Multi-select Field.

States match `ProjectForm`. Delete behavior requires confirmation and must explain
that Session-Participant relationships are removed while the Sessions remain.

V3 follow-up: add a Project-scoped Participant CSV import workflow with column
mapping, required-field validation, duplicate review, and an import result
summary. CSV import is not part of the current V2 component or page scope.

### 4.6 Participant Picker

Component: `ParticipantPicker`

Purpose: add or remove multiple Project Participants from a Session.

Composition:

- approved Multi-select Field;
- selected Participant chips/list;
- optional inline Add Participant action;
- no-results state.

React contract:

```ts
type ParticipantPickerProps = {
  participants: ParticipantOption[];
  value: string[];
  onValueChange: (participantIds: string[]) => void;
  onAddParticipant?: () => void;
  error?: string;
  disabled?: boolean;
};
```

Only Participants belonging to the current Project may be selected.

### 4.7 Session List Item

Component: `SessionListItem`

Purpose: represent a Session in the Sessions collection and Project overview.

Anatomy:

- Session title;
- Session type;
- date/time when present;
- Participant avatars/count;
- Document count;
- transcript processing summary;
- primary transcript indicator when present;
- navigation target and overflow actions.

React contract:

```ts
type SessionListItemProps = {
  session: SessionSummary;
  href: string;
  onEdit?: () => void;
  onDelete?: () => void;
};
```

Visual examples cover no transcript, processing, ready, and failed. Processing
state is data, not a simulated interaction-state prop.

### 4.8 Session Form

Component: `SessionForm`

Fields:

- title - required;
- Session type - required;
- date - optional;
- time - optional;
- description - optional;
- Participants - optional multi-select.

Initial Session type options:

- Interview;
- Usability test;
- Focus group;
- Working session;
- Design critique;
- Other.

Date and time use separate controls in Figma and the React contract. The
application layer combines them into one optional Session timestamp. On narrow
layouts, the controls stack in date-then-time keyboard and reading order.

### 4.9 Session Participant Group

Component: `SessionParticipantGroup`

Purpose: show and manage Session Participants on Session detail.

Anatomy:

- Participant avatars/names;
- Role;
- Organization;
- Persona;
- Notes;
- count;
- Edit participants action;
- empty state.

The compact display may collapse excess Participants into a `+N` summary while
retaining an accessible full-name description. The expanded Session Participants
presentation uses the canonical columns Participant, Role, Organization,
Persona, and Notes.

Figma contract:

- layouts: Compact and Expanded;
- states: Populated, Empty, Loading, and Error;
- properties: Heading, Count label, and Show edit action;
- Loading and Error suppress participant-management actions until data is
  available;
- Empty retains the Add participants action.

### 4.10 Transcript Uploader

Component: `TranscriptUploader`

Purpose: upload the only supported Sprint 8 Document type.

Composition:

- `FileDropzone`;
- accepted-file guidance for the V1-supported `.txt`, `.md`, `.docx`, and `.pdf`
  formats; PDF support remains embedded-text extraction only and does not add
  OCR;
- upload progress/status;
- rejection and request-error messages;
- optional cancel/retry when supported by the backend.

The visible language says Transcript even though the underlying object is a
Document. Unsupported future Document types must not appear as enabled options.

Figma contract:

- states: Empty, File Selected, Uploading, Processing, Complete, Rejected, and
  Request Error;
- properties: Heading and Show PDF guidance;
- Cancel upload is available only while uploading;
- Retry upload preserves the selected file after a request failure;
- file rejection and request failure remain distinct states;
- selected-file examples retain filename, format, and size through the
  positive and retry paths.

### 4.11 Transcript Document Item

Component: `TranscriptDocumentItem`

Purpose: represent one transcript Document in a Session.

Anatomy:

- filename;
- file metadata when useful;
- processing status;
- uploaded/processed timestamp;
- primary transcript indicator/action;
- view extracted text action when complete;
- retry action when failed;
- delete action.

React contract:

```ts
type TranscriptDocumentItemProps = {
  document: TranscriptDocumentSummary;
  isPrimary: boolean;
  href: string;
  onSetPrimary?: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
};
```

Variants/examples:

- Uploaded;
- Processing;
- Complete;
- Failed;
- Complete + Primary;
- Failed + Retry in progress.

The status is conveyed with text and icon in addition to color.

Figma contract:

- lifecycle values: Uploaded, Processing, Complete, Complete Primary, Failed,
  and Retrying;
- properties: Filename, File metadata, Timestamp, Show metadata, Show
  timestamp, and Show actions;
- Uploaded means transfer is complete and the Document is waiting for
  processing;
- only Complete exposes extracted text and Set as primary;
- Complete Primary removes Set as primary and displays the semantic primary
  badge;
- Failed exposes Retry, while Retrying communicates progress and disables the
  retry action.
- Delete uses the gray-subtle Icon Button with a centered 16 by 16 instance of
  the shared Lucide `Trash2` icon in `color/icon/primary`. React requires the
  accessible name `Delete transcript`.

### 4.12 Transcript Preview

Component: `TranscriptPreview`

Purpose: display extracted transcript text without editing the source.

Anatomy:

- filename and source metadata;
- readable text region;
- empty-extraction warning;
- processing/failed alternatives;
- source actions supplied through a slot.

Long content requires semantic document structure and browser scrolling; it must
not be placed in a fixed-height region that traps keyboard or screen-reader
navigation.

Figma contract:

- states: Ready, Empty Extraction, Processing, and Failed;
- properties: Filename, Source metadata, and Show source actions;
- Ready uses auto-height speaker/time blocks as the semantic document example;
- Empty Extraction retains Download source;
- Processing suppresses source actions;
- Failed exposes Download source and Retry extraction;
- Open source and Download source use Gray Subtle buttons; Retry extraction
  remains the Brand action;
- production source actions are supplied through a React slot.

### 4.13 Project Workflow Summary

Component: `ProjectWorkflowSummary`

Purpose: communicate Project setup progress without implying that future synthesis
sprints are available.

Sprint 8 steps:

1. Create Project;
2. Add Participants;
3. Add Sessions;
4. Upload Transcripts.

The component may use Progress and status elements, but it must not display
Generate Themes as an enabled action until Sprint 9 begins.

Figma contract:

- progress values: 25, 50, 75, and 100;
- properties: Heading, Description, Show description, and Show action;
- repeating step statuses: Complete, Current, and Upcoming;
- next actions: Add participants, Add session, Upload transcript, and View
  sessions;
- Progress remains at its canonical 300 px width so each value indicator stays
  proportional in Figma;
- Generate Themes is absent from every Sprint 8 variant.

### 4.14 Session Summary

Component: `SessionSummary`

Purpose: present stable Session metadata near the top of the Session workspace
without repeating the Session title already supplied by the Page Header.

Figma contract:

- layouts: Default and Compact;
- Session details: type, date, and duration;
- Relationships: related Records and related Common Components;
- `Show relationships` may hide the Relationships group where the
  surrounding route already presents that context;
- Default supports the Desktop and Tablet workspace; Compact stacks metadata
  for Mobile;
- metadata is composed from the approved `Metadata List` component and uses
  AIR semantic variables and Inter typography.

### 4.15 Transcript Search Result

Component: `TranscriptSearchResult`

Purpose: display one retrieval result from a Transcript with enough source
context for a researcher to judge relevance before opening the full passage.

Figma contract:

- layouts: Default and Compact;
- source metadata: speaker, transcript location, and relevance;
- one concise source excerpt with natural wrapping;
- action label: Open transcript context;
- retrieval only: the component never presents a synthesized answer;
- reusable in Session-scoped and Project-scoped search results.

### 4.16 Theme Card

Component: `ThemeCard`

Purpose: present one generated or reviewed Theme as a concise summary without
expanding every supporting excerpt in the Session workspace.

Anatomy:

- Theme name;
- lifecycle status;
- synthesis summary;
- provenance and confidence;
- supporting-evidence count and one concise excerpt preview;
- Review theme, Edit, and Reject actions when appropriate.

Figma contract:

- page: `04.26 Theme Card`;
- layouts: Default and Compact;
- statuses: AI Generated, Researcher Reviewed, Approved, and Rejected;
- properties: Theme name, Summary, Evidence preview, Show evidence, and Show
  actions;
- complete evidence remains collapsed and opens the Theme Evidence Detail view;
- compact headers fill the available width and wrap the Theme name without
  colliding with the status badge;
- status is communicated by text as well as semantic color.

### 4.17 Theme Evidence Detail

Component: `ThemeEvidenceDetail`

Purpose: review the full evidence supporting one Theme while preserving source
speaker, transcript location, relevance, and a direct path to transcript
context.

Anatomy:

- Theme name and synthesis;
- lifecycle provenance and confidence;
- evidence count;
- supporting evidence excerpts;
- Open transcript context action for each excerpt;
- Approve theme, Edit theme, and Reject theme actions.

Figma contract:

- page: `04.27 Theme Evidence Detail`;
- layouts: Default and Compact;
- properties: Theme name and Theme synthesis;
- evidence rows use the private reusable `.Theme Evidence Item` component;
- mobile content wraps without clipping and preserves source-to-action reading
  order;
- evidence details reflect existing Theme and Evidence records and do not add a
  new persistence schema.

### 4.28 Session Report Item and 4.29 Session Report - Figma designed

Components: `SessionReportItem`, `SessionReport`

Purpose: provide the reviewed bridge from a Transcript to Product Knowledge.

`SessionReportItem` provides concise, evidence-linked Requirement, Decision,
Action Item, Open Question, and Key Insight rows in Default and Compact layouts.
Each item exposes title, summary, evidence preview, evidence visibility, and
action visibility while retaining explicit AI provenance.

Canonical sections:

- Session Information;
- Session Participants;
- Executive Summary;
- Requirements;
- Decisions;
- Action Items;
- Open Questions;
- Key Insights;
- Detailed Notes.

Promotion follows Transcript to Session Report to Researcher Review, then into a
Record or Common Component Requirements, Decision Log, and Action Items.

Figma contract:

- page: `04.28 Session Report Item`;
- page: `04.29 Session Report`;
- item types: Requirement, Decision, Action Item, Open Question, Key Insight;
- layouts: Default and Compact;
- report lifecycle: AI Generated, Researcher Reviewed, Approved, Superseded;
- responsive workspace states: Empty, Generating, Populated, Error, Review;
- canonical section order is preserved at Desktop, Tablet, and Mobile;
- Session Participants use Participant, Role, Organization, and Notes columns;
- evidence actions use the specific label `Open transcript context`;
- Product Knowledge promotion remains non-interactive in this design scope.

The Figma component and Session Detail route composition are now designed.
Persistence, promotion behavior, React, Storybook, and backend implementation
remain deferred until a separate implementation assignment is approved.

V3 follow-up: the Session Participants section should support grouping by
Organization, with Participants who have no Organization shown in an explicit
`No organization` group.

## 5. Page-level compositions

These are templates assembled after the components above are approved:

| Template | Primary Research Object components |
| --- | --- |
| Projects index | `PageHeader`, `EntityCollection`, `ProjectCard`, `EmptyState` |
| Project Create/Edit | `PageHeader` or `Dialog`, `ProjectForm`, `ErrorSummary` |
| Project overview | `ProjectSummary`, `ProjectWorkflowSummary`, recent `SessionListItem` collection |
| Participants collection | `EntityCollection`, `ParticipantListItem`, `ParticipantForm` |
| Participant detail | `PageHeader`, `MetadataList`, related `SessionListItem` collection |
| Sessions collection | `EntityCollection`, `SessionListItem`, `SessionForm` |
| Session detail | `SessionSummary`, `SessionParticipantGroup`, `TranscriptUploader`, `TranscriptDocumentItem` collection |
| Transcript detail | `PageHeader`, `ProcessingStatus`, `TranscriptPreview` |

## 6. Responsive behavior

Use the existing Tailwind-aligned breakpoints unless Figma testing demonstrates
a component-specific need:

- Small: below 640 px;
- Medium: 640-1023 px;
- Large: 1024 px and above;
- Wide: 1280 px and above for maximum content-width decisions.

Required adaptations:

- forms use two full-width columns for rows and standard fields at medium and
  larger widths;
- textareas always span the full form width as a single-column row;
- when the viewport cannot support two readable columns, form fields stack in
  the same logical reading and keyboard order while continuing to fill the
  container;
- collection rows may become stacked Cards on small screens;
- page-header actions wrap or move into an accessible menu;
- route-driven Dialog forms become full-page forms when necessary;
- Project navigation condenses without hiding the current location;
- metadata labels and values stack when horizontal space is insufficient;
- filenames and descriptions truncate visually only when the full value remains
  available accessibly.

## 7. Accessibility requirements

All Sprint 8 Research Object components must meet the following before page
implementation:

- WCAG 2.2 AA minimum, retaining existing AAA text-contrast choices where the
  design system already provides them;
- `color/interaction/focus` on every keyboard-focusable element;
- focus around the active control only, not unrelated labels or whole text
  regions;
- logical DOM and tab order at every breakpoint;
- one primary page heading per route;
- collection and item semantics appropriate to list or table presentation;
- no status, selection, failure, or primary-transcript meaning conveyed by color
  alone;
- upload controls operable without drag-and-drop;
- live announcements for upload and processing state changes without repetitive
  screen-reader noise;
- validation messages programmatically connected to fields;
- destructive actions require confirmation and clearly name the affected object;
- Dialog focus trapping/restoration uses the approved Dialog contract;
- menu keyboard behavior and outside/Escape dismissal use the approved menu
  contract;
- reduced-motion preferences respected for progress and transitions;
- 44 by 44 CSS pixel targets where practical for touch actions.

## 8. Figma requirements

For each Research Object component:

- use existing Sky AIR variables and styles;
- use nested approved components instead of detached vectors or duplicated
  controls;
- use the single swappable Lucide Icon component;
- expose only meaningful boolean, text, instance-swap, and variant properties;
- order variants upper-left to lower-right, matching Figma's property list;
- document anatomy, content constraints, responsive behavior, and accessibility;
- include realistic short, long, empty, error, and processing content;
- avoid a visual `State` property in React contracts even when Figma provides
  state examples for review.

## 9. Storybook requirements

Each component receives:

- Docs with purpose, anatomy, API, accessibility, and usage guidance;
- default and populated examples;
- long-content and constrained-width examples;
- empty/loading/error/processing examples where applicable;
- interaction tests for menus, forms, selection, retry, and Dialog behavior;
- keyboard-focus examples;
- automated accessibility checks;
- a Figma parity comparison story when multiple component states are visually
  significant.

Storybook links and navigation examples must prevent default document navigation
when the story is intended only to demonstrate a component interaction.

## 10. React contract rules

- Components accept data objects and callbacks; they do not fetch their own data.
- Pages/features own React Query calls, mutations, routing, and orchestration.
- Native hover, active, focus-visible, and disabled behavior remains CSS-driven.
- Loading and processing are real data states, not pseudo-state controls.
- Components expose semantic HTML and refs where appropriate.
- Product components compose the normalized UI primitives and do not introduce
  parallel button, field, badge, or focus implementations.
- Destructive callbacks are distinct from navigation callbacks.
- Dates enter components as typed values and are formatted at the presentation
  boundary.
- Server identifiers are never used as visible labels when a human-readable name
  exists.

## 11. Sprint 8 design approval checklist

- [ ] Blocking reusable gaps are approved or explicitly deferred.
- [x] Project components are approved in Figma.
- [x] Participant components are approved in Figma.
- [x] Session components are approved in Figma.
- [x] Transcript Document components are approved in Figma.
- [x] Loading, empty, processing, failed, and destructive states are approved in the Research Object component set.
- [ ] Small, medium, large, and long-content behavior is approved.
- [ ] Storybook contracts match approved Figma properties and behavior.
- [ ] React contracts use normalized semantic APIs.
- [x] Figma accessibility and semantic-token review passes before page-template composition.
- [ ] All Sprint 8 page templates are approved before vertical-slice coding.
- [ ] Future Sprint 9-14 actions are absent or clearly non-interactive.

### Research Object Figma completion note

The `04 Research Objects` overview indexes the approved structure, workflow,
Project, Participant, Session, Transcript, and Project Workflow Summary components.
Final component QA confirmed consistent Project/Session terminology, expected
variant contracts, private helper naming, Lucide icon scaling, and
`color/interaction/focus` use. Research Object-owned literal white fills were
normalized to `color/bg/surface`. The later Session Detail reporting checkpoint
added `Session Report Item` and `Session Report` as Figma-only Research Objects;
their React, Storybook, persistence, and promotion contracts remain deferred.
