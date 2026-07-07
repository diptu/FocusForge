---
name: backend-fastapi
description: Build production-grade FastAPI services — async-by-default architecture, Pydantic v2 models, dependency injection, SQLAlchemy/SQLModel async integration, Alembic migrations,celery for background tasks, WebSockets, authentication, OpenAPI customization, testing, observability, and deployment. The Python default framework in the backend cluster. Pairs with `backend-engineer` (general), `backend-rest-api` (HTTP design depth), and `backend-event-driven` (async patterns).
---

- **Execution**: Run `/fa <action> [args]`. Actions: `scaffold`, `settings`, `lifespan`, `model`, `endpoint`, `router`, `dependency`, `auth`, `db`, `migration`, `background`, `websocket`, `middleware`, `error`, `validate`, `openapi`, `test`, `observe`, `deploy`, `perf`.

# Backend FastAPI Protocol

## 1. Mission
Ship production-grade FastAPI services that are **typed, async-by-default, observable, testable, and easy to deploy**. The skill owns the conventions, libraries, and patterns a team standardizes on — so 12 services don't end up looking like 12 different authors.

> **Core principle:** Type hints and Pydantic are the contract. If the request body is not a Pydantic model, the endpoint is broken. If the response is not typed, the OpenAPI doc lies.

## 2. Standards
Every FastAPI artifact MUST follow these rules:

- **Async by default**: Every endpoint declared `async def`. Sync code in async paths blocks the event loop — only use sync for CPU-bound or known-blocking library calls (and offload with `run_in_executor`).
- **Pydantic v2 at every I/O boundary**: Request body, query, path, headers, cookies, response — all Pydantic models. No raw dicts crossing the boundary.
- **Type hints everywhere**: Enforced by `mypy --strict` or `pyright strict` in CI. Every public function fully typed.
- **Ruff for lint + format**: `ruff check` + `ruff format` in CI. No exceptions.
- **Dependency injection over globals**: Database session, current user, settings, services — all delivered via `Depends()`. No module-level singletons of stateful resources.
- **Layered architecture**: `routers/` → `services/` → `repositories/` → `models/`. Routers handle HTTP only; business logic lives in services; data access in repositories.
- **Alembic for schema changes**: No raw `Base.metadata.create_all()` in prod. Every change is a versioned migration with upgrade + downgrade.
- **Structured logging**: `structlog` (or `loguru`) with trace ID, request ID, user ID. JSON output in prod, pretty in dev.
- **Errors as typed responses**: Domain errors raise `HTTPException` with explicit status + typed detail model. No bare `500`s with stack traces in responses.
- **Settings via `pydantic-settings`**: 12-factor config loaded from env. `.env` for dev only. No secrets in code.
- **Test pyramid**: Unit (services, pure logic), integration (TestClient with real DB in container), e2e (full stack against staging). Coverage floor: 80% on services.
- **OpenAPI is the contract**: Customized title, version, description, tags, examples. The OpenAPI JSON is checked in CI for unexpected changes (breaking-change detection).

## 3. Workflow Actions

### `/fa scaffold <service_name>`
Scaffold a new FastAPI service.
- Inputs: service name, description, key features.
- Outputs: full project skeleton with: package layout, pyproject.toml (or requirements.txt + setup.cfg), Dockerfile, docker-compose for local DB, alembic init, structured logging config, test scaffolding, CI workflow, Makefile, README.
- Layout:
  ```
  src/<service_name>/
    main.py
    routers/
    services/
    repositories/
    models/        # SQLAlchemy / SQLModel
    schemas/       # Pydantic
    dependencies.py
    settings.py
    errors.py
    observability.py
  tests/
    unit/
    integration/
    e2e/
  alembic/
  pyproject.toml
  Dockerfile
  docker-compose.yml
  ```
- Output: scaffolded repo + `README.md`.

### `/fa settings <env_or_service>`
Define typed settings via pydantic-settings.
- Inputs: list of env vars needed, secrets, computed fields.
- Outputs: `Settings` class with all env-bound fields, nested config groups (DB, Redis, Auth, Observability), validators, computed fields, `.env` template.
- Includes: `lru_cache` provider, test override mechanism.
- Output: `settings.py` + `.env.example`.

### `/fa lifespan <service>`
Wire startup / shutdown via FastAPI lifespan.
- Inputs: list of resources to initialize and clean up (DB engine, Redis pool, broker producer, ML model).
- Outputs: async context manager handling init → yield → cleanup. Replaces deprecated `@app.on_event("startup")`.
- Output: `lifespan.py` + registered in `main.py`.

### `/fa model <entity>`
Define data models.
- **SQLAlchemy 2.0 async ORM** for DB tables (default).
- **SQLModel** when the team prefers unified Pydantic + ORM (FastAPI author's choice).
- **Pydantic** for request/response schemas (separate from ORM models).
- Outputs: ORM model with typed columns, relationships, indexes, constraints + Pydantic schemas for create/read/update.
- Rule: never return ORM models from endpoints — always convert to Pydantic response models.
- Output: `models/<entity>.py` + `schemas/<entity>.py`.

### `/fa endpoint <route>`
Implement an endpoint.
- Inputs: HTTP method, path, request schema, response schema, auth requirement, status codes.
- Outputs: typed endpoint with: path/query/body/header/cookie params as Pydantic, dependencies injected, explicit response_model, status_code, summary, description, tags, response examples, error responses documented.
- Output: `routers/<resource>.py` + test.

### `/fa router <resource>`
Organize routers.
- Inputs: resource name, list of endpoints.
- Outputs: `APIRouter` with prefix, tags, dependencies (auth, rate limit), and route definitions. Routers mounted in `main.py`.
- Rules: one router per resource; routers do not import other routers; cross-router composition via services, not via router calls.
- Output: `routers/<resource>.py` + mount in `main.py`.

### `/fa dependency <name>`
Add a reusable dependency.
- Inputs: name, return type, scope (request/function).
- Outputs: dependency function with type hints, `Depends()`-able, used by endpoints.
- Common deps: `get_db`, `get_current_user`, `get_settings`, `get_logger`, `get_redis`, `get_broker_producer`.
- Output: `dependencies.py` (or split into `deps/`).

### `/fa auth <strategy>`
Wire authentication.
- Strategies: OAuth2 password flow, OAuth2 authorization code, JWT bearer, API key (header), session cookie.
- Outputs: auth scheme (`OAuth2PasswordBearer`, etc.), token validation (JWT decode + signature + exp + audience + issuer), `get_current_user` dependency, role/permission decorators (`require_role("admin")`), 401/403 responses.
- Pairs with `/security-jwt-oauth` for token design.
- Output: `auth.py` + dependencies + tests.

### `/fa db <service>`
Wire database integration.
- Inputs: database URL, dialect (Postgres default), pool sizing.
- Outputs: async engine, async session factory (`async_sessionmaker`), `get_db` dependency yielding a session with commit/rollback/close, ORM base, alembic config.
- Includes: connection pool tuning, statement timeout, prepared statement cache.
- Output: `db.py` + `alembic.ini` + `alembic/env.py` configured for async.

### `/fa migration <change>`
Create an Alembic migration.
- Inputs: description of schema change (add column, add index, etc.).
- Outputs: revision file with `upgrade()` + ` downgrade()`, autogenerated or hand-written, checked in, named descriptively.
- Rule: never edit an applied migration. Add a new one. Even if the prior was wrong.
- Output: `alembic/versions/<rev>_<slug>.py`.

### `/fa background <task_type>`
Set up background task execution.
- Options:
  - **FastAPI BackgroundTasks**: lightweight, fire-and-forget, in-process. Use only for non-critical, low-risk work (sending a welcome email).
  - **Celery**: distributed, retries, scheduler, mature. Use when you need robustness + scheduling.
  - **Arq**: async-native, lightweight, Redis-based. Good middle ground for async services.
  - **Dramatiq / RQ / Huey**: alternatives depending on ecosystem fit.
  - **External broker producer**: publish to Kafka / RabbitMQ, consume via `/backend-event-driven` consumers.
- Default for MVP: lightweight `BackgroundTasks` for fire-and-forget + Kafka/Redis for anything important.
- Output: `tasks/<task>.py` + worker config + tests.

### `/fa websocket <endpoint>`
Implement a WebSocket endpoint.
- Inputs: path, auth strategy, message contract, disconnect handling.
- Outputs: `@app.websocket("/ws")` with: connection accept, auth on connect, message validation (Pydantic), heartbeat, disconnect handling, error responses.
- For high-scale: pair with Redis pub/sub or broker fan-out.
- Output: `routers/ws_<resource>.py` + tests.

### `/fa middleware <purpose>`
Add middleware.
- Common: CORS, GZip, trusted hosts, request ID, trace context injection, slow-request logging, request size limit.
- Outputs: `app.middleware("http")` function (or `app.add_middleware()` for class-based), with proper async signature, applied in `main.py`.
- Rule: middleware runs on every request — keep it fast.
- Output: `middleware/<name>.py` + registration.

### `/fa error <scenario>`
Define error responses.
- Inputs: error scenarios (validation, auth, not-found, conflict, domain rule violation, internal).
- Outputs: typed error response model, exception handlers, consistent error envelope (e.g. RFC 7807 problem details), custom exception hierarchy, OpenAPI error response documentation per endpoint.
- Output: `errors.py` + exception handlers + tests.

### `/fa validate <field_or_schema>`
Set up Pydantic validation patterns.
- Inputs: field constraints, custom validators, conditional schemas (e.g. discriminated unions).
- Outputs: Pydantic v2 models with: `Field()` constraints, `field_validator` for single-field, `model_validator` for cross-field, discriminated unions for polymorphic payloads, computed fields.
- Output: `schemas/<entity>.py`.

### `/fa openapi <service>`
Customize the OpenAPI schema.
- Inputs: title, version, description, contact, license, server URLs, tags, security schemes.
- Outputs: customized `FastAPI(title=..., ...)` or `app.openapi = custom_function`. Examples in request/response schemas. Tags with descriptions. Security schemes declared.
- Includes: `openapi.json` snapshot test to catch unexpected changes in CI.
- Output: `openapi_customization.py` + snapshot test.

### `/fa test <scope>`
Write tests for a FastAPI service.
- **Unit**: pure functions in `services/`, validation logic, Pydantic models. No DB, no HTTP.
- **Integration**: `httpx.AsyncClient` + `ASGITransport`, real DB in TestContainer (or test DB), mocked broker. Covers endpoints with real DB.
- **E2e**: full stack via `TestClient` against running services + ephemeral env.
- **Contract**: OpenAPI snapshot tests, schema diff between versions.
- **Performance**: Locust / k6 for critical paths.
- Output: `tests/` + CI wiring.

### `/fa observe <service>`
Set up observability.
- Logs: structured JSON with trace ID, request ID, user ID (when authed), service name, level.
- Metrics: RED metrics per endpoint (Rate, Errors, Duration) via Prometheus client.
- Traces: OpenTelemetry instrumentation (FastAPI auto-instrumentation + manual spans in services).
- Dashboards: Grafana with per-endpoint latency, error rate, throughput.
- Output: `observability.py` + middleware + dashboards JSON.

### `/fa deploy <target>`
Deployment configuration.
- Targets: Docker + uvicorn / gunicorn + uvicorn workers, Kubernetes, Cloud Run, Fly.io, ECS, bare metal.
- Outputs: Dockerfile (multi-stage, non-root, slim base), entrypoint script, health check endpoint, graceful shutdown, env wiring, deployment manifest.
- Default: multi-stage Dockerfile + uvicorn behind a reverse proxy (nginx / cloud LB).
- Output: `Dockerfile` + `docker-compose.yml` + deployment manifests.

### `/fa perf <scope>`
Performance tuning.
- Targets: p95 latency < 100ms for simple endpoints, < 500ms for complex ones; throughput at p95 latency target.
- Techniques: async everywhere, connection pool sizing, prepared statement cache, eager loading to avoid N+1, response caching (Redis), compression (GZip), HTTP/2, worker count tuning, profile with `py-spy` or `memray`.
- Output: `perf/<scope>.md` + measurements + applied changes.

## 4. Execution Order (Full FastAPI Service Cycle)

For a new FastAPI service:

1. `/fa scaffold <service>` → project structure
2. `/fa settings <service>` → typed config
3. `/fa lifespan <service>` → startup/shutdown
4. `/fa db <service>` → async engine + sessions
5. `/fa migration init` → alembic initialized
6. `/fa model <entity>` × N → ORM + Pydantic schemas
7. `/fa migration <change>` × N → schema changes
8. `/fa dependency <name>` × N → shared deps (db, user, settings)
9. `/fa auth <strategy>` → auth wired
10. `/fa router <resource>` × N → endpoints
11. `/fa endpoint <route>` × N → typed routes
12. `/fa error <scenario>` → error envelope
13. `/fa middleware <purpose>` × N → CORS, trace, request ID
14. `/fa background <task_type>` → async work
15. `/fa websocket <endpoint>` (if needed)
16. `/fa validate <field>` → Pydantic depth
17. `/fa openapi <service>` → docs customized
18. `/fa observe <service>` → logs + metrics + traces
19. `/fa test <scope>` → pyramid coverage
20. `/fa perf <scope>` → latency budgets met
21. `/fa deploy <target>` → ready to ship

> 🛑 **No production rollout without tests passing, OpenAPI snapshot test green, observability live, and `/fa perf` budget met.**

## 5. Output Location
All artifacts written under the service's source tree by default. Project-level docs in `/<project>/services/<service>/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing FastAPI service:

1. **Type Coverage**: `mypy --strict` passes. Flag `Any`, missing return types, untyped dicts.
2. **Async Discipline**: All I/O-bound endpoints are `async def`. Flag sync endpoints with awaits downstream.
3. **Pydantic Discipline**: Every endpoint has typed request + response models. Flag `dict` returns or untyped bodies.
4. **Layered Architecture**: Routers don't import models directly; they call services. Flag direct DB access from routers.
5. **Dependency Injection**: Stateful resources (DB session, broker, Redis) accessed via `Depends`. Flag module-level singletons.
6. **Migration Hygiene**: Every schema change has a migration file. Flag `create_all()` in prod or hand-edited tables.
7. **Error Consistency**: All errors return the same envelope (RFC 7807 or custom). Flag inconsistent error shapes.
8. **Settings Discipline**: All config via pydantic-settings. Flag `os.getenv()` calls outside the settings module.
9. **Test Pyramid**: Tests present at all three levels. Flag e2e-only or unit-only coverage.
10. **Observability Coverage**: Logs structured, metrics exported, traces propagated. Flag missing instrumentation.
11. **OpenAPI Hygiene**: OpenAPI snapshot test green. Flag undocumented or stale endpoints.
12. **Performance Budget**: p95 latency measured and within budget. Flag endpoints without measurement.

Output: A report listing `Aligned` components and `Violation` instances with concrete fixes + effort estimate.

## 7. Hard Rules
- **Never** return an ORM model from an endpoint — convert to a Pydantic response model.
- **Never** use `create_all()` in production — Alembic migrations only.
- **Never** put `os.getenv()` outside `settings.py`.
- **Never** swallow exceptions silently in middleware or dependencies — log + return typed error.
- **Never** write a sync endpoint that calls an async client — it blocks the event loop.
- **Always** type the request body, response model, query params, and dependencies.
- **Always** use `lifespan` (not deprecated `@app.on_event`).
- **Always** document errors in OpenAPI per endpoint.
- **Always** wire observability before the first prod deploy.
- **Always** keep the OpenAPI snapshot test green — it catches breaking API changes before users do.