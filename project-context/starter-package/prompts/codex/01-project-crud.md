# Codex Prompt: Project CRUD

Implement Project CRUD for the Qual AI Workspace MVP.

Requirements:

- SQLAlchemy 2 Project model
- Alembic migration
- Pydantic v2 schemas
- FastAPI routes:
  - GET /api/projects
  - POST /api/projects
  - GET /api/projects/{project_id}
  - PATCH /api/projects/{project_id}
  - DELETE /api/projects/{project_id}
- Frontend project list page
- Create project dialog
- Edit/delete project actions
- TanStack Query hooks

Fields:

- id
- name
- description
- created_at
- updated_at

Acceptance criteria:

- User can create, view, edit, and delete projects from the UI.
