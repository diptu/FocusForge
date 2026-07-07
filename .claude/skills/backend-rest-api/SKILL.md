---
name: backend-rest-api
description: Design production-grade REST APIs — resource modeling, OpenAPI 3.1 specs, HTTP semantics, idempotency, pagination, filtering, optimistic concurrency, caching, rate limiting, versioning, error envelopes (RFC 7807), webhooks, and API governance. The HTTP design depth in the backend cluster. Pairs with `backend-engineer` (general), `backend-fastapi` (Python framework), and `backend-event-driven` (async patterns).
---

- **Execution**: Run `/api <action> [args]`. Actions: `resource-model`, `openapi`, `pagination`, `filtering`, `idempotency`, `etag`, `cache`, `ratelimit`, `versioning`, `errors`, `bulk`, `partial-update`, `webhook`, `deprecate`, `lint`, `breaking-check`, `docs`, `governance`, `contract-test`.

# Backend REST API Protocol

## 1. Mission
Design HTTP APIs that are **predictable, evolvable, cacheable, and a joy to consume**. This is the design-depth skill — it owns what crosses the wire, regardless of which framework or language produces it. FastAPI, NestJS, Express, Spring — the HTTP contract is what users see. Make the contract a product.

> **Core principle:** The URL is a noun, the method is a verb, the status code is the outcome. If your API needs a tutorial to use, the design is wrong. REST is supposed to be self-describing.

## 2. Standards
Every REST API artifact MUST follow these rules:

- **Resource-oriented**: URLs are nouns (collections + individual resources). Methods express intent. Sub-resources for ownership (`/users/{id}/orders`).
- **OpenAPI 3.1 is the source of truth**: Every endpoint has a complete spec before implementation. The spec is checked in, linted, and diffed in CI.
- **Status codes are semantic**: 2xx success with the right code, 4xx client error with typed detail, 5xx server error. No 200-with-error-payload. No 500 with a stack trace.
- **Idempotency on every write**: `POST` accepts `Idempotency-Key` header. Replay-safe. `PUT` and `DELETE` are naturally idempotent.
- **Pagination on every collection**: Cursor-based default (offset acceptable for small, stable datasets). Page size capped, defaults documented.
- **Errors use RFC 7807 Problem Details**: `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`. Extensions allowed for domain errors.
- **Versioning is explicit**: URI path (`/v1/...`) for major versions. Backward-compatible changes don't bump. Breaking changes bump with a deprecation window.
- **Caching headers are intentional**: `Cache-Control`, `ETag`, `Last-Modified` per response. Public vs private explicit. `Vary` for content negotiation.
- **Rate limiting headers on every response**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, plus `Retry-After` on 429.
- **Security headers on every response**: `Strict-Transport-Security`, `Content-Security-Policy` (for JSON APIs: minimal), `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- **Breaking change detection in CI**: OpenAPI diff between versions. PRs that introduce breaking changes require explicit acknowledgement.
- **API deprecation is a process**: Deprecation header + sunset date + migration guide + monitoring of old-version traffic. Not a sudden cut.

## 3. Workflow Actions

### `/api resource-model <domain>`
Model a resource or collection.
- Inputs: business entity, list of operations, ownership, relationships.
- Outputs: URL design (collection + item + sub-resources), allowed methods, request/response shapes, status codes per operation, side effects.
- Patterns: collections as plural nouns, sub-resources for ownership, RPC-style for actions that don't fit CRUD (`/orders/{id}/cancel`).
- Output: `resources/<resource>.md` + URL tree.

### `/api openapi <api_or_service>`
Author an OpenAPI 3.1 spec.
- Inputs: list of endpoints, auth scheme, error model.
- Outputs: complete `openapi.yaml` with: `info`, `servers`, `security`, `tags`, `paths`, `components.schemas`, `components.securitySchemes`, `components.parameters`, `components.responses`, `components/examples`. Per operation: `summary`, `description`, `tags`, `parameters`, `requestBody`, `responses` (per status), `security`, `operationId`.
- Examples: realistic request/response examples per operation.
- Output: `openapi.yaml` + snapshot test.

### `/api pagination <resource>`
Design pagination strategy.
- Inputs: collection, scale (rows), access pattern.
- Options:
  - **Offset + limit**: simple, slow on deep pages, supports random jump. Use for small + stable datasets (admin UIs).
  - **Cursor (opaque base64 cursor)**: stable under inserts/deletes, fast. Use by default.
  - **Keyset (encoded last id)**: efficient for sorted access. Use for timeline feeds.
  - **Page + size**: user-facing "page 1 of N" UI.
- Rules: cap `limit` (default 20, max 100). Always include total or `next` cursor. Document defaults.
- Output: `pagination/<resource>.md` + implementation.

### `/api filtering <resource>`
Design filtering, sorting, search.
- Filtering: query params for each filterable field (`?status=active&created_after=...`). Support comma-separated for `IN`. Reject unknown fields.
- Sorting: `?sort=field` (asc) and `?sort=-field` (desc). Multi-sort as comma-separated. Reject unsortable fields.
- Search: `?q=...` for free-text. Document which fields are searched.
- Output: `filtering/<resource>.md` + validation.

### `/api idempotency <endpoint>`
Add idempotency to a write endpoint.
- Inputs: endpoint, key strategy.
- Behavior:
  - Client sends `Idempotency-Key: <uuid>` (or other unique value).
  - Server stores (key, request_hash, response) for a TTL window (24h typical).
  - Replay with same key + same body → return cached response.
  - Replay with same key + different body → 409 Conflict (or 422).
  - No key → behavior is non-idempotent (and that's the client's choice).
- Output: `idempotency/<endpoint>.md` + middleware + store (Redis or DB).

### `/api etag <resource>`
Set up optimistic concurrency with ETag.
- Inputs: resource, version source (hash, version column, updated_at).
- Behavior:
  - Response includes `ETag: "v1-..."`.
  - Update request includes `If-Match: "v1-..."`.
  - Mismatch → 412 Precondition Failed.
- For collections: weaker `ETag` (hash of query + content) for cache validation.
- Output: `etag/<resource>.md` + implementation.

### `/api cache <resource>`
Set HTTP caching headers.
- Inputs: resource, change frequency, user-sensitivity.
- Headers: `Cache-Control: max-age=N, public|private, no-store` + `ETag` + `Last-Modified` + `Vary` (when relevant).
- Rules:
  - Authenticated data → `private` or `no-store`.
  - Public static → `public, max-age=..., immutable` (when versioned).
  - Highly dynamic → `no-store` or very short `max-age`.
- Output: `cache/<resource>.md` + header config.

### `/api ratelimit <api_or_endpoint>`
Design rate limiting.
- Inputs: scope (global, per-user, per-IP, per-endpoint), limits, windows.
- Headers on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- On 429: `Retry-After: <seconds>`.
- Algorithms: token bucket (most common), sliding window, fixed window (cheaper but bursty).
- Storage: Redis for distributed enforcement.
- Output: `ratelimit/<scope>.md` + config + tests.

### `/api versioning <api>`
Design API versioning strategy.
- Options:
  - **URI path**: `/v1/users`, `/v2/users` — most discoverable, easy to route, easy to deprecate. Default.
  - **Header**: `Accept: application/vnd.api+json; version=2` — cleaner URLs, harder to discover.
  - **Query param**: `?version=2` — cache-busting issues. Avoid.
- Rules: major version only. Minor/patch are backward-compatible — no bump. Document the compatibility policy in `openapi.yaml`.
- Output: `versioning/<api>.md` + routing.

### `/api errors <api>`
Design the error envelope.
- Default: RFC 7807 Problem Details.
  ```json
  {
    "type": "https://example.com/probs/order-not-found",
    "title": "Order not found",
    "status": 404,
    "detail": "Order ord_123 does not exist or you do not have access",
    "instance": "/orders/ord_123",
    "code": "order.not_found",
    "trace_id": "..."
  }
  ```
- Extensions allowed: `code` (machine-readable), `errors[]` (field-level validation), `trace_id`.
- Output: `errors/<api>.md` + error catalog.

### `/api bulk <resource>`
Design bulk operations.
- Patterns:
  - **Bulk create**: `POST /<resource>/bulk` with array body, returns array response + per-item status.
  - **Bulk update**: `POST /<resource>/bulk-update` with array of {id, patch}.
  - **Bulk delete**: `POST /<resource>/bulk-delete` with array of ids.
- Limits: max 1000 items per request.
- Atomicity: all-or-nothing (rare) vs partial success (common — per-item status).
- Output: `bulk/<resource>.md` + endpoint spec.

### `/api partial-update <resource>`
Design PATCH semantics.
- Inputs: resource, patch format.
- Options:
  - **JSON Merge Patch (RFC 7396)**: simple, but no null-vs-omitted distinction.
  - **JSON Patch (RFC 6902)**: explicit ops array, more verbose, precise.
  - **Partial PATCH with field selection**: client sends only changed fields.
- Default: JSON Merge Patch for simple cases, JSON Patch when ops matter.
- Output: `partial-update/<resource>.md` + spec.

### `/api webhook <event>`
Design a webhook system.
- Inputs: event types, payload format, delivery guarantees.
- Behavior:
  - Subscriber registers URL with `subscribed_events[]`.
  - On event, POST signed payload to URL (HMAC-SHA256 in `X-Signature` header).
  - Retry policy: exponential backoff, max N attempts, DLQ.
  - Replay endpoint: GET recent deliveries.
  - Rotate signing secrets.
- Output: `webhook/<event>.md` + signing + retry + admin UI.

### `/api deprecate <endpoint_or_version>`
Deprecate an endpoint or API version.
- Inputs: what's being deprecated, sunset date, migration path.
- Process:
  1. Add `Deprecation: true` header + `Sunset: <date>` + `Link: <migration_guide>; rel="successor-version"`.
  2. Announce in changelog + email.
  3. Monitor traffic on deprecated path.
  4. Reach out to top consumers before sunset.
  5. After sunset: return `410 Gone` with `Link` to migration.
- Output: `deprecations/<slug>.md` + traffic dashboard.

### `/api lint <openapi_file>`
Lint an OpenAPI spec.
- Tool: Spectral (Stoplight) with custom ruleset.
- Rules: descriptive summaries, examples present, error responses documented, no undocumented status codes, security declared, descriptions on all parameters.
- Output: lint report + auto-fixes where safe.

### `/api breaking-check <from_spec> <to_spec>`
Detect breaking changes between two OpenAPI versions.
- Breaking:
  - Removed endpoint.
  - Removed required field.
  - Field type change.
  - Status code removed.
  - Auth scheme change.
  - Required header added.
  - Response schema change (removed field, type change).
- Non-breaking:
  - Added endpoint.
  - Added optional field.
  - Added response code.
  - Added status code.
  - Description change.
- Output: breaking-change report + required acknowledgements.

### `/api docs <openapi_file>`
Generate API documentation.
- Renderers: Redoc, Stoplight Elements, Swagger UI, ReadMe, Mintlify.
- Outputs: hosted docs site with: try-it console, auth, examples, error catalog, changelog.
- Versioned: per major version.
- Output: `docs/` site + hosting config.

### `/api governance <api>`
Set API governance rules.
- Inputs: team size, public vs internal API, consumer count.
- Rules: naming conventions, status code usage, error envelope, pagination default, rate limit defaults, security scheme, deprecation policy, version bump policy, lint passes, breaking-change review.
- Enforced in CI: Spectral rules, OpenAPI snapshot tests, contract tests.
- Output: `governance/api-standards.md` + CI rules.

### `/api contract-test <consumer> <provider>`
Run contract tests.
- Provider side: publishes OpenAPI spec; provider tests verify it implements the spec.
- Consumer side: Pact (or similar) — consumer declares expectations; provider verifies against them.
- Output: `contract_tests/<consumer>-<provider>.md` + Pact broker config.

## 4. Execution Order (REST API Design Cycle)

For a new API or major version:

1. `/api resource-model <domain>` → URL tree + operations
2. `/api openapi <api>` → OpenAPI 3.1 spec
3. `/api errors <api>` → error envelope
4. `/api pagination <resource>` × N → pagination
5. `/api filtering <resource>` × N → filtering + sorting + search
6. `/api idempotency <endpoint>` × N → idempotency on writes
7. `/api etag <resource>` × N → optimistic concurrency
8. `/api cache <resource>` × N → caching headers
9. `/api ratelimit <api>` → rate limits + headers
10. `/api versioning <api>` → version routing
11. `/api bulk <resource>` (if needed) → bulk endpoints
12. `/api partial-update <resource>` → PATCH spec
13. `/api webhook <event>` (if needed) → webhooks
14. `/api lint <openapi>` → spec passes lint
15. `/api breaking-check <from> <to>` (for version bumps) → no surprises
16. `/api docs <openapi>` → docs site published
17. `/api governance <api>` → CI rules enforced
18. `/api contract-test <consumer> <provider>` → consumer/provider aligned

> 🛑 **No release without lint green, breaking-check clean (or ack'd), and contract tests passing.**

## 5. Output Location
All artifacts written under the API's repo by default. `openapi.yaml` at root, `api-design/` for design docs. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing REST API:

1. **OpenAPI Currency**: Spec is current and complete. Flag stale or partial specs.
2. **Status Code Discipline**: Codes are semantic. Flag 200-with-error or 500-with-stack-trace.
3. **Idempotency Coverage**: All write endpoints accept `Idempotency-Key`. Flag POSTs that don't.
4. **Pagination Coverage**: All collections paginated. Flag unpaginated list endpoints.
5. **Error Consistency**: All errors follow RFC 7807. Flag inconsistent error shapes.
6. **Versioning Policy**: Documented and enforced. Flag unannounced breaking changes.
7. **Cache Headers**: Intentional Cache-Control per resource. Flag absent or wrong headers.
8. **Rate Limit Headers**: Present on every response. Flag responses without them.
9. **Security Headers**: HSTS, X-Content-Type-Options, etc. Flag missing.
10. **Deprecation Hygiene**: Deprecated endpoints have Sunset + Link headers. Flag silent deprecations.
11. **Lint Compliance**: Spectral rules pass. Flag unlinted specs.
12. **Contract Test Coverage**: Consumer-provider contracts tested. Flag untested integrations.
13. **Breaking Change Process**: Breaking changes announced with sunset. Flag quiet breaking changes.

Output: A report listing `Aligned` components and `Violation` instances with concrete fixes + effort estimate.

## 7. Hard Rules
- **Never** return a 200 with an error payload. Use the right status code.
- **Never** break a public API without a deprecation window and migration guide.
- **Never** omit `Idempotency-Key` support on POST endpoints that create resources.
- **Never** let collections go unpaginated.
- **Never** leak stack traces in 5xx responses.
- **Always** use RFC 7807 Problem Details for errors.
- **Always** set `Cache-Control` intentionally — even if it's `no-store`.
- **Always** set rate limit headers on every response.
- **Always** version APIs in the URI path for major versions.
- **Always** lint the OpenAPI spec in CI.
- **Always** run breaking-change detection in CI for version bumps.
