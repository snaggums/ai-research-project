# AIR V2 Route Map

Status: Proposed for approval  
Scope: V2 information architecture with Sprint 8 routes identified

## 1. Routing principles

- Client routes use the public `projects`, `sessions`, `participants`, and
  `documents` terminology.
- A Project layout owns Project-scoped navigation and route context.
- Database and service-layer entity renames are outside this design task and
  remain governed by the approved migration plan.
- Entity identifiers, not display names, appear in URLs.
- Detail and edit views are deep-linkable.
- Filters, sorting, and selected tabs use URL search parameters when sharing or
  browser navigation should preserve them.
- Native browser Back and Forward behavior must work.
- A route must not become available until its sprint is implemented and tested.
- Future routes are reserved in the architecture but remain absent from active
  navigation in Sprint 8.

## 2. Route tree

Legend:

- **S8** - implemented in Sprint 8.
- **Future** - reserved for the named later sprint; not reachable in Sprint 8.
- **Existing** - retained capability relocated into V2 navigation.

```text
/
+-- projects                                     S8
|   +-- new                                      S8
|   +-- :projectId                               S8 Project layout
|       +-- overview                             S8 (index/default)
|       +-- edit                                 S8
|       +-- participants                         S8
|       |   +-- new                              S8
|       |   +-- :participantId                   S8
|       |       +-- edit                         S8
|       +-- sessions                             S8
|       |   +-- new                              S8
|       |   +-- :sessionId                       S8
|       |       +-- overview                     Sessions workspace
|       |       +-- participants                 Sessions workspace
|       |       +-- transcript                   Sessions workspace
|       |       +-- themes                       Sessions workspace
|       |       +-- report                       Sessions workspace
|       |       +-- ask                          Sessions workspace
|       |       +-- edit                         S8
|       |       +-- documents
|       |           +-- :documentId              S8
|       +-- ask                                  Reserved Project workspace
|       +-- evidence                             Sprint 11
|       |   +-- :evidenceId                      Sprint 11
|       +-- insights                             Sprint 12
|       |   +-- :insightId                       Sprint 12
|       +-- recommendations                      Sprint 13
|       |   +-- :recommendationId                Sprint 13
|       +-- chat                                 Compatibility/reserved
|           +-- :conversationId                  Future
|
+-- product-knowledge                            Future
|   +-- records                                  Future
|   |   +-- :recordId                            Future
|   |       +-- requirements                     Future
|   |       +-- decision-log                     Future
|   |       +-- action-items                     Future
|   |       +-- chat                             Future
|   |       +-- related-research                 Future
|   |       +-- reporting                        Future
|   |       +-- data-dictionary-terms            Future
|   +-- common-components                        Future
|   |   +-- :commonComponentId                   Future
|   |       +-- requirements                     Future
|   |       +-- decision-log                     Future
|   |       +-- action-items                     Future
|   |       +-- related-records                  Future
|   |       +-- related-research                 Future
|   +-- reporting                                Future
|   +-- data-dictionary                          Future
|   +-- relationships                            Future
|
+-- notifications                                Existing/future shell integration
|
+-- settings
    +-- ai                                       Existing
```

`/` redirects to `/projects`.

## 3. Sprint 8 route contracts

### 3.1 `/projects`

Purpose: workspace landing page and Project management.

Primary content:

- page title and Create project action;
- Project collection;
- empty state for a workspace with no Projects;
- loading, failure, and retry states;
- optional search when the number of Projects justifies it.

Create and edit actions have canonical routes even if the desktop presentation
uses a Dialog. This preserves deep links and allows a full-page mobile layout.

### 3.2 `/projects/new`

Purpose: create a Project.

- Desktop may render as a route-driven Dialog over `/projects`.
- Small screens render the same form as a full page.
- Cancel returns to `/projects` without saving.
- Successful creation navigates to `/projects/:projectId/overview`.

### 3.3 `/projects/:projectId/overview`

Purpose: orient the researcher and provide the next useful action.

Primary content:

- Project summary;
- Participant count;
- Session count;
- transcript processing summary;
- recent Sessions;
- calls to add Participants or Sessions;
- preserved V1 Theme/Evidence summary only if it can be shown without implying
  that the later V2 workspaces are complete.

### 3.4 `/projects/:projectId/edit`

Purpose: edit Project name and description.

It follows the same route-driven Dialog/full-page responsive pattern as Project
creation. Deletion, if retained, requires a destructive confirmation Dialog and
must state the cascading impact.

### 3.5 `/projects/:projectId/participants`

Purpose: manage the Project participant directory.

Primary content:

- participant collection;
- Add Participant action;
- Project-specific search/filter when needed;
- session participation count;
- empty, loading, failure, and retry states.

### 3.6 `/projects/:projectId/participants/:participantId`

Purpose: participant detail within the Project.

Primary content:

- participant identity/reference information;
- researcher notes;
- Sessions containing the Participant;
- Edit action;
- breadcrumb back to Participants.

The service layer returns Not Found when the Participant does not belong to the
route's Project.

### 3.7 `/projects/:projectId/sessions`

Purpose: manage research Sessions.

Primary content:

- page header with New session;
- Search sessions and transcripts;
- filters for session type, transcript status, analysis status, date, related
  Record, and related Common Component;
- detailed Session collection including transcript, theme, Session Report,
  relationship, and last-updated metadata;
- loading, empty, no-results, failure, and retry states.

### 3.8 `/projects/:projectId/sessions/:sessionId`

Purpose: provide a tabbed workspace for one Session.

Primary content:

- header metadata for title, type, date, moderator, duration, Records, and
  Common Components;
- tabs for Overview, Participants, Transcript, Themes, Session Report, and Ask
  this session;
- transcript upload, processing, viewing, retry, delete, and Search this
  transcript retrieval;
- theme generation, concise Theme Cards, review/edit/reject, and evidence detail;
- Session Report workspace;
- Session-scoped cited question answering.

The service layer returns Not Found when the Session does not belong to the
route's Project.

The selected Session tab is represented by its child route so links and browser
history preserve workspace location.

### 3.9 `/projects/:projectId/sessions/:sessionId/documents/:documentId`

Purpose: inspect one transcript Document.

Primary content:

- filename and processing metadata;
- primary transcript indicator;
- extracted text when complete;
- failure detail and retry action when failed;
- delete confirmation;
- source breadcrumb back to the Session.

The Document must belong to the route's Session and Project.

### 3.10 `/settings/ai`

Purpose: retain the existing provider configuration outside any Project. This
is a workspace-level setting and must not be nested below `/projects/:projectId`.

## 4. Application layouts

### 4.1 Workspace layout

Shared across all routes:

- Skip to main content link;
- global header with Sky AIR identity;
- primary navigation;
- notifications entry point;
- settings entry point;
- main content landmark;
- global error boundary.

Workspace navigation exposes Projects and Settings. Product Knowledge is
not displayed as a disabled destination before it is implemented.

### 4.2 Project layout

Shared across `/projects/:projectId/*`:

- Back to Projects navigation;
- active Project identity;
- active Project navigation for Overview, Participants, Sessions, and Ask this
  project;
- nested route content;
- route-level loading and Not Found behavior.

Project-wide global search is deferred to V3. In V2, the nested `Global Header`
property `Show Project search` defaults to false in every active-Project shell
viewport.
Session-level `Search this transcript` and collection-specific search remain in
scope because they operate within their owning routes.

The active Project navigation replaces the redundant horizontal Project-level
Section Navigation. Session workspace tabs remain within Session detail.

### 4.3 Focus and responsive behavior

- Route changes move focus to the page heading unless focus is restored to the
  trigger that closed a route-driven Dialog.
- Validation errors move focus to the error summary or first invalid field.
- Desktop secondary navigation may use a sidebar or horizontal tabs according
  to the approved Figma page template.
- Small-screen navigation must remain reachable without horizontal clipping.
- Dialog-based desktop routes become full-page forms when the viewport cannot
  support the approved Dialog geometry.

## 5. Navigation labels and breadcrumbs

| Route | Page label | Example breadcrumb |
| --- | --- | --- |
| `/projects` | Projects | Projects |
| `/projects/new` | Create project | Projects / Create project |
| `/projects/:projectId/overview` | Overview | Projects / {Project name} / Overview |
| `/projects/:projectId/participants` | Participants | Projects / {Project name} / Participants |
| `/projects/:projectId/participants/:participantId` | Participant detail | Projects / {Project name} / Participants / {Participant name} |
| `/projects/:projectId/sessions` | Sessions | Projects / {Project name} / Sessions |
| `/projects/:projectId/sessions/:sessionId` | Session detail | Projects / {Project name} / Sessions / {Session title} |
| `/projects/:projectId/sessions/:sessionId/documents/:documentId` | Transcript detail | Projects / {Project name} / Sessions / {Session title} / {Filename} |

Breadcrumb links use client-side navigation and must not leave the Storybook or
application shell context when exercised in component examples.

## 6. URL state

Use search parameters for state that should survive refresh or be shareable:

- `q` - text search;
- `sort` - approved sort key;
- `direction` - ascending or descending;
- `page` - pagination when introduced;
- `participant` - Session filter by Participant;
- `status` - processing status filter.

Do not put unsaved form content, open overflow menus, or ephemeral hover/focus
state in the URL.

## 7. Route-level states

Every Sprint 8 collection and detail route requires:

- initial loading;
- loaded with content;
- loaded empty where meaningful;
- recoverable request failure with retry;
- entity Not Found;
- unauthorized is intentionally deferred with authentication;
- mutation in progress;
- mutation failure without discarding user input.

## 8. API correspondence

The client-route terminology change does not itself rename database entities or
API resources. Those changes remain controlled by the approved migration plan.

The public API follows the same ownership model:

```text
/api/studies
/api/studies/{study_id}
/api/studies/{study_id}/participants
/api/studies/{study_id}/sessions
/api/studies/{study_id}/sessions/{session_id}/participants
/api/studies/{study_id}/sessions/{session_id}/documents
/api/documents/{document_id}
```

Nested creation and collection endpoints express ownership. Direct entity
endpoints may support detail, update, and delete, but the service layer always
checks Project ownership through the current internal Study entity.

## 9. Sprint 8 page-template order

Design page templates after Research Object component approval in this order:

1. Workspace and Project layouts.
2. Projects index.
3. Create/Edit Project responsive route.
4. Project overview.
5. Participants collection and detail.
6. Sessions collection.
7. Session detail and transcript management.
8. Transcript detail.
9. Shared route-state documentation.
10. Settings.
