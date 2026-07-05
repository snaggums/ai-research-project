# Project Specification

## Working Name

Qual AI Workspace

## Product Vision

An AI-native qualitative research workspace that helps researchers move from transcript data to evidence-backed themes, insights, and answers.

This is not a full research repository, participant management tool, video analysis tool, or highlight reel editor. The MVP is deliberately focused on helping researchers understand qualitative transcript data.

## Core Job to Be Done

When I have research transcripts, I want AI to extract themes and evidence so that I can quickly review, edit, validate, and ask questions about the research.

## MVP Goal

Build an AI-powered qualitative research workspace that allows users to:

- Create projects
- Upload transcript files
- Bring their own LLM provider/API key
- Generate evidence-aware themes and insights
- Review and edit AI-generated themes
- Chat with project data using RAG
- Export findings

## Explicit MVP Constraints

The MVP does not include:

- Authentication
- Multi-user collaboration
- User roles and permissions
- Participant management
- Video/audio ingestion
- Automated transcription
- Highlight reels
- Clip generation
- Complex cross-project repository features
- Integrations with Zoom, Teams, Slack, Jira, Figma, etc.
- S3 or cloud object storage
- Billing
- Organization/team management

## Supported File Types

- `.txt`
- `.md`
- `.docx`
- `.pdf`

The MVP assumes uploaded files already contain transcript text or research notes.

## Core Workflow

1. User creates a project.
2. User uploads transcript documents.
3. Backend extracts text from files.
4. System chunks documents and creates embeddings.
5. User configures LLM provider and API key.
6. User generates themes.
7. AI creates themes with supporting evidence.
8. User reviews, edits, deletes, and optionally creates themes manually.
9. User asks questions about project data.
10. AI answers with citations to source chunks/evidence.
11. User exports findings.

## Product Differentiator

Evidence-aware themes.

Every AI-generated theme must include explicit supporting evidence from uploaded transcripts. The system should make it easy to inspect why the AI proposed a theme, which transcript excerpts support it, and how confident the system is.

## Key Product Promise

Upload transcripts, generate themes, and verify every finding against the evidence.

## Primary Personas

### UX Researcher

Needs to quickly synthesize interviews, usability test transcripts, survey comments, and research notes into actionable themes.

### Product Designer / UX Lead

Needs to review themes, extract insights, and answer questions about user needs and pain points.

### Research Ops / Design Strategy Lead

Needs a repeatable, evidence-backed workflow for analyzing qualitative data.

## Primary User Stories

### Project Management

- As a user, I can create a project so I can group related transcripts.
- As a user, I can view all projects so I can return to prior analysis work.
- As a user, I can edit a project name and description.
- As a user, I can delete a project and associated analysis data.

### Document Upload

- As a user, I can upload transcript files to a project.
- As a user, I can see processing status for each uploaded document.
- As a user, I can see whether processing completed or failed.
- As a user, I can view extracted document text.

### AI Provider Setup

- As a user, I can choose an LLM provider.
- As a user, I can provide my own API key.
- As a user, I can choose a model where supported.
- As a user, I can test whether the provider connection works.

### Theme Generation

- As a user, I can generate themes from all documents in a project.
- As a user, I can see theme title, description, confidence, and evidence count.
- As a user, I can open a theme to inspect evidence.
- As a user, I can regenerate themes if needed.

### Evidence Review

- As a user, I can see supporting quotes for each theme.
- As a user, I can see which document and chunk each quote came from.
- As a user, I can understand why the quote supports the theme.
- As a user, I can remove irrelevant evidence.
- As a user, I can add evidence manually later if needed.

### Theme Editing

- As a user, I can rename a theme.
- As a user, I can edit a theme description.
- As a user, I can delete a theme.
- As a user, I can create a new theme manually.
- As a user, I can change confidence or notes manually.

### RAG Chat

- As a user, I can ask questions about the project.
- As a user, I can receive answers grounded in uploaded transcripts.
- As a user, I can see citations to source material.
- As a user, I can continue a chat thread.

### Export

- As a user, I can export themes and evidence as Markdown.
- As a user, I can export themes and evidence as CSV.
- As a user, I can export project data as JSON.

## Success Criteria

The MVP is successful if a user can:

1. Create a project.
2. Upload 3–10 transcript files.
3. Generate a set of coherent themes.
4. Review the supporting evidence for each theme.
5. Edit or delete AI themes.
6. Ask at least five questions about the project data and receive cited answers.
7. Export a useful findings report.

## Quality Bar

- AI outputs must be structured, not just free text.
- Answers must cite source chunks.
- Theme evidence must be inspectable.
- All AI-generated content must be editable.
- Errors should be visible and recoverable.
- The UI should feel simple, focused, and calm.

## Future Scope

After the MVP validates the core workflow, consider adding:

- Authentication
- Team workspaces
- Audio/video upload
- Transcription
- Speaker diarization
- Highlight clips
- Cross-project repository search
- Integrations
- Rich report builder
- PowerPoint export
- Enterprise deployment configuration
