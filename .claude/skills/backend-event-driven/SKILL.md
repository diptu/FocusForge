---
name: backend-event-driven
description: Design and implement event-driven backend systems — message broker selection, event schemas, AsyncAPI contracts, producers and consumers, sagas, outbox pattern, idempotency, DLQs, schema evolution, replay, and observability. Deep specialty skill; pairs with `backend-engineer` (general backend) and `enterprise-architect` (system-level integration patterns).
---

- **Execution**: Run `/ev <action> [args]`. Actions: `event-design`, `broker`, `schema`, `catalog`, `produce`, `consume`, `saga`, `outbox`, `idempotency`, `dlq`, `schema-evolution`, `versioning`, `ordering`, `partitioning`, `tracing`, `delivery`, `replay`, `monitor`, `test`, `migrate`, `incident`.

# Backend Event-Driven Protocol

## 1. Mission
Design, ship, and operate event-driven backend systems that are **reliable, idempotent, observable, and evolvable**. Async by default — events replace synchronous cross-service calls when the caller doesn't need the result inline, when you want decoupling, or when you need fan-out.

> **Core principle:** Idempotency + at-least-once delivery + DLQ + outbox = effectively-once in practice. Exactly-once is a marketing claim; build the primitives that make "effectively-once" real.

## 2. Standards
Every event-driven artifact MUST follow these rules:

- **Events are facts**: Named in past tense (`OrderCreated`, `PaymentProcessed`, `InventoryReserved`). Not commands, not requests.
- **AsyncAPI for events**: Every event has an AsyncAPI 3 spec with payload schema, version, headers, examples. Authored before any code.
- **Schema registry**: Schemas versioned in a registry (Apicurio / Confluent Schema Registry / Karapace / custom). Versioning enforced by CI.
- **Backward-compatible evolution**: Add fields with defaults. Never remove or rename. Breaking change = new event version (and consumer migration plan).
- **Outbox pattern for publishing**: Never write to DB + publish to broker in two steps. Use transactional outbox so publish and commit are atomic.
- **At-least-once delivery + idempotency**: Default to at-least-once. Consumers must be idempotent (consumer-side dedupe by event ID or business key).
- **DLQ for every consumer**: Every consumer has a dead-letter queue with a defined retry + escape policy. No silent dropping.
- **Saga for distributed transactions**: Multi-service write coordination uses choreographed or orchestrated sagas with explicit compensating actions. No 2PC unless absolutely required.
- **Trace context propagated**: Every event carries `traceparent` and `tracestate` (W3C) headers. End-to-end trace from producer to consumer.
- **Ordering by partition key**: When ordering matters (per-customer, per-account), partition by the right key. Document the ordering guarantee per event.
- **Observability default**: Lag, throughput, error rate, retry rate, DLQ depth — all monitored. Alert on anomalies.
- **Replay safety**: Events must be replayable for new consumers or recovery. Past events stay in the log / object store per retention policy.

## 3. Workflow Actions

### `/ev event-design <business_capability>`
Design an event for a business capability.
- Inputs: business capability, owning service, consumer services, semantic intent.
- Outputs: event name (past tense), summary, payload schema (initial version), trigger, source-of-truth, retention.
- Includes: ordering requirements, idempotency key, version policy.
- Output: `events/<event_name>.md` + AsyncAPI snippet.

### `/ev broker <use_case>`
Choose a message broker.
- Inputs: throughput (msgs/s), latency target, ordering needs, replay needs, retention needs, ops capability, hosting preference.
- Brokers:
  - **Apache Kafka**: high throughput, replay, partitioning, ops-heavy.
  - **RabbitMQ**: classic queue, lower throughput, simpler ops, no replay.
  - **NATS / NATS JetStream**: lightweight, low-latency, optional persistence.
  - **Apache Pulsar**: Kafka-like + tiered storage, multi-tenant.
  - **AWS SQS/SNS**: managed, no replay, simple.
  - **AWS Kinesis**: managed, replay, per-shard ordering.
  - **GCP Pub/Sub**: managed, no ordering by default, replay.
  - **Redis Streams**: lightweight, low throughput.
- Default for MVP: managed broker (Confluent Cloud / AWS MSK / Cloud Pub/Sub) to avoid ops burden.
- Output: `decisions/<NNN>-broker-<use_case>.md`.

### `/ev schema <event>`
Author an AsyncAPI schema for an event.
- Inputs: event name, payload shape, header requirements, examples.
- Outputs: AsyncAPI 3 spec (YAML), JSON Schema for payload, examples per version.
- Includes: header schema (with `traceparent`, `event_id`, `event_version`, `producer`, `occurred_at`), payload schema, optional enum/format constraints.
- Output: `schemas/events/<event>.yaml` + JSON Schema + examples.

### `/ev catalog <domain>`
Build or update the event catalog.
- Inputs: domain or system, list of events.
- Outputs: searchable catalog (markdown table or Backstage / Aiven / custom) with: event name, producer, consumers, payload summary, schema version, owner, status (draft/stable/deprecated), retention.
- Output: `event_catalog.md` + sync target.

### `/ev produce <service> <event>`
Implement an event producer for a service.
- Inputs: service, event name, trigger, transactional boundary.
- Outputs: producer code (using outbox pattern), idempotency key generator, headers injection (trace context, event ID), schema validation before publish, error handling.
- Rule: never `db.commit(); broker.publish()` in sequence. Use outbox.
- Output: `services/<service>/producers/<event>.py` + tests.

### `/ev consume <service> <event>`
Implement an event consumer for a service.
- Inputs: service, event name, consumer group, processing logic.
- Outputs: consumer code with: idempotency check (by event ID or business key), schema validation, retry policy, DLQ routing, manual ack only after successful processing, trace context extraction.
- Output: `services/<service>/consumers/<event>.py` + tests.

### `/ev saga <business_transaction>`
Design a saga for a multi-service transaction.
- Inputs: services involved, business transaction, failure modes.
- Decision:
  - **Choreography**: each service listens to others, decides its step, publishes its event. Simpler, harder to debug.
  - **Orchestration**: a central orchestrator drives the steps. Easier to reason about, more coupling.
- Outputs: saga flow diagram (sequence), compensating actions per step, timeout policy, idempotency strategy, observability plan.
- Output: `sagas/<saga_name>.md` + sequence diagram.

### `/ev outbox <service>`
Implement the transactional outbox pattern.
- Inputs: service, list of events to publish.
- Outputs: outbox table schema (`event_id`, `aggregate_id`, `event_type`, `payload`, `headers`, `created_at`, `published_at`), writer code (insert in same DB transaction), publisher worker (poll → publish → mark), retry/backoff.
- Decision: polling vs CDC-based (Debezium) based on latency tolerance and ops complexity.
- Output: `services/<service>/outbox/` + migration + worker.

### `/ev idempotency <consumer>`
Add idempotency to a consumer.
- Inputs: consumer name, business key (event ID, aggregate ID + version).
- Outputs: idempotency store (Redis or DB), dedupe check before processing, idempotency record after success, TTL policy.
- Rule: idempotency check must be **faster than the work** it guards. Use Redis for hot paths.
- Output: `services/<service>/consumers/<event>/idempotency.md` + code.

### `/ev dlq <consumer>`
Set up a DLQ + retry strategy.
- Inputs: consumer name, retry policy (max attempts, backoff), escape policy.
- Outputs: DLQ topic/queue, retry consumer with exponential backoff (or delay queue), escape to DLQ after max retries, alerting on DLQ depth, DLQ inspection tooling.
- Rule: every consumer has a DLQ. No silent dropping, ever.
- Output: `dlq/<consumer>.md` + config.

### `/ev schema-evolution <event>`
Plan a schema evolution for an event.
- Inputs: event name, change (add field, remove field, rename, type change).
- Decision matrix:
  - **Add field with default**: backward-compatible, deploy consumers first then producers.
  - **Add field without default**: not backward-compatible, requires version bump + dual-publish window.
  - **Remove / rename**: not backward-compatible, new event version, deprecation window, consumer migration.
  - **Type change (narrow)**: not backward-compatible. New version.
  - **Type change (widen)**: usually safe but verify.
- Output: `schema_evolutions/<event>-<change>.md` + CI check.

### `/ev versioning <event>`
Set event versioning strategy.
- Inputs: event name, consumer base.
- Strategies:
  - **In-payload version**: `version` field in payload. Schema registry enforces compatibility.
  - **Topic versioning**: `orders.v1`, `orders.v2` topics. Old + new topics run during migration.
  - **Event-type versioning**: `OrderCreatedV1`, `OrderCreatedV2`. Distinct schema types.
- Default: in-payload version + schema registry. Topic versioning for major breaking changes only.
- Output: `versioning/<event>.md`.

### `/ev ordering <event>`
Define and enforce ordering guarantees.
- Inputs: event name, business ordering requirement.
- Decisions:
  - **Per-aggregate ordering**: partition by aggregate ID. All events for one aggregate are processed in order.
  - **Per-tenant / per-user ordering**: partition by tenant/user ID.
  - **No ordering**: key by null/random for max parallelism.
- Rule: when in doubt, partition by aggregate ID. Document the guarantee.
- Output: `ordering/<event>.md`.

### `/ev partitioning <topic>`
Design partitioning strategy.
- Inputs: topic, target throughput, key choice.
- Decisions: partition count (target ~10–100 msgs/s per partition), partition key (impacts ordering), rebalance strategy, hot-key mitigation (sticky-partitioner, key salting).
- Output: `partitioning/<topic>.md`.

### `/ev tracing <flow>`
Wire distributed tracing across an event-driven flow.
- Inputs: producer service, consumer services, event name.
- Outputs: trace context propagation in headers (W3C `traceparent`), span naming convention (`<producer> publish <event>`, `<consumer> process <event>`), trace sampling rules, correlation across hops.
- Output: `tracing/<flow>.md` + producer/consumer instrumentation code.

### `/ev delivery <flow>`
Define delivery semantics for a flow.
- Options:
  - **At-most-once**: fire and forget. Cheap, lossy. Use only for non-critical telemetry.
  - **At-least-once + idempotency**: default. Effectively-once in practice.
  - **Exactly-once**: only broker-native guarantees (Kafka transactions, Pulsar transactions). Requires both producer and consumer cooperation.
- Rule: pick at-least-once + idempotency by default. Document exactly-once use cases with broker support.
- Output: `delivery/<flow>.md`.

### `/ev replay <consumer> <from>`
Replay events for a consumer (initial backfill or recovery).
- Inputs: consumer name, start timestamp / offset, end timestamp / offset, target consumer group.
- Outputs: replay plan, resource isolation (use separate consumer group for replay), progress monitoring, cutover plan when complete.
- Rule: never replay into a consumer group that's actively consuming. Use a separate group for the replay.
- Output: `replay/<consumer>-<from>.md`.

### `/ev monitor <topic_or_consumer>`
Set up monitoring for an event flow.
- Inputs: topic / consumer name, SLOs.
- Outputs: dashboards for: producer publish rate, consumer lag (per partition), consumer throughput, error rate, retry rate, DLQ depth, end-to-end latency (producer → consumer), schema validation failures.
- Alerts: lag > threshold, DLQ depth > 0, error rate > baseline, end-to-end latency > SLO.
- Output: `monitoring/<topic_or_consumer>.md` + dashboard URL.

### `/ev test <flow>`
Test event-driven flows.
- Layers:
  - **Unit**: producer / consumer logic with mocked broker.
  - **Integration**: TestContainers with real broker (Kafka, RabbitMQ, NATS).
  - **Contract**: AsyncAPI schema checked at producer and consumer sides. Pact / Specmatic / Spectral.
  - **End-to-end**: full multi-service flow against a staging cluster.
- Output: `tests/events/<flow>/` + CI wiring.

### `/ev migrate <from> <to>`
Migrate between brokers, schemas, or event types.
- Triggers: broker EOL, schema breaking change, service split / merge.
- Patterns:
  - **Dual-publish**: producer writes both old and new. Migrate consumers incrementally.
  - **Consumer-mirror**: a temporary consumer mirrors old to new topic. Switch consumers over. Drain old.
  - **Big bang**: avoid unless tiny scope.
- Output: `migration/<event_or_topic>-<from>-to-<to>.md` + cutover + rollback plan.

### `/ev incident <incident>`
Handle an event-driven incident.
- Categories: consumer stuck (lag spike), DLQ overflow, broker outage, schema validation failure, replay gone wrong, ordering violation, duplicate processing.
- Steps: stop the bleeding (pause consumer / scale / drain DLQ), scope impact (which consumers affected), communicate, root cause, fix, postmortem, prevent.
- Output: `incidents/<date>-<slug>.md`.

## 4. Execution Order (Event-Driven Service Cycle)

For a service that publishes or consumes events:

1. `/ev event-design <capability>` → event spec
2. `/ev schema <event>` → AsyncAPI + JSON Schema
3. `/ev catalog <domain>` → register in catalog
4. `/ev versioning <event>` → versioning policy
5. `/ev ordering <event>` → partitioning key + ordering rule
6. `/ev produce <service> <event>` → producer + outbox
7. `/ev outbox <service>` → transactional outbox wired
8. `/ev consume <service> <event>` → consumer
9. `/ev idempotency <consumer>` → dedupe in place
10. `/ev dlq <consumer>` → retry + escape configured
11. `/ev tracing <flow>` → trace context propagated
12. `/ev delivery <flow>` → semantics documented
13. `/ev monitor <topic_or_consumer>` → dashboards + alerts live
14. `/ev test <flow>` → contract + integration tests pass
15. Production rollout (shadow → canary → full)
16. `/ev schema-evolution` (ongoing) → versioning checks in CI

> 🛑 **No production rollout without idempotency, DLQ, outbox, tracing, and dashboards wired.**

## 5. Output Location
All artifacts written to `/<project>/events/` by default. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an event-driven system:

1. **Event Naming**: Past tense, business-meaningful, no `event1` / `data_changed`. Flag imperative or vague names.
2. **Schema Registry Use**: Schemas registered + versioned. Flag hand-rolled schemas without registry.
3. **Backward Compatibility**: CI check rejects breaking changes. Flag missing compatibility checks.
4. **Outbox Pattern**: Producers use outbox, not direct DB+publish. Flag two-step commits.
5. **Idempotency**: Every consumer dedupes by event ID or business key. Flag consumers that process duplicates.
6. **DLQ Presence**: Every consumer has a DLQ. Flag missing DLQs.
7. **Trace Propagation**: Events carry `traceparent`. Flag headers without trace context.
8. **Ordering Documentation**: Ordering guarantees documented per event. Flag undocumented ordering assumptions.
9. **Replay Plan**: Replay procedure documented for each consumer. Flag "we don't know how to replay this."
10. **Monitoring Coverage**: Lag, error rate, DLQ depth monitored per consumer. Flag unmonitored consumers.
11. **Schema Evolution Discipline**: Breaking changes go through dual-publish + migration window. Flag direct breaking changes.
12. **Test Coverage**: Contract tests + integration tests for each flow. Flag untested event flows.

Output: A report listing `Aligned` components and `Violation` instances with concrete fixes + effort estimate.

## 7. Hard Rules
- **Never** publish events from a service without using the outbox pattern.
- **Never** let a consumer process without idempotency check.
- **Never** ship a consumer without a DLQ.
- **Never** break event schemas without dual-publish + migration window.
- **Never** name an event in imperative tense (`CreateOrder` — wrong; `OrderCreated` — right).
- **Never** use `kafka-console-consumer` style debug calls in production paths.
- **Always** propagate trace context in event headers.
- **Always** document ordering guarantees per event.
- **Always** version schemas in a registry.
- **Always** keep events replayable — retention policy documented and enforced.
- **Always** test the failure mode: what happens when the broker is down? When a consumer crashes mid-processing? When DLQ overflows?