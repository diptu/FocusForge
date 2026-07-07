---
name: devops-observability
description: Production-grade observability engineering — three pillars (metrics, logs, traces) with Prometheus / Grafana / Loki / Tempo / OpenTelemetry, SLI/SLO/error-budget discipline, alerting with Alertmanager + PagerDuty/Opsgenie, dashboard design, structured logging, distributed tracing with OTel SDK + auto-instrumentation, cardinality control, retention + storage tiers, cost control, synthetic monitoring, real user monitoring, continuous profiling, and incident response integration. The observability default in the devops cluster. Pairs with `devops-docker` (image instrumentation), `devops-kubernetes` (workload observability), `backend-fastapi` (app instrumentation), and `devops-ci` (pipeline metrics).
---

- **Execution**: Run `/observe <action> [args]`. Actions: `scaffold`, `sli`, `slo`, `metric`, `dashboard`, `alert`, `log`, `trace`, `instrument`, `cardinality`, `retention`, `cost`, `synthetic`, `rum`, `incident`, `runbook`, `query`, `correlate`, `profile`, `audit`, `deploy`.

# DevOps Observability Protocol

## 1. Mission
Ship observability stacks that are **SLO-driven, multi-pillar (metrics + logs + traces), low-cardinality, cost-controlled, on-call-ready, and boring to debug at 3 AM**. The skill owns the conventions a team standardizes on — so 12 services don't end up with 12 different metrics naming schemes, 12 different log formats, and 12 different opinions about whether every Prometheus rule is a PagerDuty page.

> **Core principle:** Every alert is SLO-burn-driven or symptom-based, not noise. Every metric / log / trace is correlated by trace ID. Every dashboard answers a specific question (latency? error rate? saturation?). Every log line is structured (JSON) with the same minimum fields. Every trace spans app + DB + cache + external — end to end. Observability without SLOs is just data hoarding.

## 2. Standards
Every observability artifact MUST follow these rules:

- **Three pillars together**: metrics + logs + traces, all linked by trace ID. No service ships with just one pillar. A bug you can't see in metrics should be visible in traces; a trace span error should map to a log line; a log line should carry the trace ID for pivot.
- **OpenTelemetry as the default**: OTel SDK + collector for new instrumentation. Vendor-specific agents (Datadog / NewRelic / Dynatrace) only when explicitly justified. OTel exporters ship to Prometheus / Tempo / Jaeger / Loki / vendor.
- **Metrics follow Prometheus conventions**: `snake_case`, base units (seconds, bytes, ratio 0-1, total count), `_total` suffix for counters, `_seconds` / `_bytes` for unit-suffixed histograms / summaries, no high-cardinality labels (UUIDs / emails / URLs).
- **Logs are structured JSON to stdout**: never plain text, never log to a file the app manages. Fluent Bit / Vector / Promtail DaemonSet ships them. Always: `timestamp`, `level`, `service`, `trace_id`, `span_id`, `message`. Often: `request_id`, `user_id`, `route`, `status`, `duration_ms`.
- **Traces follow OTel semantic conventions**: HTTP server spans (`http.request.method`, `http.route`, `http.response.status_code`), DB spans (`db.system`, `db.statement` redacted), messaging spans (`messaging.system`). Trace sampling probability is configurable per service.
- **Cardinality is bounded**: cardinality budget per metric (typ. < 100k series per metric, < 10M series per Prometheus). Use buckets, not raw labels. UUIDs / emails / paths go in logs, not metric labels. Drop rules in OTel collector.
- **SLOs are the contract**: every user-facing service has at least one SLO with an error budget. Alerts are burn-rate-based (multi-window, multi-burn-rate, Google SRE workbook). Symptom alerts for non-SLO signals.
- **Alerting is tiered**: page (PagerDuty / Opsgenie) for symptom-based burn-rate alerts; ticket (Slack / email) for warning thresholds; silence-aware (don't fire during deploys / maintenance windows).
- **Dashboards answer questions**: one dashboard per audience (SRE / service owner / business). Each panel links to the runbook. No "vanity" dashboards.
- **Retention tiered**: hot (15-30 days, full resolution) → warm (90 days, downsampled) → cold (1+ year, object storage, queried on-demand). Metrics retention driven by SLO reporting window.
- **Cost is a first-class concern**: observability bills scale with cardinality × retention × query volume. Budget per service. Right-size per environment (dev = sampled, prod = full).
- **Incident response wired**: every page links to a runbook URL. Runbook documents hypothesis + first-check commands + escalation. Postmortems feed SLO + alert refinements.

## 3. Workflow Actions

### `/observe scaffold <stack>`
Initialize the observability stack.
- Inputs: stack choice (Prometheus + Grafana + Loki + Tempo + OTel Collector + Alertmanager + PagerDuty / Datadog / NewRelic / vendor), env (dev / staging / prod), scale (small / medium / large), self-hosted vs managed.
- Outputs:
  - **Self-hosted (kube-prometheus-stack + Loki + Tempo + Grafana)**: Helm values + dashboards JSON + alert rules + SLO specs.
  - **Managed (Datadog / NewRelic / Grafana Cloud)**: terraform / Helm for agent install, dashboard JSON export, SLO API config.
  - **App side**: OTel SDK init code (per language), structured logger config, prometheus client default registry.
- Pairs with `/k8s scaffold` (deploy stack) + `/docker instrument` (instrument apps).

### `/observe sli <service>`
Define a Service Level Indicator.
- Inputs: user-facing journey (e.g. "checkout", "search", "API read"), measurement (request-based / event-based / pipeline-based), SLI formula.
- Outputs: SLI definition + measurement + collection strategy. Common patterns:
  - **Availability**: `success_count / total_count` over a window (e.g. 5xx count / total request count, last 30d).
  - **Latency**: fraction of requests faster than threshold (e.g. `histogram_quantile(0.99, ...) < 300ms` → fraction ≥ 99%).
  - **Freshness**: time since last successful pipeline run.
  - **Correctness**: fraction of events with valid schema / passing validation.
- Rule: SLIs are user-perceived, not internal. "DB CPU < 80%" is not an SLI; "checkout succeeds in < 1s" is.

### `/observe slo <service>`
Define a Service Level Objective + error budget.
- Inputs: SLI from `/observe sli`, target (e.g. 99.9% / 99.99%), window (28d / 30d), burn-rate alert thresholds.
- Outputs:
  ```yaml
  apiVersion: sloth.slok.dev/v1
  kind: SLO
  metadata: {name: <service>-availability}
  spec:
    service: <service>
    description: "99.9% of checkout requests succeed over 30 days"
    indicator:
      metadata:
        error_query: sum(rate(http_requests_total{service="<service>",status=~"5.."}[{{.window}}]))
        total_query: sum(rate(http_requests_total{service="<service>"}[{{.window}}]))
    objectives:
    - target: 0.999
      window: 30d
      alerting:
        page_alert:
          labels: {severity: page}
          annotations: {summary: "High burn rate for checkout availability"}
        ticket_alert:
          labels: {severity: ticket}
    - target: 0.99
      window: 30d
      alerting:
        ticket_alert: {labels: {severity: ticket}}
  ```
- Or Pyrra / Sloth generated PrometheusRule, or `pyrra`, or managed SLOs in Datadog / Grafana Cloud.
- Rule: 1-3 SLOs per service. Alert on burn rate (how fast the budget is being consumed), not on budget exhaustion alone.

### `/observe metric <purpose>`
Define / instrument a metric.
- Inputs: what to measure (counter / gauge / histogram / summary), labels (bounded cardinality!), unit, exposition format (Prometheus text / OTel metric).
- Outputs:
  - **Counter**: `requests_total`, `errors_total`, `bytes_sent_total`. Monotonically increasing.
  - **Gauge**: `in_flight_requests`, `queue_depth`, `active_connections`. Up / down.
  - **Histogram**: `request_duration_seconds` with explicit buckets (e.g. `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]`).
  - **Summary**: pre-aggregated quantiles (rarely needed; histograms preferred).
- Rule: never use unbounded labels. Bounded to ≤ 10-20 values per label. Bucket histograms for latency. Use `_total` / `_seconds` / `_bytes` suffixes consistently.

### `/observe dashboard <audience>`
Create a dashboard.
- Inputs: audience (SRE / service owner / business / exec), questions to answer (latency? error rate? saturation? cost?).
- Outputs: Grafana dashboard JSON (or Datadog / Kibana equivalent) with panels for:
  - **Golden signals**: latency (p50 / p95 / p99), traffic (rps), errors (rate, ratio), saturation (CPU / mem / connections).
  - **USE / RED**: per-resource utilization, saturation, errors; per-service rate, errors, duration.
  - **SLO panels**: SLO target line, error budget remaining (time-series), burn rate (multi-window).
  - **Saturation**: queue depth, pool utilization, replication lag, disk pressure, connection saturation.
  - **Cost panels** for observability itself: cardinality, ingest rate, storage used.
- Rule: every panel has a description + a "why this matters" + a link to the runbook. Variable templates for env / cluster / service. Persisted dashboard per audience (not "one big dashboard").

### `/observe alert <condition>`
Create an alert.
- Inputs: condition (SLO burn / symptom / threshold / change / anomaly), severity (page / ticket / info), routing (which team / channel), runbook URL, silencing.
- Outputs: Prometheus alert rule (or Datadog monitor / Grafana alert / NewRelic alert policy):
  ```yaml
  apiVersion: monitoring.coreos.com/v1
  kind: PrometheusRule
  metadata: {name: <service>-alerts, namespace: <ns>}
  spec:
    groups:
    - name: <service>.alerts
      rules:
      # Multi-window, multi-burn-rate (Google SRE workbook)
      - alert: SLO_HighBurn_5m
        expr: |
          (
            sum(rate(http_requests_total{service="<service>",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{service="<service>"}[5m]))
          ) > (1 - 0.999) * 14.4
        for: 2m
        labels: {severity: page, slo: <service>-availability}
        annotations:
          summary: "High burn rate: 5m window, ~14.4x faster than 30d SLO allows"
          runbook_url: https://runbooks.example.com/<service>/high-burn
          dashboard_url: https://grafana.example.com/d/<service>-slo
      - alert: SLO_HighBurn_30m
        expr: |
          (
            sum(rate(http_requests_total{service="<service>",status=~"5.."}[30m]))
            / sum(rate(http_requests_total{service="<service>"}[30m]))
          ) > (1 - 0.999) * 6
        for: 5m
        labels: {severity: page, slo: <service>-availability}
        annotations:
          summary: "High burn rate: 30m window, ~6x faster than 30d SLO allows"
          runbook_url: https://runbooks.example.com/<service>/high-burn
      # Symptom alerts
      - alert: PodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total{namespace="<ns>",pod=~"<service>-.*"}[10m]) > 0
        for: 5m
        labels: {severity: page}
        annotations:
          summary: "Pod crash-looping in <ns>/<service>"
          runbook_url: https://runbooks.example.com/<service>/crashloop
      # Saturation alerts
      - alert: HpaAtMax
        expr: kube_horizontalpodautoscaler_status_current_replicas{namespace="<ns>",horizontalpodautoscaler="<service>"} == kube_horizontalpodautoscaler_spec_max_replicas{namespace="<ns>",horizontalpodautoscaler="<service>"}
        for: 10m
        labels: {severity: ticket}
        annotations:
          summary: "HPA at max replicas for <service>"
          runbook_url: https://runbooks.example.com/<service>/hpa-max
  ```
- Rule: every alert has severity (page / ticket / info), routing, runbook URL, dashboard URL, silencing. Multi-window burn-rate for SLO alerts. Symptom alerts for non-SLO signals.

### `/observe log <service>`
Structured logging setup.
- Inputs: language runtime, log library (structlog / zap / zerolog / logrus / winston / Python logging / log4j / logback), destination (stdout / OTLP / file), correlation (trace_id, request_id).
- Outputs:
  - **Python (structlog)**:
    ```python
    import structlog
    structlog.configure(
      processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer(),
      ],
      wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
      logger_factory=structlog.PrintLoggerFactory(),
      cache_logger_on_first_use=True,
    )
    log = structlog.get_logger()
    log.info("order.placed", order_id=o.id, amount=o.amount, user_id=u.id)
    ```
  - **Go (zap)**:
    ```go
    logger := zap.NewProduction()  // JSON, ISO timestamps
    logger.Info("order.placed",
      zap.String("order_id", o.ID),
      zap.Int64("amount_cents", o.AmountCents),
      zap.String("trace_id", span.SpanContext().TraceID().String()),
    )
    ```
  - **Node (pino)**:
    ```js
    const logger = pino({ level: process.env.LOG_LEVEL || "info" })
    logger.info({ order_id, amount, trace_id }, "order.placed")
    ```
- Rule: JSON to stdout. `trace_id` + `span_id` always populated when a span exists. PII redaction at log site (or at the collector via transform processor). Log level configurable per env.

### `/observe trace <service>`
Distributed tracing setup.
- Inputs: language, framework, sampling strategy (always-on / always-off / parent-based / ratio / tail-based via collector), propagation (W3C tracecontext / B3 / Jaeger / Datadog).
- Outputs:
  - **OTel SDK init** (Python):
    ```python
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.instrumentation.redis import RedisInstrumentor
    from opentelemetry.instrumentation.requests import RequestsInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

    resource = Resource.create({"service.name": "<service>", "service.version": os.environ.get("APP_VERSION")})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317")))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(engine=engine)
    RedisInstrumentor().instrument()
    RequestsInstrumentor().instrument()
    HTTPXClientInstrumentor().instrument()
    ```
  - **OTel Collector**: receives OTLP gRPC (4317) + HTTP (4318), exports to Tempo / Jaeger / vendor.
  - **Sampling**: `parentbased_traceidratio` with ratio 0.05-0.1 for high-throughput services. Tail-based sampling in collector for "errors always sampled".
- Rule: trace context propagated via HTTP headers (W3C tracecontext default). Span attributes follow OTel semantic conventions. `service.name` consistent across logs / traces / metrics.

### `/observe instrument <service>`
Application instrumentation end-to-end.
- Inputs: service, language, frameworks, dependencies (DB / cache / queue / external APIs).
- Outputs: OTel SDK init, auto-instrumentation packages for HTTP server + client + DB + cache + queue + outbound HTTP, custom spans for business logic, custom metrics (counters / histograms) for SLO-relevant operations, structured logger with trace correlation.
- Rule: instrument at the framework boundary (auto-instrumentation), not deep in business logic. Custom spans only for multi-step business workflows. Custom metrics only for things not auto-collected (business KPIs, conversion funnels).

### `/observe cardinality <metric_or_source>`
Cardinality control.
- Inputs: metric name / source (app / exporter / log), current cardinality, target budget.
- Outputs:
  - **OTel Collector drop rules**: `transform` processor dropping high-cardinality attributes:
    ```yaml
    processors:
      transform/attributes:
        trace_statements:
        - context: span
          statements:
          - replace_pattern(attributes["http.url"], "https?://[^/]+(/[^?]+).*", "$$1")
          - delete(attributes["http.user_agent"], "regex")
    ```
  - **Prometheus relabel rules**: drop / keep / labelmap for high-cardinality series.
  - **Metric naming convention**: pre-defined label allow-list per metric. UUIDs / emails / paths → log fields, not metric labels.
- Rule: budget = 10M series per Prometheus / 100k per metric. If a metric explodes, find the source (usually a label leak). Cap retention before storage explodes.

### `/observe retention <tier>`
Storage + retention tiering.
- Inputs: data type (metrics / logs / traces), tier (hot / warm / cold), retention window per tier, query path per tier.
- Outputs:
  - **Hot** (15-30 days, full resolution): Prometheus / Mimir / Loki / Tempo on local SSD or hot object storage. Real-time queries.
  - **Warm** (30-90 days, downsampled): Mimir / Thanos / Cortex / S3 + Glue. Downsampled to 1m or 5m for metrics.
  - **Cold** (1+ year, archive): S3 + Glacier / equivalent. Query on-demand, slow.
- Rule: SLO reporting drives hot window (typical 30d). Audit / compliance drives cold window. Cost: hot > warm > cold. Pick the cheapest tier that meets query latency.

### `/observe cost <scope>`
Observability cost control.
- Inputs: vendor bills (Datadog / Grafana Cloud / self-hosted infra) or in-cluster resource usage (Prometheus disk, Loki storage, Tempo storage), per-service attribution.
- Outputs:
  - **Per-service attribution**: tag metrics / logs / traces with `service.name` → bill by service via Kubecost / cloud cost tools.
  - **Sampling tiers**: prod 100% / staging 10% / dev 1% / audit-only.
  - **Log volume control**: drop noisy DEBUG logs in prod; tail-sampling for traces; cardinality capping.
  - **Retention right-sizing**: shorten non-critical retention; move cold storage.
  - **Self-hosted vs managed**: at scale, self-hosted (Mimir / Thanos / Loki / Tempo) is 60-80% cheaper; managed is 60-80% easier. Calculate.
- Rule: observability cost = ingest × retention × query. Budget per service. Review monthly.

### `/observe synthetic <journey>`
Synthetic monitoring (active probing).
- Inputs: journey (URL / API endpoint / multi-step), frequency, locations, expectation.
- Outputs: Blackbox exporter config + Prometheus scrape + alert:
  ```yaml
  apiVersion: monitoring.coreos.com/v1
  kind: Probe
  metadata: {name: <service>-http}
  spec:
    interval: 30s
    module: http_2xx
    targets:
      staticConfig:
        static:
        - https://<service>.example.com/health
    scrapeTimeout: 10s
  ```
- Or managed: Pingdom / Datadog Synthetics / Checkly / Better Stack.
- Rule: synthetic checks run from multiple regions. Cover critical paths (login, checkout, search). Alert on failure. Don't use for measuring real-user latency (that's RUM).

### `/observe rum <service>`
Real User Monitoring (browser / mobile).
- Inputs: web / iOS / Android, sampling rate, expected vitals (LCP / FID / CLS / TTFB).
- Outputs: OTel RUM SDK init (browser / React Native / native) + collector + backend (Tempo / vendor). Custom events for business KPIs (checkout_started, etc.).
- Rule: sample 10-100% depending on traffic. PII redaction. Tie RUM trace to backend trace via tracecontext propagation (when feasible).

### `/observe incident <channel>`
Incident response integration.
- Inputs: severity levels, channels (PagerDuty / Opsgenie / Slack / MS Teams), escalation policies, on-call rotation.
- Outputs: Alertmanager config:
  ```yaml
  global:
    resolve_timeout: 5m
  route:
    receiver: default
    group_by: ['alertname', 'service']
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h
    routes:
    - matchers: [severity = "page"]
      receiver: pagerduty-<service>
      group_wait: 10s
      repeat_interval: 1h
      continue: false
    - matchers: [severity = "ticket"]
      receiver: slack-<service>
      group_wait: 2m
      repeat_interval: 12h
  receivers:
  - name: pagerduty-<service>
    pagerduty_configs:
    - service_key: <key>
      severity: critical
      description: '{{ .CommonAnnotations.summary }}'
  - name: slack-<service>
    slack_configs:
    - api_url: <webhook>
      channel: '#<service>-alerts'
      title: '{{ .CommonLabels.alertname }}'
      text: '{{ .CommonAnnotations.summary }}\nRunbook: {{ .CommonAnnotations.runbook_url }}'
  inhibit_rules:
  - source_matchers: [severity = "page"]
    target_matchers: [severity = "ticket"]
    equal: ['alertname', 'service']
  ```
- Rule: page alerts go to PagerDuty with runbook URL + dashboard URL. Ticket alerts go to Slack with same. Inhibit rules prevent double-notification. Silencing during planned maintenance via `amtool silence add`.

### `/observe runbook <alert>`
Runbook for an alert.
- Inputs: alert name, service.
- Outputs: Markdown runbook with sections: title, alert summary, severity, SLO impact, hypothesis tree, first-check commands (kubectl / PromQL / LogQL / TraceQL), escalation, related dashboards, postmortem template.
- Rule: every page alert has a runbook. Runbooks tested quarterly (run the diagnostic command — does it still work?). Updated after every incident.

### `/observe query <question>`
Query across metrics / logs / traces.
- Inputs: question (e.g. "why is checkout slow?", "how many 5xx in last hour?", "which user hit an error?"), data source.
- Outputs:
  - **PromQL**:
    ```promql
    # p99 latency by route
    histogram_quantile(0.99, sum by (le, route) (rate(http_request_duration_seconds_bucket{service="<service>"}[5m])))

    # Error rate
    sum(rate(http_requests_total{service="<service>",status=~"5.."}[5m]))
      / sum(rate(http_requests_total{service="<service>"}[5m]))

    # Saturation (CPU)
    rate(container_cpu_usage_seconds_total{pod=~"<service>-.*"}[5m])
    ```
  - **LogQL**:
    ```logql
    {service="<service>"} |= "error" | json | duration_ms > 1000
    {service="<service>"} | json | trace_id="<trace-id>"
    ```
  - **TraceQL** (Tempo):
    ```traceql
    { resource.service.name = "<service>" && span.http.status_code = 500 }
    { resource.service.name = "<service>" && span.duration > 1s }
    ```
- Rule: name the question first, then the query. Save common queries as dashboard panels / recording rules. Recording rules for expensive queries (compute once, query many).

### `/observe correlate <signal>`
Correlate signals across pillars.
- Inputs: starting signal (alert / metric spike / error log / slow trace), target correlations.
- Outputs: correlation workflow:
  - **From alert**: dashboard URL → SLO panel → RED panel → USE panel → recent deploys / config changes → logs filtered by service / trace → specific trace by trace_id from log → span waterfall → DB / cache spans.
  - **From trace_id**: log lines via `{trace_id="<id>"}` → metrics for that request (`requests_total{service=...,route=...,status=...}` near that time) → user / request context from logs.
- Rule: every signal should link to the other two. OTel collector correlator / Grafana unified data source / Datadog unified view / vendor-specific UI ties trace_id to log lines to metric exemplars.

### `/observe profile <service>`
Continuous profiling.
- Inputs: language (Python / Go / Node / JVM / Rust), backend (Pyroscope / Parca / Datadog Continuous Profiler / Google Cloud Profiler).
- Outputs: profiler init in app + backend ingestion + dashboard (flame graph by service / function).
- Rule: low-overhead (1-5% CPU). Always-on in prod. Flame graphs answer "where is CPU spent?". Pair with traces for context.

### `/observe audit <stack_or_service>`
Audit an existing observability setup. See §6.

### `/observe deploy <topology>`
Pre-deployment + post-deployment runbook.
- Inputs: stack choice, env, scale.
- Outputs:
  - **Pre-deploy**: SLOs defined for all user-facing services, alerts wired to PagerDuty / Slack, dashboards live, instrumentation in apps (OTel SDK + structured logger + Prometheus client), OTel Collector deployed, retention policy in place, on-call rotation populated.
  - **Deploy**: rolling out OTel SDK init, then OTel Collector, then dashboards, then alert rules (alert rules LAST so they don't fire on missing series).
  - **Post-deploy**: verify metrics flowing (`up{job="<service>"}` == 1), traces in Tempo, logs in Loki, SLO report populating, alerts firing on test fault.
- Rule: alert rules come LAST, after data is flowing. A page on "metrics missing" is a deployment bug.

## 4. Execution Order (Full Observability Rollout)

For a new service / stack:

1. `/observe scaffold <stack>` → stack choice + Helm values / vendor agent install
2. `/observe instrument <service>` → OTel SDK init + auto-instrumentation + structured logger + prom client
3. `/observe metric <purpose>` × N → custom metrics for SLO-relevant ops
4. `/observe log <service>` → structured logger config + correlation
5. `/observe trace <service>` → tracing SDK + propagation + sampling
6. `/observe sli <service>` → SLI definition
7. `/observe slo <service>` → SLO + error budget + multi-window burn-rate alerts
8. `/observe dashboard <audience>` × N → SRE + service-owner + business dashboards
9. `/observe alert <condition>` × N → symptom + saturation + SLO burn
10. `/observe runbook <alert>` × N → one runbook per page alert
11. `/observe incident <channel>` → Alertmanager routing + PagerDuty + Slack
12. `/observe synthetic <journey>` × N → critical path probes
13. `/observe rum <service>` → RUM if web / mobile
14. `/observe profile <service>` → continuous profiler if applicable
15. `/observe cardinality <metric>` → audit + drop rules
16. `/observe retention <tier>` → tiering + cold storage
17. `/observe cost <scope>` → budget + sampling tiers
18. `/observe query <question>` × N → common PromQL / LogQL / TraceQL saved
19. `/observe correlate <signal>` → cross-pillar linkage verified
20. `/observe audit <stack>` → pre-launch review
21. `/observe deploy <topology>` → production cutover

> 🛑 **No production rollout without:** SLOs defined, page alerts firing (with runbook), on-call rotation populated, instrumentation emitting metrics + logs + traces, dashboards live, OTel Collector routing correctly, retention tiered, cardinality budgeted, cost allocation tagged by service, drill validated (synthetic test fault → page arrives → runbook usable → alert resolves on fix).

## 5. Output Location
All artifacts written under `observability/` by default. `dashboards/`, `alerts/`, `runbooks/`, `slos/`, `instrumentation/`, `collector/`, `audit/`. Project-level docs in `/<project>/platform/observability/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing observability setup:

1. **Stack completeness**: metrics + logs + traces all flowing. OTel SDK or vendor agent in every service. No service ships with just one pillar.
2. **Structured logs**: JSON, to stdout, with `timestamp`, `level`, `service`, `trace_id`, `span_id`, `message`. No plain-text logs. No log-to-file from app. Shipper picks them up.
3. **Log correlation**: trace_id present in log lines (auto-instrumented). `trace_id` filterable in LogQL. PII redaction in place.
4. **Trace propagation**: W3C tracecontext propagated across HTTP / gRPC / DB (via OTel auto-instrumentation). No broken trace chains (no span ending without parent unless root).
5. **Metric conventions**: `snake_case`, base units, `_total` / `_seconds` / `_bytes` suffixes. Bounded labels. Histograms for latency.
6. **Cardinality budget**: per metric ≤ 100k series (Prometheus) / ≤ 10M total. No UUIDs / emails / paths in labels. Drop rules in collector.
7. **SLO coverage**: every user-facing service has 1-3 SLOs. Multi-window burn-rate alerts configured. Error budget tracked.
8. **Alerting tiered**: page alerts (SLO burn + critical symptoms) → PagerDuty with runbook. Ticket alerts (warning thresholds) → Slack. Info alerts → dashboard only.
9. **Alert hygiene**: every alert has severity, runbook URL, dashboard URL. Inhibit rules prevent double-notification. Silencing during planned maintenance. Alert spam score reviewed quarterly.
10. **Runbooks**: every page alert has a tested runbook. First-check commands verified working. Updated after every incident.
11. **Dashboards**: one per audience (SRE / service owner / business). Variable templates for env / cluster / service. Linked from alerts. No orphan dashboards.
12. **Retention tiered**: hot (15-30d) + warm (30-90d, downsampled) + cold (1+ year, archive). SLO reporting window fits in hot tier.
13. **Cost attribution**: per-service observability cost visible. Sampling tiers per env. Cardinality caps enforced.
14. **Synthetic monitoring**: critical paths probed from multiple regions. Probe failures alert.
15. **Incident response**: on-call rotation populated. Escalation policies defined. Postmortem process feeding alert refinements.
16. **Instrumentation coverage**: HTTP server + client + DB + cache + queue auto-instrumented. Custom spans for business workflows. Custom metrics for SLO-relevant ops.
17. **Cardinality over time**: track series count growth. Alert on cardinality explosions.
18. **Profile coverage**: continuous profiler on production-critical services (low-overhead).
19. **RUM coverage**: web / mobile vitals captured + tied to backend traces (where feasible).
20. **Postmortem feedback**: every P0/P1 incident produces postmortem → SLO adjustment / alert refinement / dashboard panel addition.

Output: a report with `Aligned` components and `Violation` instances, each tagged with severity (`P0` blocks launch / `P1` must-fix this quarter / `P2` nice-to-have), a concrete fix, and an effort estimate.

## 7. Hard Rules
- **Never** ship a service with just one observability pillar. Always metrics + logs + traces, linked by trace_id.
- **Never** log in plain text. Always structured JSON to stdout. Shipper picks them up.
- **Never** put high-cardinality data (UUIDs / emails / paths / full URLs) in metric labels. Use bounded categorical labels (status code class, route template, region).
- **Never** alert on noise (raw thresholds that flap, internal metrics without user impact). SLO burn or symptom only.
- **Never** ship a page alert without a runbook URL and dashboard URL. Page → runbook first.
- **Never** ship an alert rule before data is flowing. Alert on missing data is a deployment bug.
- **Never** sample 100% of traces in dev / staging. Sampling tiers per env.
- **Never** let observability cardinality grow unbounded. Drop rules, retention caps, budgeted per service.
- **Never** store secrets / PII / credit cards in logs. Redact at app layer or collector transform.
- **Never** ship without an on-call rotation populated. Page has to reach a human.
- **Never** ignore an alert budget exhaustion — if you're burning 5x the budget, something is broken and the SLO is at risk.
- **Never** use raw threshold alerts for SLOs. Use multi-window, multi-burn-rate (Google SRE workbook).
- **Always** follow Prometheus naming conventions (`_total`, `_seconds`, `_bytes`, `snake_case`, base units).
- **Always** structured JSON logs with `timestamp`, `level`, `service`, `trace_id`, `span_id`, `message`.
- **Always** propagate trace_id across HTTP / gRPC / DB (W3C tracecontext).
- **Always** instrument the framework boundary (auto-instrumentation), not deep in business logic.
- **Always** multi-window burn-rate alerts for SLOs (5m × 14.4x, 30m × 6x, etc., per Google SRE workbook).
- **Always** dashboard per audience (SRE / service owner / business) with variable templates.
- **Always** retention tiering (hot / warm / cold) based on SLO reporting window + audit need.
- **Always** cost attribution tagged by service (`service.name` in all three pillars).
- **Always** runbook for every page alert — tested quarterly (first-check commands must work).
- **Always** inhibit rules so a `page` alert suppresses its child `ticket` alerts (avoid double-notification).
- **Always** silencing during planned maintenance via `amtool silence add` (or vendor equivalent).

---

# Reference — Metric Conventions

## Naming

| Type | Pattern | Example |
|---|---|---|
| Counter | `<name>_total` | `http_requests_total`, `orders_placed_total` |
| Gauge | `<name>` (current state) | `queue_depth`, `active_connections`, `cpu_usage_ratio` |
| Histogram | `<name>_<unit>` (suffix unit) | `http_request_duration_seconds`, `payload_size_bytes` |
| Summary | `<name>_<unit>` (rare; prefer histogram) | `rpc_duration_seconds` |

## Units

| Dimension | Unit | Suffix |
|---|---|---|
| Time | seconds | `_seconds` |
| Size | bytes | `_bytes` |
| Ratio | 0..1 | `_ratio` |
| Rate | per second | implicit in `rate()` |
| Count | items | implicit |

## Bounded labels (allow-list, not denylist)

```yaml
# GOOD: bounded values
http_requests_total{service="checkout", method="POST", route="/api/v1/orders", status="200", region="us-east-1"} 1

# BAD: unbounded values
http_requests_total{service="checkout", user_id="abc-123-...", url="https://api.example.com/users/abc-123-.../orders?ref=..."} 1
```

If you need user-level data, log it. Metric labels are for aggregations.

## Histogram buckets

Default for HTTP latency (seconds):
```yaml
buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
```

For sub-second APIs, tighter buckets:
```yaml
buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5]
```

Always include the SLO threshold as a bucket boundary.

---

# Reference — PromQL Patterns

## RED (Rate / Errors / Duration) per service

```promql
# Rate (rps)
sum by (service) (rate(http_requests_total[5m]))

# Errors (rate)
sum by (service, status) (rate(http_requests_total{status=~"5.."}[5m]))

# Error ratio
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
  / sum by (service) (rate(http_requests_total[5m]))

# Duration p50/p95/p99
histogram_quantile(0.50, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))
histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))
histogram_quantile(0.99, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))
```

## USE (Utilization / Saturation / Errors) per resource

```promql
# CPU utilization (per pod)
rate(container_cpu_usage_seconds_total{pod=~"<service>-.*"}[5m])

# Memory utilization
container_memory_working_set_bytes{pod=~"<service>-.*"} / container_spec_memory_limit_bytes{pod=~"<service>-.*"}

# Connection saturation
sum by (service) (net_conntrack_connections{service=~"<service>"}) / 100000

# Queue depth
sum by (queue) (kafka_consumergroup_lag{consumergroup=~".*"})
```

## SLO burn rate (Google SRE workbook)

For SLO 99.9% over 30d, the budget per second is `1 - 0.999 = 0.001 = 0.1%`. Alert when burning the 30d budget faster than N×:

```promql
# 5-minute window, 14.4x burn rate → page if it persists 2m
(
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))
) > (1 - 0.999) * 14.4

# 30-minute window, 6x burn rate → page if it persists 5m
(
  sum(rate(http_requests_total{status=~"5.."}[30m]))
  / sum(rate(http_requests_total[30m]))
) > (1 - 0.999) * 6

# 6-hour window, 1x burn rate (budget exhaustion in 30d) → ticket if persists 30m
(
  sum(rate(http_requests_total{status=~"5.."}[6h]))
  / sum(rate(http_requests_total[6h]))
) > (1 - 0.999) * 1
```

## Recording rules (expensive queries, computed once)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata: {name: <service>-recording}
spec:
  groups:
  - name: <service>.recording
    interval: 30s
    rules:
    - record: <service>:http_requests:rate5m
      expr: sum by (route, status) (rate(http_requests_total{service="<service>"}[5m]))
    - record: <service>:http_request_duration_seconds:p99
      expr: histogram_quantile(0.99, sum by (le, route) (rate(http_request_duration_seconds_bucket{service="<service>"}[5m])))
    - record: <service>:http_request_duration_seconds:avg
      expr: sum by (route) (rate(http_request_duration_seconds_sum{service="<service>"}[5m])) / sum by (route) (rate(http_request_duration_seconds_count{service="<service>"}[5m]))
```

---

# Reference — LogQL Patterns

## Filter by service + level + time

```logql
{service="<service>", level="error"} | json | __error__=""
```

## Filter by trace_id (correlate to trace)

```logql
{service="<service>"} | json | trace_id="abc-123-def"
```

## Slow requests

```logql
{service="<service>"} | json | duration_ms > 1000
```

## Per-route error rate from logs

```logql
sum by (route) (
  count_over_time({service="<service>", level="error"} | json | route!="" [5m])
)
```

## Pattern detection

```logql
{service="<service>"} |~ "timeout|connection refused|deadlock"
```

## Metrics from logs (rare but useful)

```logql
sum by (route) (
  rate({service="<service>"} | json | duration_ms > 0 [5m])
)
```

---

# Reference — TraceQL Patterns (Tempo)

## Find slow requests for a service

```traceql
{ resource.service.name = "<service>" && span.http.status_code = 500 }
{ resource.service.name = "<service>" && span.duration > 1s }
```

## Find by trace_id (from log)

```traceql
{ trace:id = "abc-123-def" }
```

## Find by user attribute

```traceql
{ resource.service.name = "<service>" && span.http.route = "/api/v1/orders" && span.http.response.status_code = 500 }
```

## Find error traces by error type

```traceql
{ resource.service.name = "<service>" && events.exception.type = "DatabaseError" }
```

## Aggregate by route (count, p99)

```traceql
{ resource.service.name = "<service>" && span.http.route =~ "/api/.*" } | count() by (span.http.route)
```

---

# Reference — OpenTelemetry Collector Config

## Receivers, processors, exporters

```yaml
receivers:
  otlp:
    protocols:
      grpc: {endpoint: 0.0.0.0:4317}
      http: {endpoint: 0.0.0.0:4318}

processors:
  batch: {timeout: 5s, send_batch_size: 8192}
  memory_limiter: {check_interval: 1s, limit_mib: 1024, spike_limit_mib: 256}
  transform/drop_high_card:
    trace_statements:
    - context: span
      statements:
      - replace_pattern(attributes["http.url"], "https?://[^/]+(/[^?]+).*", "$$1")
      - delete_key(attributes, "http.user_agent.original")
    metric_statements:
    - context: metric
      statements:
      - delete_key(resource.attributes, "host.name")
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
    - name: errors
      type: status_code
      status_code: {status_codes: [ERROR]}
    - name: slow
      type: latency
      latency: {threshold_ms: 500}
    - name: sample
      type: probabilistic
      probabilistic: {sampling_percentage: 5}

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
  otlp/tempo:
    endpoint: tempo:4317
    tls: {insecure: true}
  loki:
    endpoint: http://loki:3100/loki/api/v1/write

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, tail_sampling]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, transform/drop_high_card]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [loki]
```

---

# Reference — SLI / SLO Templates

## Availability (request success rate)

```
SLI = sum(rate(http_requests_total{service,status!~"5.."}[30d]))
    / sum(rate(http_requests_total{service}[30d]))
SLO target = 99.9% over 30d
```

## Latency (fraction faster than threshold)

```
SLI = sum(rate(http_request_duration_seconds_bucket{service,le="0.3"}[30d]))
    / sum(rate(http_request_duration_seconds_count{service}[30d]))
SLO target = 99% of requests under 300ms over 30d
```

## Freshness (data pipeline)

```
SLI = time() - max(timestamp(exported_records{service}))
SLO target = < 5 minutes delay 99% of the time over 30d
```

## Correctness (data quality)

```
SLI = sum(rate(valid_records_total{service}[30d]))
    / sum(rate(total_records_total{service}[30d]))
SLO target = 99.99% valid records over 30d
```

## Multi-window burn-rate alert thresholds

| SLO | 5m burn rate (2m for) | 30m burn rate (5m for) | 6h burn rate (30m for) |
|---|---|---|---|
| 99% | 14.4× budget | 6× budget | 1× budget (page) |
| 99.9% | 14.4× budget | 6× budget | 1× budget (page) |
| 99.99% | 14.4× budget | 6× budget | 1× budget (page) |

The `1×` 6h window is the "budget exhaustion" alert — by the time the 30d budget is gone, you've had 6h warning.

---

# Reference — Dashboard Patterns

## RED dashboard (per service)

| Panel | Type | Query |
|---|---|---|
| Requests / sec | Graph | `sum by (status) (rate(http_requests_total{service}[5m]))` |
| Error rate | Stat / Graph | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| Latency p50/p95/p99 | Graph | `histogram_quantile(0.50/0.95/0.99, ...)` |
| Top 5 slowest routes | Table | `topk(5, histogram_quantile(0.99, sum by (le, route) (rate(...))))` |
| Top 5 error routes | Table | `topk(5, sum by (route) (rate(http_requests_total{status=~"5.."}[5m])))` |
| In-flight requests | Graph | `http_requests_in_flight` |

## USE dashboard (per resource / node)

| Panel | Type | Query |
|---|---|---|
| CPU utilization | Graph | `rate(container_cpu_usage_seconds_total[5m])` |
| Memory utilization | Graph | `container_memory_working_set_bytes / container_spec_memory_limit_bytes` |
| Disk I/O | Graph | `rate(container_fs_reads_bytes_total[5m])` |
| Network | Graph | `rate(container_network_receive_bytes_total[5m])` |
| PIDs | Graph | `container_processes` |

## SLO dashboard

| Panel | Type | Query |
|---|---|---|
| SLO target line | Gauge | `0.999` static |
| Current SLI | Stat | SLI query |
| Error budget remaining | Gauge | `1 - (1 - current_sli) / (1 - slo_target)` |
| Burn rate (5m / 30m / 6h) | Graph | three burn-rate queries |
| Time to budget exhaustion | Stat | `(1 - slo_target) / current_burn_rate` |

## Common Grafana features

- **Variables**: `$service`, `$env`, `$cluster`, `$route` — dashboard filters.
- **Annotations**: deploy markers from CI / Argo CD / Flux. Show alongside metrics.
- **Links**: each panel links to runbook + related dashboard.
- **Template variables**: `query_result` for dynamic lists.
- **Recording rule backing**: pre-computed series for expensive queries.

---

# Reference — Alertmanager Routing

## Tiered routing

```yaml
route:
  receiver: default
  group_by: ['alertname', 'service', 'cluster']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
  # Page: SLO burn (multi-window), critical symptoms
  - matchers: [severity = "page"]
    receiver: pagerduty
    group_wait: 10s
    group_interval: 1m
    repeat_interval: 1h
    continue: false   # STOP matching once a page fires
  # Ticket: warning thresholds, SLO slow burn
  - matchers: [severity = "ticket"]
    receiver: slack
    group_wait: 5m
    group_interval: 30m
    repeat_interval: 12h
  # Info: dashboard only
  - matchers: [severity = "info"]
    receiver: null
```

## Inhibition

```yaml
inhibit_rules:
  # If we have a page alert, don't ticket on the same alert
  - source_matchers: [severity = "page"]
    target_matchers: [severity = "ticket"]
    equal: ['alertname', 'service']
  # If cluster is down, don't alert per service
  - source_matchers: [alertname = "ClusterDown"]
    target_matchers: [severity = "page"]
    equal: ['cluster']
```

## Silencing during maintenance

```bash
# Add silence
amtool silence add --alertmanager=http://alertmanager:9093 \
  --comment="DB maintenance" \
  --duration=2h \
  --start="2025-08-15 22:00 UTC" \
  --matchers="cluster=prod,database=primary"

# List silences
amtool silence list

# Expire silence
amtool silence expire <id>
```

---

# Reference — Runbook Template

```markdown
# <AlertName> — <Service>

**Severity**: page / ticket
**SLO impact**: <which SLO, how it affects budget>
**Runbook owner**: <team>
**Last verified**: <date, run the diagnostic commands>

## Summary
<What this alert means in one sentence.>

## Hypothesis tree
- H1: <most likely>: <first-check command>
- H2: <next>: <first-check command>
- H3: <unlikely>: <first-check command>

## First-check commands

```bash
# SLO + RED
open https://grafana.example.com/d/<service>-slo
open https://grafana.example.com/d/<service>-red

# Recent deploy
kubectl -n <ns> rollout history deployment/<service>

# Errors in logs
logcli query --since=15m '{service="<service>",level="error"}'

# Slow traces
traceql '{ resource.service.name = "<service>" && span.duration > 1s }'

# Saturation
kubectl -n <ns> top pod -l app=<service>
kubectl -n <ns> get hpa <service>
```

## Mitigation

### H1 confirmed
<Action. Specific command sequence.>

### H2 confirmed
<Action.>

## Escalation
1. <Team> on-call (PagerDuty: <link>)
2. <Team> secondary
3. <Team> lead

## Postmortem template
<Link to postmortem template.>

## History
<Previous incidents with this alert.>
```

---

# Reference — Sampling Strategies

## Head-based sampling (cheap, simple)

```python
from opentelemetry.sdk.trace.sampling import (
    TraceIdRatioBased, ParentBased,
)
provider = TracerProvider(
    sampler=ParentBased(root=TraceIdRatioBased(0.05))  # 5% of root spans
)
```

## Tail-based sampling (sample by outcome, more expensive)

In OTel Collector (see Reference — OTel Collector above):
```yaml
tail_sampling:
  policies:
  - name: errors
    type: status_code
    status_code: {status_codes: [ERROR]}    # always keep errors
  - name: slow
    type: latency
    latency: {threshold_ms: 500}            # always keep slow
  - name: sample
    type: probabilistic
    probabilistic: {sampling_percentage: 5} # 5% of the rest
```

## Per-env sampling tiers

| Env | Sampling | Why |
|---|---|---|
| dev | 1% (or none) | Cheapest, debugging on demand |
| staging | 10% | Some signal, low cost |
| prod (low-traffic) | 100% | Keep everything |
| prod (high-traffic) | 5-10% + tail-sampling errors always | Cheap, but keep errors + slow |

---

# Reference — Cost Math

## Cardinality math

```
Series per metric = product of label value counts
Example: http_requests_total with 10 services × 5 routes × 4 methods × 5 status classes × 3 regions = 3,000 series

Per Prometheus instance: ≤ 10M active series (small: 1-2M; large: 10M+).
```

## Storage math

```
Bytes per series × active series × retention_seconds × scrape_interval_inverse
~3-4 bytes per sample × 3k series × 30d × 1 sample / 15s ≈ ~500MB for 30 days per metric.
```

## Log retention math

```
Logs/day × avg_size × retention × compression_ratio
100 GB/day × 500 bytes/log × 30d × 0.3 ≈ 450 GB hot + 4.5 TB warm.
```

## Trace retention math

```
Spans/sec × 1KB × 86400 × retention × sample_ratio
10k spans/s × 1KB × 86400 × 7d × 0.05 = 30 TB hot for 7 days.
```

Budget observability cost as a percentage of infra cost: typical target is 5-15%. Above 15% → revisit sampling, retention, cardinality.