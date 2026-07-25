---
name: air-build-backend-slice
description: Implement an approved Sky-AIR backend capability with FastAPI, SQLAlchemy, Pydantic, Alembic, services, routes, and tests. Use for AIR models, endpoints, persistence changes, migrations, or idempotent backfills after the domain and API contract are approved.
---

# Build an AIR backend slice

Confirm the domain and API contract, then inspect matching backend model, schema, service, route, migration, and test patterns before adding abstractions.

1. Update SQLAlchemy models, Pydantic request/response schemas, service behavior, and API routes in the established style.
2. Create additive Alembic migrations when persistence changes. Preserve authorization-ready ownership boundaries, existing IDs, relationships, and user data.
3. Make required generation, mutation, migration, and backfill work idempotent. Validate migration replay when data migration is involved.
4. Add backend and integration tests and verify frontend contract compatibility.

## Command safety

Before executing each migration, database, or audit command, verify that all
quotes, parentheses, braces, and PowerShell blocks are balanced.

- Run one short command at a time during audits. Do not use multiline compound
  commands.
- Never combine repository, Docker, process, database, and API checks into one
  command.
- Apply an explicit short timeout to every diagnostic operation. Stop and
  report the result after each command before continuing.
- Never silently retry a failed or interrupted command. Report the failure and
  the proposed corrected command before executing anything else.
- Do not use `Get-CimInstance Win32_Process` unless process command-line details
  are necessary; it can be slow on Windows.
- Do not enumerate every Project or Session during an audit. Target the known
  Project and Session directly.
- In PowerShell, pass SQL to `psql` as one single-quoted argument. For example:
  `docker compose exec -T postgres psql -U qual_ai -d qual_ai -tAc 'SELECT version_num FROM alembic_version;'`
- If a command produces its expected output but its wrapper does not terminate,
  stop the wrapper and do not rerun it as a compound command.
- Treat development servers such as `uvicorn --reload` as intentionally
  long-running processes rather than incomplete audit commands.

Never operate on production data or persist raw API keys. Use canonical architecture sources for detailed object and lifecycle decisions.
