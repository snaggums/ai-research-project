# Codex Prompt: Document Upload and Processing

Implement document upload and text extraction.

Supported file types:

- .txt
- .md
- .docx
- .pdf

Backend requirements:

- Document model and migration
- Upload endpoint: POST /api/projects/{project_id}/documents
- GET project documents endpoint
- GET document detail endpoint
- Local file storage under storage/uploads/project_{project_id}/
- Text extraction service
- Document status values:
  - uploaded
  - processing
  - complete
  - failed
- FastAPI background task for processing

Frontend requirements:

- Document upload component
- Documents table
- Status badges
- Error display
- Document preview

Acceptance criteria:

- User uploads a transcript file.
- Backend extracts text.
- Document status becomes complete.
- User can view extracted text.
