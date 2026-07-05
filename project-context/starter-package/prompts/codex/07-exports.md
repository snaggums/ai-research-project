# Codex Prompt: Exports

Implement export functionality.

Backend routes:

- GET /api/projects/{project_id}/exports/markdown
- GET /api/projects/{project_id}/exports/csv
- GET /api/projects/{project_id}/exports/json

Export content:

- Project summary
- Themes
- Theme descriptions
- Confidence
- Supporting evidence
- Contradictory evidence
- Source document names

Frontend:

- Export menu on project and themes pages
- Download Markdown, CSV, and JSON

Acceptance criteria:

- User can download findings in all three MVP formats.
