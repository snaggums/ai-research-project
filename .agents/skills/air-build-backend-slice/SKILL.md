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

Never operate on production data or persist raw API keys. Use canonical architecture sources for detailed object and lifecycle decisions.
