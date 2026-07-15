# Sprint 8 Page Template Inventory

Status: Figma page templates approved July 14, 2026  
Scope: Responsive route compositions required before Sprint 8 implementation

## Template order

1. Projects index;
2. Create/Edit Project;
3. Project overview;
4. Participants collection;
5. Participant detail;
6. Sessions collection;
7. Session detail workspace;
8. Transcript detail/context;
9. shared loading, error, Not Found, and destructive-confirmation references;
10. Settings.

Exports are intentionally outside the approved Sessions workspace scope.

## Shared form layout convention

- At medium and larger widths, form rows and standard fields use two columns
  and fill the available container width.
- Textareas occupy their own single-column row and fill the available container
  width.
- At widths that cannot support two readable columns, fields stack into one
  full-width column without changing their logical reading or keyboard order.

## Shared shell component architecture

- `Global Header` uses `Context` (Workspace, Project) and `Viewport` (Desktop,
  Tablet, Mobile) axes. It owns Workspace name, Project name, notifications,
  and the `Show Project search` boolean. Project search defaults to false.
- `Project Navigation` uses `Viewport` (Desktop, Tablet) and `Active item`
  (Overview, Participants, Sessions, Ask this project) axes.
- `Global Navigation` uses `Context` (Workspace, Project) and `Viewport`
  (Desktop, Tablet) axes. Its Project variants nest `Project Navigation`.
- `Application Shell` and `Application Shell/Project` contain instances of
  these shared components instead of duplicated header or navigation frames.
- Project Overview uses Overview as the active item; Participants Collection
  and Participant Detail use Participants; Sessions Collection and Session
  Detail use Sessions.

## 05.1 Projects Index

Route: `/projects`  
Figma component: `Projects Index`

Purpose: workspace landing page for finding, creating, and resuming Projects.

Composition:

- `Application Shell`;
- `Page Header` with one Create project action;
- page-owned collection toolbar using the approved Search Field;
- four approved `Project Card` instances in populated examples;
- approved `Spinner`, `Empty State`, `Alert`, and Button components for data
  outcomes.

Figma axes:

- Viewport: Desktop, Tablet, Mobile;
- State: Populated, Loading, Empty, Error.

Responsive behavior:

- Desktop and tablet use a two-column Project grid;
- mobile uses a single-column Project list;
- mobile uses the compact Page Header and hides its description;
- the public frames document viewport dimensions of 1440 by 900, 1024 by 768,
  and 390 by 844;
- overflowing results scroll in the application rather than extending the
  viewport frame.

Accessibility and behavior:

- one visible page heading;
- logical order is global navigation, global actions, page heading/action,
  collection controls, then Project cards or the current data-state message;
- loading text is an application live-status message;
- errors preserve data and expose Retry;
- no result meaning relies on color alone;
- focus treatments remain inherited from approved components and use
  `color/interaction/focus`.

Approval: Approved.

## 05.2 Create/Edit Project

Route: `/projects/new`, `/projects/:projectId/edit`  
Figma component: `Create Edit Project`

Purpose: create and edit Project flow with route-driven composition:

- Desktop and tablet: modal presentation from populated Projects Index background;
- Mobile: full-page Project Form inside approved Application Shell.

Composition:

- shared `Application Shell` in mobile variant;
- `Projects Index` as inert background source on desktop/tablet;
- modal wrapper with focus and accessibility layering;
- routed `Project Form` variants for create and edit contexts.

States:

- Mode: Create, Edit;
- State: Pristine, Validation Error, Submitting, Request Failure.

Viewport:

- Desktop, Tablet, Mobile.

Behavior:

- invalid fields expose validation summary and field-level errors;
- request failure keeps entered values visible and provides Retry/Update actions;
- cancel returns to the Projects Index route;
- success routes to the Project overview destination.

Responsive notes:

- desktop and tablet dialogs maintain centered frame and inset spacing,
- mobile full-screen page keeps a compact shell and full-content scroll behavior.

Figma status: complete; included in final QA July 14, 2026.

## 05.3 Project Overview

Route: `/projects/:projectId/overview`  
Figma component: `Project Overview`

Purpose: default landing view inside a Project that summarizes its current state and
offers the most useful next action.

Composition:

- active-Project `Application Shell/Project` at every viewport;
- Project-level `Page Header` with optional description and actions;
- `Section Navigation` with Overview selected;
- `Project Summary` component in populated and empty variants;
- `Project Workflow Summary` component showing progress through the Project setup journey;
- `Session List Item` collection via approved `Entity Collection` as Recent Sessions.

Figma axes:

- Viewport: Desktop, Tablet, Mobile;
- State: Populated, No Sessions, Loading, Error, Not Found.

Viewport behavior:

- desktop and tablet use a two-column shell with the main content and side rail
  spacing retained from prior templates;
- mobile uses single-column stacking and narrower side paddings;
- desktop and tablet show both summary and workflow sections side-by-side where
  approved;
- mobile stacks summary and workflow sections;
- collection controls remain above session rows and keep the same spacing scale as
  approved Session collection variants.

Responsive behavior:

- no-state message and primary actions preserve semantic order;
- the Project title remains the unique page heading;
- Empty state retains one visible action to Add Sessions and one to Add
  Participants;
- errors preserve partially loaded summary and session data when possible.

Accessibility and behavior:

- focus order is global shell, page heading/action region, section nav,
  summary, workflow, then sessions;
- empty states are not conveyed only by color;
- keyboard focus remains on Project controls only and not on nested labels;
- loading and error states reflect real data conditions and use approved component
  treatment.

Figma status: complete; included in final QA July 14, 2026.

## 05.4 Participants Collection

Route: `/projects/:projectId/participants`  
Figma component: `Participants Collection`

Purpose: workspace for managing who is in a Project and for adding new Participants.

Composition:

- active-Project `Application Shell/Project` at every viewport;
- Project-level `Section Navigation` with Participants selected;
- Project `Page Header` with Create/Add action in desktop/tablet and compact header
  controls on mobile;
- `Entity Collection` containing approved `Participant List Item` rows;
- collection toolbar with Project-scoped search and optional sort;
- compact `Pagination` and action-row controls where viewport allows.

Figma axes:

- Viewport: Desktop, Tablet, Mobile;
- State: Populated, Empty, Loading, Error, Not Found.

Viewport behavior:

- desktop and tablet use wide collection rows with dense spacing;
- mobile uses a single-column list presentation and tighter controls;
- the shell maintains the same Project-level information flow as other templates:
  shell → Project identity/navigation → section nav → collection content.

Responsive behavior:

- Add Participant action is always present in states where a collection container
  is valid;
- empty state can surface one primary action to create first participant;
- error states preserve filters/search context where possible and expose Retry;
- No result/No sessions language is not conveyed by color alone.

Accessibility and behavior:

- one visible page heading;
- collection row focus is on each action target only;
- list structure remains semantic and follows the approved keyboard order:
  shell, page header/action region, section nav, collection controls, rows.

Figma status: complete; included in final QA July 14, 2026.

## 05.5 Participant Detail

Route: `/projects/:projectId/participants/:participantId`  
Figma component: `Participant Detail`

Purpose: edit one Project Participant using the approved Participant Form.
The example content uses Alex Morgan rather than implementation placeholders.

Figma axes:

- Viewport: Desktop, Tablet, Mobile;
- State: Pristine, Validation Error, Submitting, Request Failure, Not Found.

The Not Found composition retains Project route chrome, explains the missing
Participant, and uses an ArrowLeft action labeled `Back to participants`.

Figma status: complete; included in final QA July 14, 2026.

## 05.6 Sessions Collection

Route: `/projects/:projectId/sessions`  
Figma component: `Sessions Collection`

Purpose: organize interviews, usability tests, and working sessions in the
active Project.

Composition:

- active-Project `Application Shell` with Project search hidden for V2;
- Page Header titled Sessions with description and New session action;
- Search Field labeled Search sessions and transcripts;
- filters for Session type, transcript status, analysis status, date, Record,
  and Common Component;
- detailed Session Collection Item rows;
- loading, empty, no-results, and error outcomes.

Figma axes: Viewport Desktop, Tablet, Mobile; State Populated, Loading, Empty,
No Results, Error.

Responsive behavior:

- desktop presents the six filters in a three-column grid;
- tablet presents the same filters in a two-column grid;
- mobile preserves all six filters behind a single Filters action that opens a
  drawer;
- compact mobile Session Collection Item titles use Heading/H4 so complete
  titles remain visible;
- the active Project shell marks Sessions as the active navigation item;
- Project-wide global search is reserved for V3, while this route-specific
  Session search remains available.

State behavior:

- Loading communicates progress without removing the current search and filter
  context;
- Empty offers New session;
- No Results offers Clear filters;
- Error explains that Project data was not changed and offers Retry.

Figma status: complete and awaiting approval. React and Storybook remain out of
scope for this checkpoint.

## 05.7 Session Detail

Route: `/projects/:projectId/sessions/:sessionId`  
Figma component: `Session Detail`

Purpose: one Session workspace with header metadata and local navigation.

Tabs: Overview, Participants, Transcript, Themes, Session Report, Ask this
session. Session metadata includes title, type, date, duration, Records, and
Common Components. Duration belongs to Session details; Records and Common
Components belong to Relationships.

The Transcript tab carries upload, processing, view, retry, delete, and Search
this transcript retrieval. Themes use concise Theme Cards and open evidence in
a detail view or Context Drawer. Ask this session provides suggested questions,
conversation history, composer, cited answers, and transcript-context links.

Checkpoint 1 Figma status: approved July 14, 2026.

Checkpoint 1 includes:

- the reusable `Session Summary` component in Default and Compact layouts;
- `Session Detail` and private `.Session Detail Content` component sets with
  `Viewport` Desktop, Tablet, Mobile and `Tab` Overview, Participants axes;
- populated Overview and Participants content at all three breakpoints;
- the complete six-tab Session workspace navigation in every source variant;
- horizontal tab overflow on Mobile;
- active Project navigation with Sessions selected on Desktop and Tablet;
- Project search hidden through the `Show Project search` property and deferred
  to V3;
- Project, Session, Record, and Common Component terminology aligned with the
  approved functional scope.

Checkpoint 2 Figma status: approved July 14, 2026.

Checkpoint 2 includes:

- the reusable `Transcript Search Result` component in Default and Compact
  layouts, with speaker, transcript location, relevance, excerpt, and the
  specific action `Open transcript context`;
- the private `.Session Transcript Workspace` component set with `Viewport`
  Desktop, Tablet, Mobile and `State` Empty, Processing, Ready, Search Results,
  Error, Viewing axes;
- transcript upload, processing, complete-primary, retry/delete, preview, and
  retrieval-result compositions built from approved Research Objects;
- `Search this transcript` and `Search transcript` labels, replacing the V1
  `Search extracted text` terminology;
- three responsive Transcript variants added to `.Session Detail Content` and
  to the public `Session Detail` template;
- Transcript selected in the six-tab Session workspace while Sessions remains
  selected in the active Project navigation;
- compact mobile retrieval results and responsive, full-width transcript
  controls without unintended clipping;
- retrieval-only behavior documented separately from the synthesized
  `Ask this session` experience.

Checkpoint 3 Figma status: approved July 14, 2026.

Checkpoint 3 includes:

- the reusable `Theme Card` component in Default and Compact layouts with AI
  Generated, Researcher Reviewed, Approved, and Rejected statuses;
- concise evidence previews on cards rather than expanding every excerpt by
  default;
- the reusable `Theme Evidence Detail` component with speaker, transcript
  location, relevance, full excerpt, and `Open transcript context` actions;
- the private `.Session Themes Workspace` component set with `Viewport`
  Desktop, Tablet, Mobile and `State` Empty, Generating, Populated, Error,
  Review Detail axes;
- Generate themes, review, edit, reject, approve, retry, and return-to-list
  compositions built from approved AIR primitives and Research Objects;
- three responsive Themes variants added to `.Session Detail Content` and to
  the public `Session Detail` template;
- Themes selected in the six-tab Session workspace while Sessions remains
  selected in active Project navigation;
- compact mobile Theme Card headers that wrap without colliding with lifecycle
  badges and a full evidence-detail layout without clipping;
- semantic AIR variables only, including `color/bg/canvas` for workspace
  backgrounds and inherited `color/interaction/focus` for controls.

Checkpoint 4 Figma status: approved July 14, 2026.

Checkpoint 4 includes:

- the reusable `Session Report Item` component in Default and Compact layouts
  for Requirement, Decision, Action Item, Open Question, and Key Insight;
- the reusable `Session Report` component in Default and Compact layouts with
  AI Generated, Researcher Reviewed, Approved, and Superseded lifecycle states;
- the canonical report order: Session Information, Session Participants,
  Executive Summary, Requirements, Decisions, Action Items, Open Questions,
  Key Insights, and Detailed Notes;
- Participant, Role, Organization, and Notes columns without the removed
  Persona field or the V3 organization-grouping behavior;
- evidence-linked report items with `Open transcript context` and explicit AI
  provenance;
- the private `.Session Report Workspace` component set with `Viewport`
  Desktop, Tablet, Mobile and `State` Empty, Generating, Populated, Error,
  Review axes;
- three responsive Session Report variants added to `.Session Detail Content`
  and to the public `Session Detail` template;
- Session Report selected in the six-tab workspace, including a mobile tab-strip
  position that keeps the active tab visible;
- no interactive Product Knowledge promotion in this checkpoint.

Checkpoint 5 Figma status: complete; included in final QA July 14, 2026.

Checkpoint 5 includes:

- the private `.Ask This Session Workspace` component set with `Viewport`
  Desktop, Tablet, Mobile and `State` Empty, Answered, Loading, Error axes;
- suggested questions, persisted-conversation examples, a prompt composer,
  grounded answers, citations, and `Open transcript context` actions;
- explicit Session-scoped synthesis, separate from retrieval-only Search this
  transcript behavior;
- three responsive Ask this session variants added to `.Session Detail
  Content` and to the public `Session Detail` template;
- Ask this session selected in the six-tab workspace while Sessions remains
  selected in active Project navigation;
- complete mobile wrapping and vertical growth without clipped answers,
  citations, or composer controls.

React, Storybook, persistence, backend behavior, and Product Knowledge
promotion remain out of scope until the Figma page-template package is
approved.

## 05.8 Transcript Detail / Context

Route: `/projects/:projectId/sessions/:sessionId/documents/:documentId`  
Figma component: `Transcript Detail`

Purpose: show source transcript context opened from retrieval results, Theme
evidence, or citations. It preserves speaker, transcript location, source
excerpt, and processing/source metadata.

Figma status: approved July 14, 2026.

Composition:

- active-Project `Application Shell/Project`, with Sessions selected in Project
  navigation and Project search hidden for V2;
- `Page Header` titled Transcript context with route breadcrumbs;
- source identity and processing metadata for the primary transcript;
- source actions for Open source and Download source;
- a private `.Transcript Context Passage` component in Default and Compact
  layouts;
- surrounding transcript turns plus a focused, evidence-linked passage;
- approved `Spinner`, `Alert`, Brand Button, and Gray Subtle Button components
  for route outcomes.

Figma axes:

- Viewport: Desktop, Tablet, Mobile;
- State: Ready, Loading, Unavailable, Error.

Responsive behavior:

- desktop and tablet preserve the complete Project-to-document breadcrumb;
- mobile reduces the breadcrumb to Sessions and Transcript context so it does
  not overflow the compact header;
- the source header stacks on mobile while preserving both source actions;
- the focused passage uses `color/bg/surface` and a
  `color/interaction/progress` citation accent inside the approved
  `color/bg/subtle` transcript context surface;
- transcript text wraps and grows vertically rather than clipping at compact
  widths.

Behavior and accessibility:

- this route displays source material and does not synthesize an answer;
- participant or moderator name, transcript role, timestamp, relevance, exact
  excerpt, surrounding turns, filename, file type, file size, and extraction
  date remain visible in the Ready state; the example identifies Maya Chen as
  `Maya Chen (Moderator)` rather than using an anonymous role label;
- Loading exposes a visible progress label;
- Unavailable explains that the source may be processing or removed and offers
  Return to session;
- Error preserves the source relationship and offers Retry and Return to
  session;
- focus styling remains inherited from approved AIR controls and uses
  `color/interaction/focus`.

React, Storybook, route wiring, persistence, and backend retrieval remain out
of scope until the Figma product components and page templates are approved.

## 05.9 Shared Route States

This is a Figma reference page, not an application route. It documents shared
route loading, recoverable error, Not Found, unavailable-source, and destructive
confirmation patterns. Collection-specific Empty and No Results variants remain
within their owning templates.

Figma status: approved July 14, 2026.

Private source component: `.Shared Route State`

Figma axes:

- Layout: Default, Compact;
- State: Loading, Recoverable Error, Not Found, Unavailable Source.

Composition and actions:

- Loading uses the approved Spinner and the status `Loading page content…`;
- Recoverable Error uses the approved Error Alert, a primary `Retry` action,
  and `Return to previous page` as the safe secondary action;
- Not Found uses the approved Empty State with `Return to Projects`;
- Unavailable Source uses the approved Warning Alert and `Return to session`;
- destructive confirmation is documented separately with the approved Dialog,
  Cancel action, and Danger Button labeled `Delete transcript`.

Behavior and accessibility:

- route chrome, route title, and available navigation remain present while the
  main content region changes state;
- Loading exposes a polite live status and does not move focus;
- Recoverable Error announces the failure once and preserves a retry path;
- Not Found moves focus to its heading after route navigation completes;
- Unavailable Source distinguishes processing, removal, and access loss from a
  route that never existed;
- destructive dialogs name the affected object and downstream consequence,
  trap focus, support Escape and Cancel, avoid default focus on the destructive
  action, and restore focus to the trigger after cancellation.

React, Storybook, route wiring, persistence, and backend behavior remain out of
scope until the Figma product components and page templates are approved.

## 05.10 Settings

Routes: `/settings/profile`, `/settings/ai`  
Figma component: `Settings`

Purpose: workspace-level User profile and AI provider settings. Settings remain
outside active-Project navigation and are reached through the global settings
icon.

Figma status: complete; included in final QA July 14, 2026.

Figma axes:

- Viewport: Desktop, Tablet, Mobile;
- Tab: User Profile, AI Provider Settings.

The AI provider form uses the approved two-column/full-width form convention
at medium and larger widths and a single full-width column on mobile. User
Profile remains intentionally empty for this scope.

## Figma Page Templates Final QA

Status: approved July 14, 2026.

The final source and public-template pass covered 05.1 through 05.10 and
confirmed:

- the approved page order, viewport dimensions, and complete state/tab axes;
- Project terminology, sentence-case action labels, concrete example content,
  and no unresolved template placeholders;
- reusable Application Shell, Global Header, navigation, Research Object, and
  shared route-state instances without detached components;
- fluid Project Form controls on mobile and intrinsic-height Large Alert
  content without clipped validation or route messages;
- normalized Project Overview breadcrumbs and Project Summary identity;
- correct route-level Not Found compositions for Project Overview and
  Participants Collection using `.Shared Route State`;
- Participants Collection copy that consistently refers to the active Project
  and session records;
- an ArrowLeft icon for the Participant Detail `Back to participants` action;
- all six Session Detail destinations, including the complete Ask this session
  workspace at desktop, tablet, and mobile widths;
- Session Report example references normalized from Study to Project;
- representative visual validation for Projects Index, Create/Edit Project,
  Project Overview, Participants Collection, Participant Detail, Sessions
  Collection, Session Detail, Transcript Detail, Shared Route States, and
  Settings.

The approved Figma package is now the source of truth for React component,
Storybook, route, persistence, and backend implementation planning.
