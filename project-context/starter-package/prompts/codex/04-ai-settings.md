# Codex Prompt: AI Provider Settings

Implement AI provider settings with LiteLLM.

Backend requirements:

- AI settings model or config service
- GET /api/settings/ai
- PUT /api/settings/ai
- POST /api/settings/ai/test
- LiteLLM client wrapper
- Never return raw API key from GET endpoint

Frontend requirements:

- Settings page
- Provider select
- Model input
- API key input
- Base URL input
- Embedding provider/model fields
- Test connection button

Initial providers:

- OpenAI
- Anthropic
- Gemini
- OpenRouter
- Azure OpenAI
- Ollama

Acceptance criteria:

- User can configure provider and model.
- User can test provider connection.
