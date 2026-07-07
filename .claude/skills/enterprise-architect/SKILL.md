---
name: enterprise-architect
description: Run the full Enterprise Architecture workflow — turn PM scope + BA requirements + CTO direction into service decomposition, bounded contexts, data flow, API contracts, integration patterns, and architecture fitness functions. Feeds Backend (Phase 6), Frontend (Phase 7), DevOps (Phase 9), and SRE observability.
---

- **Execution**: Run `/ea <action> [args]`. Actions: `context-map`, `c4`, `decompose`, `data-flow`, `api-contract`, `integration`, `consistency`, `caching`, `adr`, `fitness-fn`, `nfr-check`, `migrate`, `review`, `reference`.

# Enterprise Architect Protocol

## 1. Mission
Translate `/pm freeze` scope + `/ba requirements` + `/cto` direction into a **buildable architecture**: services, data flow, contracts, integration patterns, consistency strategy, and the automated checks that prevent architectural drift. The EA does not ship code — the EA ships **decisions, diagrams, contracts, and fitness functions** that let backend and frontend build with confidence.

> **Core principle:** Architecture is a hypothesis until it's enforced by automated checks. Every decision gets a fitness function or it's not really a decision.

## 2. Standards
Every EA artifact MUST follow these rules:

- **C4 model**: Diagrams use C4 levels (Context → Container → Component → Code). No free-form boxes-and-arrows.
- **Bounded contexts over service sprawl**: Every service owns one bounded context. If two services share a noun, the noun needs a definition owner.
- **ADR per irreversible decision**: Every irreversible architectural choice has an ADR (context, options, decision, why, consequences).
- **API-first**: Every service has a published contract (OpenAPI for sync, AsyncAPI for events) **before** implementation starts. Contracts are versioned.
- **Async by default for cross-service**: Synchronous calls only when the caller needs the result inline. Everything else is event-driven.
- **Idempotency on all writes**: Every write endpoint is idempotent (idempotency key or natural key). No exceptions.
- **Data ownership**: Each service owns its data. **No shared databases.** Cross-service reads go via API or event projection.
- **Observability baked in**: Every service ships structured logs, RED metrics, and traces from day 1. Not bolted on later.
- **Fitness functions automated**: Every architectural rule has a check in CI (archunit, dependency-cruiser, contract tests, custom linters). Rules not in CI are wishes.
- **NFR-driven design**: Every architectural choice traces to ≥1 NFR from `/ba requirements`. Untraced choices are violations.

## 3. Workflow Actions

### `/ea context-map <domain_or_features>`
Map bounded contexts (DDD) for the MVP.
- Inputs: domain description or MVP feature list.
- Outputs: context map with context names, responsibilities, relationships (partnership / customer-supplier / conformist / ACL / shared kernel), and ubiquitous language per context.
- Each context maps to ≤1 service in the design.
- Output: `context_map.md` + `bounded_contexts/<context>.md`.

### `/ea c4 <scope>`
Generate C4 diagrams at the requested level.
- Levels: `system` (C1 — context), `container` (C2 — apps + data stores), `component` (C3 — modules within a container), `code` (C4 — classes).
- Inputs: scope (whole system / one context / one service).
- Outputs: Mermaid or Structurizr DSL diagrams, renderable in docs.
- Output: `diagrams/c4-<level>-<scope>.md` + rendered image.

### `/ea decompose <context_map>`
Decide service decomposition strategy.
- Inputs: context map, team size, MVP timeline, scale targets.
- Decision matrix:
  - **Modular monolith** if: 1–2 teams, MVP phase, scale < 10× target, unclear domain.
  - **Service per bounded context** if: ≥ 3 teams, post-MVP scale, clear domain.
  - **Avoid microservices** if: team size < 5 or unclear domain boundaries.
- Outputs: service list, responsibility per service, deployment unit, technology choice (or "use team default").
- Output: `service_decomposition.md` + `service_boundaries.md`.

### `/ea data-flow <services>`
Define data flow through services.
- Inputs: service list, user journeys from `/pm journey`, MVP features.
- Outputs: sequence diagrams for each happy-path journey, identifying sync calls vs async events.
- Output: `data_flow/<journey>.md` (sequence) + `data_flow_overview.md`.

### `/ea api-contract <service>`
Author API contracts for a service.
- Inputs: service name, endpoints needed by other services or frontend.
- Outputs: OpenAPI 3.1 (sync) or AsyncAPI 3 (events) spec, with examples, error schema, auth scheme, idempotency rules, rate limits.
- Includes: request validation rules, response shape, status codes, error model.
- Output: `api_contracts/<service>.yaml` + `api_contracts/<service>.md` (human summary).

### `/ea integration <services>`
Choose integration pattern between two services.
- Inputs: source service, target service, use case.
- Decision matrix:
  - **Synchronous (REST/gRPC)** if: caller needs result inline, low latency required, query-style.
  - **Asynchronous (event / message)** if: caller doesn't need result, fan-out, eventual consistency acceptable, decoupling desired.
  - **Shared data (anti-pattern)** if: avoid unless physically necessary (legacy read model).
- Each integration tagged with consistency expectation (strong / eventual / best-effort).
- Output: `integration_patterns/<from>-to-<to>.md`.

### `/ea consistency <scenario>`
Define data consistency strategy for a cross-service scenario.
- Inputs: services involved, transaction shape, failure modes.
- Patterns:
  - **Saga (choreography or orchestration)** for multi-service writes.
  - **Outbox pattern** for reliable event publishing.
  - **2-phase commit** — only for hard-consistency needs, rarely justified.
  - **Eventual consistency** for read models.
- Outputs: pattern choice, sequence, compensating actions, idempotency key strategy.
- Output: `consistency_strategies/<scenario>.md`.

### `/ea caching <service_or_layer>`
Design caching strategy.
- Inputs: service or layer, read patterns, consistency tolerance.
- Decisions: cache layer (in-memory / Redis / CDN), cache key shape, TTL strategy, invalidation trigger (TTL / event / write-through), stampede protection.
- Output: `caching_strategies/<scope>.md`.

### `/ea adr <decision>`
Write an Architecture Decision Record.
- Inputs: decision topic, context.
- Format: Status (proposed/accepted/deprecated/superseded), Context, Options Considered (≥ 2), Decision, Consequences (positive + negative + reversibility), Date, Authors.
- Numbered sequentially. Never delete — supersede with a new ADR.
- Output: `decisions/adr-<NNNN>-<slug>.md`.

### `/ea fitness-fn <rule>`
Define an automated architectural fitness function.
- Inputs: architectural rule to enforce.
- Categories: dependency rules (no A → B), structural rules (only domain layer imports shared kernel), contract rules (provider matches consumer expectations), quality rules (no cycles, no N+1 in critical paths).
- Output: rule definition + implementation (archunit / dependency-cruiser / custom check / contract test) wired into CI.

### `/ea nfr-check <design>`
Validate that the proposed design meets NFRs from `/ba requirements`.
- Inputs: architecture artifacts, NFR list (perf, scale, availability, security, compliance).
- For each NFR: design attribute that satisfies it, measurement plan, residual risk.
- Flag NFRs with no design attribute — that's an unmeetable requirement.
- Output: `nfr_validation.md`.

### `/ea migrate <from_to>`
Plan an architecture migration.
- Inputs: current state, target state, constraints (must keep shipping).
- Patterns:
  - **Strangler fig**: new system grows around old, traffic routed progressively.
  - **Branch by abstraction**: introduce new behind interface, swap implementation.
  - **Parallel run**: old + new side-by-side, compare results.
  - **Big bang**: avoid unless tiny scope.
- Outputs: phases, traffic shifting plan, rollback per phase, success criteria per phase.
- Output: `migration_plans/<from>-to-<to>.md`.

### `/ea review <proposed_design>`
Review a proposed architecture (PR-style).
- Checks: ADR completeness, C4 diagrams present, NFR trace, integration patterns justified, data ownership respected, observability plan, fitness functions defined, contract tests planned, security boundaries explicit.
- Output: A report listing `Accepted`, `Changes Requested`, `Rejected` items with concrete suggestions.

### `/ea reference <pattern>`
Maintain a reference architecture for a recurring pattern.
- Examples: `event-driven`, `cqrs`, `hexagonal`, `microfrontend`, `modular-monolith`, `pipeline-architecture`.
- Each reference: when to use, when NOT to use, canonical diagram, anti-patterns, example implementation skeleton.
- Output: `reference_architectures/<pattern>.md`.

## 4. Execution Order (Full EA Cycle)
After `/pm freeze` and `/ba requirements`:

1. `/ea context-map <domain>` → context_map.md
2. `/ea decompose <context_map>` → service_decomposition.md
3. `/ea c4 system` → C1 diagram (whole system)
4. `/ea c4 container` → C2 diagrams (per service)
5. `/ea api-contract <service>` × N → api_contracts/
6. `/ea data-flow <services>` → data_flow/
7. `/ea integration <pair>` × N → integration_patterns/
8. `/ea consistency <scenario>` × N → consistency_strategies/
9. `/ea caching <service>` × N → caching_strategies/
10. `/ea fitness-fn <rule>` × N → CI-enforced checks
11. `/ea nfr-check <design>` → nfr_validation.md
12. `/ea adr <decision>` × N → decisions/ (per irreversible choice)
13. `/ea review <proposed_design>` → final review

> 🛑 **No Phase 6 (Backend) work starts until `/ea review` passes.**

## 5. Output Location
All artifacts written to `/<project>/architecture/` by default. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit existing architecture:

1. **ADR Coverage**: Every irreversible decision has an ADR. Flag decisions without ADRs.
2. **Context Integrity**: No service spans >1 bounded context. Flag context bleed.
3. **Data Ownership**: No shared databases across services. Flag cross-service direct DB access.
4. **Contract Versioning**: Every public API is versioned. Flag unversioned contracts.
5. **Idempotency**: Every write endpoint documents its idempotency key. Flag non-idempotent writes.
6. **Async vs Sync**: Cross-service integrations are async unless explicitly justified. Flag unnecessary sync coupling.
7. **Fitness Function Execution**: Run all `/ea fitness-fn` checks. Flag rules that exist in docs but not in CI.
8. **NFR Trace**: Every NFR has ≥1 design attribute satisfying it. Flag untraced NFRs.
9. **Observability Coverage**: Every service has logs/metrics/traces wired. Flag services without instrumentation.

Output: A report listing `Aligned` components and `Violation` instances with refactor suggestions.

## 7. Hard Rules
- **Never** approve an architecture without NFR validation.
- **Never** ship a service without a published API contract.
- **Never** allow direct cross-service DB access — go through API or event.
- **Never** let an irreversible decision go without an ADR.
- **Never** accept an architectural rule that isn't enforced in CI.
- **Always** prefer async over sync for cross-service calls.
- **Always** make write endpoints idempotent.
- **Always** produce C4 diagrams before service code is written.
- **Always** validate fitness functions actually run — green CI badge is the only proof.