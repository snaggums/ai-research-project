# Frontend Specification

## Stack

- React
- Vite
- TailwindCSS
- TanStack Query
- React Router
- Zustand
- shadcn/ui
- TipTap

## Routes

```text
/
/projects
/projects/:projectId
/projects/:projectId/documents
/projects/:projectId/themes
/projects/:projectId/themes/:themeId
/projects/:projectId/chat
/projects/:projectId/settings
```

## Layout

### Main Layout

- Left sidebar: projects, current project nav
- Top bar: page title, primary action
- Main content area

### Project Navigation

Inside a project:

- Overview
- Documents
- Themes
- Chat
- Settings
- Export

## Pages

### Projects Page

Purpose: list and create projects.

Components:

- `ProjectCard`
- `CreateProjectDialog`
- Empty state

### Project Detail Page

Purpose: project summary.

Show:

- Project name and description
- Number of documents
- Number of completed documents
- Number of themes
- Recent activity
- Primary next action

### Documents Page

Purpose: upload and inspect documents.

Components:

- `DocumentUploader`
- `DocumentTable`
- `DocumentStatusBadge`
- `DocumentPreviewPanel`

States:

- No documents uploaded
- Uploading
- Processing
- Complete
- Failed

### Themes Page

Purpose: review AI-generated themes.

Components:

- `GenerateThemesButton`
- `ThemeCardGrid`
- `ThemeCard`
- `CreateThemeDialog`

Theme card displays:

- Title
- Description
- Confidence
- Evidence count
- Created by AI/user
- Top evidence preview

### Theme Detail Page

Purpose: inspect and edit one theme.

Components:

- `ThemeEditor`
- `EvidenceList`
- `EvidenceCard`
- `ContradictoryEvidenceList`
- `ThemeNotesEditor`

Editable fields:

- Title
- Description
- Confidence
- Notes

Evidence actions:

- Remove evidence
- Edit reasoning
- Mark as supporting/contradictory

### Chat Page

Purpose: ask questions about project data.

Components:

- `ChatPanel`
- `ChatMessage`
- `CitationList`
- `QuestionSuggestions`

Suggested questions:

- What are the most common user pain points?
- Which themes have the strongest evidence?
- What surprised participants?
- What should we prioritize next?
- Which findings are supported by multiple documents?

### Settings Page

Purpose: configure AI provider.

Fields:

- Provider
- Model
- API key
- Base URL
- Embedding provider
- Embedding model
- Test connection button

## State Management

Use TanStack Query for server state:

- projects
- documents
- themes
- evidence
- chats
- settings

Use Zustand for UI state:

- sidebar open/closed
- selected project id if needed
- theme filters
- local unsaved editor state if needed

## UI Style

- Clean, minimal, professional
- Focus on reviewability and trust
- Evidence should feel prominent
- AI confidence should be visible but not overemphasized

## Important UX Details

### Evidence Visibility

Do not hide evidence behind too many clicks. Theme cards should preview evidence count and at least one quote.

### AI Transparency

AI-generated objects should be clearly labeled.

### Editable AI Output

Every generated theme should be editable directly from the detail view.

### Empty States

Every major page needs a helpful empty state:

- No projects
- No documents
- No themes
- No chat history
- Missing AI provider

## Frontend Data Types

### Theme

```ts
export type Theme = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  confidence: number;
  evidence_count: number;
  created_by: 'ai' | 'user';
  user_notes?: string;
  created_at: string;
  updated_at: string;
};
```

### Evidence

```ts
export type Evidence = {
  id: string;
  theme_id: string;
  document_id: string;
  chunk_id: string;
  quote: string;
  reasoning: string;
  relevance_score: number;
  evidence_type: 'supporting' | 'contradictory';
  created_at: string;
};
```
