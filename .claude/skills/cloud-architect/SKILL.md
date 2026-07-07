---
name: cloud-architect
description: Design and audit production cloud architectures — landing zones, network topology (VPC/VNet, subnets, AZs, peering, transit), compute selection (VMs/containers/serverless), storage & database tiering, IAM & encryption, multi-region HA/DR, auto-scaling & capacity, observability (logs/metrics/traces), SLOs, FinOps, IaC (Terraform/Pulumi), threat modeling (STRIDE), compliance (SOC2/HIPAA/PCI/GDPR), 6Rs migration, chaos engineering, and ADRs. Pairs with `backend-rest-api` (HTTP contract), `backend-event-driven` (async patterns), `sre` (reliability ops), and `security-review` (app-layer security).
---

- **Execution**: Run `/cloud <action> [args]`. Actions: `arch-design`, `topology`, `compute`, `storage`, `database`, `network-edge`, `security`, `reliability`, `disaster-recovery`, `multi-region`, `scalability`, `observability`, `slo`, `cost-optimize`, `iac`, `iac-review`, `landing-zone`, `threat-model`, `compliance`, `migration`, `chaos`, `adr`, `well-architected`, `governance`.

# Cloud Architect Protocol

## 1. Mission
Design cloud architectures that are **secure by default, reliable by design, cost-aware, and operable at scale**. The architect owns the *structure* — the topology, the trust boundaries, the failure domains, the scaling axes, the blast radius. Code lives below this line; the architecture determines what code can and can't fail safely.

> **Core principle:** The architecture is the set of decisions that are expensive to change later. Pick them deliberately. Treat every region, AZ, account, IAM boundary, and data store as a load-bearing choice — because it is.

## 2. Standards
Every cloud architecture artifact MUST follow these rules:

- **Cloud-agnostic first, cloud-specific at the bottom**: design the topology before the provider. Pin provider choices in a single layer (Terraform modules, account/region metadata) so they can be swapped.
- **Landing zone before workloads**: org/folder/account structure, network baseline, IAM baseline, logging baseline, guardrails exist before any workload lands. No bespoke accounts.
- **Multi-AZ by default, multi-region by intent**: every stateful workload runs in ≥2 AZs. Multi-region is a deliberate choice with a latency/RTO/cost justification — never accidental.
- **Trust boundaries are explicit**: public/private subnet tiers, perimeter accounts, service-to-service auth, identity-aware proxies. No "internal" services on the public internet.
- **Least privilege IAM**: roles scoped to actions + resources + conditions. Permissions have a TTL where possible. No long-lived root keys. Service accounts are per-workload.
- **Encryption everywhere, always**: TLS 1.2+ in transit (mTLS service-to-service). KMS-managed keys at rest. Customer-managed keys for sensitive data. BYOK for regulated workloads.
- **Secrets are not in code, env, or config**: Vault/SSM/Secret Manager + workload identity. Rotate. Audit access.
- **Stateful data is backed up**: automated backups, cross-region copy for critical data, restore tested quarterly. Backup ≠ DR — both exist.
- **Observability is a design input, not a retrofit**: structured logs, RED/USE metrics, distributed traces, SLOs defined at design time. Dashboards and alerts authored with the service.
- **Cost is an SLO**: budgets per workload, anomaly alerts, right-sizing reviews quarterly, commitment discounts (RIs/Savings Plans/CUDs) tracked. Untagged resources are billable clutter — tag everything.
- **IaC for everything**: no console-driven infra. Terraform/Pulumi checked in, peer-reviewed, planned in CI, applied via pipeline. State is remote + locked + encrypted.
- **Architecture decisions are written down**: every non-trivial choice has an ADR (Architecture Decision Record) with context, options, decision, consequences, and review date.
- **Failure is assumed**: every dependency has a failure mode in the design doc. Circuit breakers, retries with jitter, bulkheads, graceful degradation, chaos drills.
- **Compliance is continuous**: controls expressed as code (Sentinel/OPA/Config Rules), evaluated in CI and at runtime, audited quarterly. Compliance ≠ ticking boxes.
- **Boring tech for the load-bearing path**: the production hot path uses proven, well-supported services. New/exotic services for non-critical or sandbox workloads only.

## 3. Workflow Actions

### `/cloud arch-design <system_or_service>`
Produce an architecture for a system or service.
- Inputs: requirements (functional + non-functional), constraints (region, budget, compliance), team skills, existing systems.
- Outputs:
  - C4 diagrams (Context, Container, Component, Code) as text/mermaid.
  - Trust boundaries and data flows.
  - Failure modes and mitigations.
  - Component map: compute, storage, network, security, observability.
  - ADR index (link to `/cloud adr` outputs).
  - Cost estimate (order of magnitude) + scaling-cost curve.
- Patterns: layered (edge → API → app → data), event-driven (see `backend-event-driven`), CQRS, strangler fig (for migrations), cell-based (for blast-radius isolation).
- Output: `arch/<system>.md` + diagram files + ADR stubs.

### `/cloud topology <system_or_account>`
Design network topology.
- Inputs: account/VPC boundary, regions/AZs, connectivity requirements (on-prem, other VPCs, internet), IP plan, traffic patterns.
- Decisions:
  - **Cidr planning**: non-overlapping ranges per VPC; documented allocation table. `/16` typical for VPC, `/24` per subnet.
  - **Subnet tiers**: public (NAT, IGW, ALB), private (app), data (DB/cache/internal-only), management (jump/bastion). Tiers enforced by route tables + NACLs.
  - **AZ distribution**: ≥2 AZs for stateful, ≥3 preferred. Subnets sized for peak + headroom.
  - **Egress**: NAT Gateway (zonal — one per AZ for HA) vs NAT instance (avoid). Egress filtering + flow logs.
  - **Connectivity**:
    - VPC peering (1:1, no transit routing) — small topologies.
    - Transit Gateway / Cloud Router / Virtual WAN — hub-and-spoke at scale.
    - PrivateLink / Private Service Connect / Private Endpoint — service-to-service without internet.
    - VPN (IPsec, BGP) or Direct Connect / ExpressRoute / Interconnect — on-prem.
  - **Service endpoints / PrivateLink**: for managed services (S3, DynamoDB, RDS, Cloud SQL). Avoid public egress for managed-service traffic.
- Anti-patterns: one giant subnet, public DB subnets, single NAT for the whole VPC, overlapping CIDRs, IGW in the data tier.
- Output: `topology/<system>.md` + CIDR table + diagram.

### `/cloud compute <workload>`
Select the compute platform.
- Inputs: workload type (web/API/worker/batch/ML), traffic shape (steady/spiky/zero-to-N), runtime (language/container/image), scaling model, cost ceiling.
- Decision tree:
  - **Long-running, predictable, stateful**: VMs (EC2/Compute Engine/Azure VM) or managed Kubernetes (EKS/GKE/AKS). VMs for full control; K8s when you have ≥5 services or need orchestration.
  - **Containerized microservices, mixed runtimes**: managed Kubernetes (EKS/GKE/AKS) — only if you need K8s features (custom scheduling, operators, sidecars at scale). Otherwise ECS/Cloud Run/Container Apps.
  - **Bursty / event-driven / request-response <15min**: serverless (Lambda/Cloud Functions/Azure Functions). Cold start acceptable.
  - **Background jobs / cron / queue workers**: serverless + scheduled, or spot/preemptible VMs for heavy compute.
  - **GPU / ML training / HPC**: spot/preemptible + auto-scaling groups, or specialized services (SageMaker/Vertex AI/Azure ML).
  - **Edge**: Cloudflare Workers / Lambda@Edge / Cloud Run for latency-sensitive geo work.
- Anti-patterns: Lambda for steady high-RPS (becomes expensive), K8s for 2 services (overhead), long-running stateful on serverless (use a stateful backend).
- Output: `compute/<workload>.md` + sizing + scaling config.

### `/cloud storage <data>`
Select storage tier.
- Inputs: data shape (blob/structured/queue/stream/file), access pattern (hot/warm/cold/archive), durability target, retrieval latency, egress cost.
- Options:
  - **Object (S3/GCS/Azure Blob)**: blobs, static assets, backups, data lake. Lifecycle policies → IA → Glacier/Coldline/Archive.
  - **Block (EBS/PD/Managed Disks)**: single-instance DBs, low-latency local storage. Snapshots for backup.
  - **File (EFS/FSx/Cloud Filestore/Azure Files)**: shared POSIX filesystem, lift-and-shift.
  - **Queue (SQS/Pub-Sub/Service Bus)**: at-least-once async work. DLQ required.
  - **Stream (Kinesis/Event Hubs/Pub-Sub)**: ordered, replayable, real-time pipelines.
- Rules:
  - Lifecycle rules on every bucket (transition to cold tiers, expire incomplete multipart uploads, expire old versions).
  - Versioning on for critical data; lifecycle for old versions.
  - Cross-region replication for DR-critical data.
  - Public access blocked at account level (and bucket level). Signed URLs / pre-signed POSTs.
- Anti-patterns: putting a DB on object storage, ignoring lifecycle (paying for hot old data), public buckets, no versioning on critical data.
- Output: `storage/<data>.md` + lifecycle config.

### `/cloud database <data>`
Select database technology.
- Inputs: schema shape (relational/doc/wide-column/graph/search/time-series), access pattern (OLTP/OLAP/streaming), consistency needs, scale target, ops appetite.
- Map:
  - **Relational OLTP**: RDS/Aurora/Cloud SQL/Cloud Spanner/Azure SQL/Database. Pick managed unless you have a DB team. Multi-AZ HA. Read replicas for scale.
  - **Relational OLAP**: Redshift/BigQuery/Snowflake/Synapse. Decoupled from OLTP (no reporting on prod).
  - **Key-value / session**: DynamoDB/Firestore/Cloud Bigtable/Azure Cosmos DB (table API). Auto-scaling, single-digit-ms.
  - **Document**: MongoDB Atlas/Firestore/Cosmos DB (Mongo API). When schema flexibility matters.
  - **Wide-column**: Bigtable/Cosmos DB (Cassandra API)/Cassandra. Time-series at scale.
  - **Graph**: Neptune/Neo4j/Cosmos DB (Gremlin). Relationship-heavy queries.
  - **Search**: OpenSearch/Elasticsearch/Algolia/Vertex AI Search. Full-text + faceted search.
  - **Time-series**: Timestream/InfluxDB/QuestDB. Metrics + IoT.
  - **Cache**: ElastiCache (Redis)/Memorystore/Redis Cache. Sub-ms reads.
- Rules:
  - Backups automated, cross-region copy for RPO < 1h.
  - Encryption at rest (KMS) + in transit (TLS).
  - PII / regulated data: column-level encryption, audit logs on access.
  - Connection pooling (PgBouncer/RDS Proxy) at the app tier.
  - Schema migrations are IaC + runbook + rollback plan.
- Anti-patterns: running OLAP on OLTP, picking NoSQL for "we'll need scale someday", manual schema changes, no backup/restore drill.
- Output: `database/<data>.md` + sizing + HA + backup.

### `/cloud network-edge <system>`
Design DNS, CDN, load balancing, edge.
- Inputs: traffic sources (geo, protocol), latency SLO, TLS posture, WAF needs, origin topology.
- DNS:
  - Managed DNS (Route 53/Cloud DNS/Azure DNS) with health checks + latency/geolocation routing.
  - DNSSEC on. CAA records for cert issuance policy.
- CDN:
  - CloudFront/Cloud CDN/Front Door. Cache static at edge, dynamic origin shield for API.
  - Origin shield for cache hit ratio. Geo restrictions where needed.
- Load balancing:
  - **L7 (ALB/Application Gateway/Cloud Load Balancing HTTP)**: path/host routing, TLS termination, WAF integration.
  - **L4 (NLB/TCP Proxy/Standard Load Balancer)**: TCP/UDP, low latency, static IPs, preserves source IP.
  - **Global (GSLB/Cloud DNS routing/Front Door/Traffic Director)**: cross-region failover + geo routing.
- TLS:
  - Managed certs (ACM/Google-managed cert/Azure-managed) + auto-renew.
  - TLS 1.2+ only. HSTS with preload. OCSP stapling.
- WAF: managed rules + custom rules. Rate limiting at edge. Bot management for public APIs.
- Anti-patterns: TLS termination only at origin (no edge), CDN for personalized responses without cache key, L4 LB for HTTP-aware routing.
- Output: `network-edge/<system>.md` + routing table + cert config.

### `/cloud security <system_or_account>`
Design security posture.
- Inputs: data classification, compliance regime, identity model, network exposure, threat model.
- Layers:
  - **Identity & access**:
    - SSO (SAML/OIDC) + SCIM for humans. MFA enforced, WebAuthn preferred. Break-glass account monitored.
    - Workload identity (IAM roles for service accounts / Workload Identity / Managed Identity). No static creds in pods.
    - Role naming: `<tier>-<env>-<service>-<action>`. Permissions scoped to actions + resources + conditions (tags, region, time).
    - Permission boundaries / SCPs / Org policies to cap blast radius.
    - Privileged Access Management (PAM) for admin paths (just-in-time elevation).
  - **Network**:
    - Security groups / firewall rules: deny-by-default, explicit allow. 5-tuple where possible.
    - WAF on public endpoints. DDoS protection (Shield/Azure DDos) at edge.
    - Private subnets for stateful workloads. No public IPs on compute.
  - **Data**:
    - Encryption at rest (KMS/Cloud KMS/Key Vault), CMK for sensitive data.
    - Encryption in transit (TLS 1.2+). mTLS for service-to-service.
    - Secrets in Vault/SSM/Secret Manager + workload identity. Rotation policy.
    - DLP / Macie for data discovery in object stores.
  - **Detection**:
    - GuardDuty/Threat Detection / Defender / Chronicle. Anomaly + signature.
    - CloudTrail / Audit Logs / Activity Log → centralized SIEM. Tamper-proof (write-once bucket).
    - CSPM (Security Hub/SCC/Defender for Cloud) for posture.
- Rules: no long-lived keys, no public S3, no SSH-from-internet (SSM Session Manager / IAP / Bastion).
- Output: `security/<system>.md` + control matrix + IAM policy files.

### `/cloud reliability <system>`
Design for high availability within a region.
- Inputs: workload criticality, RTO/RPO targets, dependencies, traffic model.
- Patterns:
  - **Multi-AZ everything stateful**: ALB → ASG/ECS/EKS across ≥2 AZs. DB Multi-AZ with synchronous replica. Cache replicated.
  - **Stateless app tier**: any instance can serve any request. Session in store, not memory.
  - **Single-AZ avoidable**: ElastiCache cluster mode (multi-shard, multi-AZ), Aurora (storage replicated 6 ways across 3 AZs), EBS snapshots → cross-AZ copies.
  - **Health checks**: deep (not just process alive). Graceful drain (connection draining, deregistration delay).
  - **Capacity headroom**: 50% headroom for sudden spikes, 30% for steady-state — measured weekly.
- Anti-patterns: single AZ for prod, "no data loss" with single AZ DB, deep health checks that cause cascades, sync writes to a queue.
- Output: `reliability/<system>.md` + AZ matrix + failover runbook stub.

### `/cloud disaster-recovery <system>`
Design DR strategy and runbooks.
- Inputs: RTO/RPO targets per workload, budget, complexity tolerance.
- Tiers (pick one per workload):
  - **Backup & restore** (RTO hours, RPO hours): cold standby. Cheapest.
  - **Pilot light** (RTO 10s of minutes, RPO minutes): minimal version always running, scale up on failover.
  - **Warm standby** (RTO minutes, RPO seconds): scaled-down full env always running.
  - **Multi-site active-active** (RTO seconds, RPO ~0): full env in ≥2 regions, both serving traffic. Most expensive.
- Required artifacts:
  - **RTO/RPO matrix** per workload.
  - **Backup strategy**: automated, cross-region, encryption, retention policy, monthly restore drill.
  - **Failover runbook**: pre-checks, step-by-step, owner per step, comms plan, decision criteria (auto vs manual), rollback path.
  - **Failback runbook**: tested before the next incident.
  - **Game days**: quarterly chaos drill (region AZ loss, IAM compromise, DB failure).
- Output: `dr/<system>.md` + runbooks + game-day plan.

### `/cloud multi-region <system>`
Design global / multi-region architecture.
- Inputs: latency requirements, data residency, regulatory constraints, traffic distribution.
- Patterns:
  - **Active-passive**: primary region serves, secondary hot-standby. Failover manual or health-driven.
  - **Active-active (write local)**: regional writes, async replication. Conflict resolution by vector clocks / last-write-wins / CRDTs.
  - **Active-active (write global)**: only for workloads with conflict-free operations (counters, append-only, idempotent).
  - **Data residency**: regional data stores, geo-fenced IAM, no cross-region replication for restricted data.
- Required artifacts:
  - **Global routing**: Route 53 / Cloud DNS / Front Door / Traffic Manager with health-check failover.
  - **Data replication strategy**: sync vs async, conflict resolution, replication lag SLO.
  - **Per-region environment parity**: identical IaC, same observability stack, runbooks work in either region.
  - **Cost**: data egress between regions is non-trivial. Model it.
- Anti-patterns: multi-region without a reason, sync replication across continents (latency kills it), "active-active" that's actually active-passive with confused DNS.
- Output: `multi-region/<system>.md` + topology + replication + cost.

### `/cloud scalability <system>`
Design scaling model.
- Inputs: traffic shape (steady/bursty/unpredictable), workload type, response time SLO, cost ceiling.
- Levers:
  - **Horizontal scaling**: ASG / managed instance groups / HPA / KEDA. Scale on CPU, RPS, queue depth, custom metric.
  - **Vertical scaling**: only for stateful singletons (DB, cache primary). Bounded.
  - **Predictive scaling**: scheduled actions for known patterns (business hours, batch windows).
  - **Reactive scaling**: target tracking (e.g., 60% CPU) or step scaling. Cooldown to prevent thrash.
  - **Queue-based scaling**: scale workers on queue depth — natural backpressure.
  - **Caching**: CDN, application cache, DB read replicas, materialized views. Often cheaper than scaling compute.
- Capacity plan:
  - Baseline + forecast headroom. Per-shard/per-pod targets. Cost per 1k requests at each scale tier.
  - Load test before each major version. Document the cliff (where it breaks).
- Anti-patterns: scale on laggy metrics (5min CPU → already on fire), HPA with no min/max bounds, no cooldown, scaling without measuring.
- Output: `scalability/<system>.md` + scaling config + capacity model.

### `/cloud observability <system>`
Design logs, metrics, traces, alerts.
- **Logs**: structured JSON, correlation ID propagated end-to-end, sent to central store (CloudWatch/SCC/Log Analytics). Retention tiered (hot 30d, warm 1y, cold 7y).
- **Metrics**: RED (Rate, Errors, Duration) for services. USE (Utilization, Saturation, Errors) for resources. Custom business metrics at the boundary. Cardinality bounded (no user IDs in metric labels).
- **Traces**: distributed tracing (OpenTelemetry), sampling policy (head + tail-based), span attributes for routing/env/version.
- **Dashboards**: per-service (golden signals), per-workload (business), per-platform (shared infra). Owner-tagged.
- **Alerts**:
  - On SLO burn rate (preferred) — not on raw CPU.
  - Symptom-based (users affected), not cause-based (CPU high). Cause alerts for known failure modes only.
  - Page-worthy alerts: <5, every one has a runbook. Everything else is a ticket.
- Anti-patterns: alerting on CPU/memory alone, no correlation IDs, unbounded cardinality, logs nobody reads, dashboards per-host instead of per-service.
- Output: `observability/<system>.md` + dashboards + alert rules.

### `/cloud slo <service>`
Define SLI/SLO/SLA.
- Inputs: user journey, what "good" means to the user, dependency behavior.
- Steps:
  1. **Pick the user journey**: e.g., "search returns relevant results", "checkout completes", "API responds".
  2. **Define SLI**: availability (success / total) + latency (fraction under threshold) + freshness (for data).
  3. **Set SLO target**: start with a stretch from current baseline (e.g., current 99.7% → target 99.9%). Justify against user value.
  4. **Set error budget**: `1 - SLO` over a window (30d rolling common). Budget burn alerts (fast/slow).
  5. **Derive SLA from SLO** (SLA ≤ SLO): legal contract layer. Burn the budget → freeze non-critical changes.
- Output: `slo/<service>.md` + SLO doc + burn-rate alerts.

### `/cloud cost-optimize <workload_or_account>`
FinOps deep dive.
- Inputs: billing data, workload inventory, tag coverage, current spend.
- Levers:
  - **Right-sizing**: compute (downsize over-provisioned), storage (lifecycle), DB (instance class).
  - **Pricing models**:
    - On-demand for ephemeral + low utilization.
    - Reserved/Committed Use (1y/3y) for steady-state baselines. Savings Plans for flexibility across families/regions.
    - Spot/Preemptible for fault-tolerant batch/ML.
    - Savings Plans / CUDs / RIs tracked + utilization alerts.
  - **Storage tiering**: lifecycle to IA / Glacier. Delete stale snapshots, old log groups, unused volumes.
  - **Data transfer**: minimize cross-AZ/cross-region egress. Same-AZ for chatty services. Cache at edge.
  - **Tagging**: enforce tag policy. Cost allocation tags. Untagged = untrackable.
  - **Scheduling**: dev/test envs off nights + weekends. Auto-stop with tag-based scheduler.
- Reports: per-service cost, per-team cost, per-feature cost (where attributable), cost per 1k requests, commitment utilization.
- Anti-patterns: RI/SP coverage without utilization check, "always on" dev envs, lifecycle rules as afterthought, untagged resources.
- Output: `cost/<scope>.md` + savings opportunities + committed-spend plan.

### `/cloud iac <module_or_service>`
Author Terraform / Pulumi / CloudFormation.
- Inputs: resources to manage, provider, state backend, team conventions.
- Standards:
  - **Module structure**: `modules/<name>/` with `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `README.md`, `examples/`. Pin provider versions.
  - **State**: remote backend (S3+GCS+Azure Blob with locking — DynamoDB / GCS lock / Blob lease). Encrypted at rest. Versioned.
  - **Variables**: typed, validated, documented, with sensible defaults. No secrets in variables — use data sources for secrets.
  - **Outputs**: typed, documented, marked sensitive where needed.
  - **Naming**: consistent (`<env>-<region>-<service>-<purpose>`). Tags applied via provider default_tags / Azure policy / org-level tags.
  - **Plan in CI**: `terraform plan` on PR, comment diff. Apply gated on approval + policy checks.
  - **Drift detection**: scheduled `terraform plan` against live state. Alerts on drift.
- Anti-patterns: state in local, secrets in tfvars, copy-paste modules, console drift, untested modules.
- Output: `<module>/` + module README + example + tests (terraform test / tftest / kitchen-terraform).

### `/cloud iac-review <path_or_pr>`
Review existing IaC for best practices.
- Checks: provider version pinned, state backend configured, no hardcoded secrets, no public S3 / 0.0.0.0/0 SG, tags applied, encryption on, backups defined, deletion protection, lifecycle rules, IAM least privilege, drift detection configured, plan in CI, sensitive outputs marked.
- Tooling: tflint / tfsec / checkov / terrascan / Sentinel. Rules in CI, not just locally.
- Output: review report — `Aligned` / `Violation` / `Risk` per check + suggested diff.

### `/cloud landing-zone <org>`
Design org / multi-account / multi-subscription structure.
- Inputs: team size, workload count, separation needs (prod/non-prod/PCI/sandbox), regulatory constraints.
- Structure:
  - **Organization**: org root with SCPs / Org policies / Azure Management Groups.
  - **Account / subscription layout**:
    - `management` (log archive, security tooling, networking hub).
    - `shared-services` (CI/CD, artifact registry, identity, secrets).
    - `network-hub` (centralized VPC/VNet, transit gateway, DNS).
    - `prod-<workload>` per workload (blast-radius isolation).
    - `nonprod-<env>` (dev/staging/qa, separate OU/subscription with looser SCPs).
    - `sandbox` (developer experiments, isolated, low quota).
    - `data-<classification>` (PII / regulated data, separate account).
  - **Baseline**: every new account has the baseline applied (logging, GuardDuty, IAM baselines, tag policy, SCPs). Via Control Tower / Landing Zone Accelerator / Azure Landing Zone / Terraform Landing Zone.
  - **Networking**: hub-and-spoke or AWS Network Firewall / Cloud NGFW central egress.
  - **Identity**: SSO + IdP (Okta/Entra ID). Break-glass accounts in a sealed envelope.
- Anti-patterns: one giant account, prod and nonprod in same account, no log archive account, console root used day-to-day.
- Output: `landing-zone/<org>.md` + account map + SCPs + baseline module.

### `/cloud threat-model <system>`
STRIDE threat model.
- Steps:
  1. **Diagram the system**: data flows, trust boundaries, assets, actors.
  2. **Identify threats** per element (STRIDE: Spoofing, Tampering, Repudiation, Info disclosure, Denial of service, Elevation of privilege).
  3. **Rate each threat**: likelihood × impact → risk score.
  4. **Mitigations**: per threat, with owner + status.
  5. **Review cadence**: on every architecture change, every 6 months minimum.
- Output: `threat-models/<system>.md` + diagram + threat register.

### `/cloud compliance <framework>`
Map controls to a framework (SOC2 / HIPAA / PCI-DSS / GDPR / ISO 27001 / FedRAMP).
- Inputs: framework, in-scope systems, evidence sources.
- Approach:
  - **Controls as code**: policies expressed in OPA/Sentinel/Config Rules. Evaluated in CI + at runtime.
  - **Continuous evidence**: CloudTrail, Config, security findings → compliance dashboard. No screenshots at audit time.
  - **Control mapping**: each framework control → 1+ technical controls + 1+ evidence source. Owner per control.
  - **Access reviews**: quarterly IAM + repo + data access reviews. Documented.
  - **Vendor reviews**: subprocessors assessed, DPAs in place, security questionnaires current.
- Anti-patterns: manual evidence collection, "we're compliant because the auditor said so last year", no continuous monitoring.
- Output: `compliance/<framework>.md` + control matrix + evidence pipeline.

### `/cloud migration <source_system>`
Plan a workload migration (6Rs).
- Inputs: source system, business drivers, target platform, timeline.
- 6Rs (pick per workload):
  - **Rehost** (lift-and-shift): VMs to VMs. Fast, low risk, no optimization. Good for "get out of the data center."
  - **Replatform**: lift + minor changes (managed DB, containerize). Medium effort, real wins.
  - **Refactor / re-architect**: redesign for cloud-native. Highest value, highest risk.
  - **Repurchase**: SaaS replacement (e.g., custom CMS → SaaS).
  - **Retire**: dependency graph reveals unused. Delete.
  - **Retain**: keep on-prem (compliance, latency, economics).
- Process:
  - **Discovery**: dependency map, traffic, cost, owner.
  - **Plan**: per-workload 6R choice + sequenced waves + rollback plan.
  - **Pilot**: 1-2 workloads validate the pattern.
  - **Wave execution**: per wave — migrate, validate, cutover, monitor, decommission source.
  - **Patterns**: strangler fig, lift-shift-optimize, parallel run, dark launch.
- Output: `migration/<system>.md` + dependency map + wave plan + decision per workload.

### `/cloud chaos <system>`
Plan chaos engineering experiments.
- Inputs: steady-state hypothesis, fault to inject, blast radius.
- Process:
  1. **Hypothesis**: "Under X fault, system still serves Y% of requests within SLO."
  2. **Smallest blast radius first**: dev → staging → single canary prod → broader. Game day for prod-scale.
  3. **Inject**: AZ loss, region failover, IAM compromise, DB failover, network partition, latency, packet loss, DNS failure, dependency 5xx, dependency slow, CPU/memory exhaustion, clock skew.
  4. **Observe**: dashboards + alerts. Did the hypothesis hold? Did anything unexpected break?
  5. **Fix gaps**: missing circuit breakers, missing timeouts, missing runbooks.
  6. **Automate**: turn into a recurring drill (Chaos Mesh / Gremlin / AWS FIS / Azure Chaos Studio).
- Rules: stop conditions defined upfront. On-call notified. Customer-impacting experiments in business hours only.
- Output: `chaos/<experiment>.md` + hypothesis + result + remediation.

### `/cloud adr <decision>`
Architecture Decision Record.
- Sections:
  - **Status**: Proposed / Accepted / Deprecated / Superseded by ADR-NNN.
  - **Context**: what forced this decision. Forces, constraints, assumptions.
  - **Options considered**: ≥2, with pros/cons each.
  - **Decision**: what we picked.
  - **Consequences**: positive, negative, neutral. What becomes harder/easier.
  - **Review date**: when to revisit.
- Format: `docs/adr/NNNN-<slug>.md`. Numbered, never deleted (only superseded).
- Output: single ADR markdown file.

### `/cloud well-architected <system_or_account>`
Well-Architected Framework review (AWS / GCP / Azure equivalents).
- Pillars:
  - **Operational excellence**: IaC, observability, automation, runbooks.
  - **Security**: IAM, encryption, network, data, detection, response.
  - **Reliability**: HA, DR, scaling, failure handling.
  - **Performance efficiency**: right-sized compute, caching, CDN, database tuning.
  - **Cost optimization**: right-sizing, pricing models, lifecycle, tagging.
  - **Sustainability** (newer pillar): efficient utilization, low-carbon regions, workload scheduling.
- Output: per-pillar score, top risks, remediation backlog.

### `/cloud governance <org>`
Architecture guardrails and policy as code.
- Layers:
  - **Org policies / SCPs / Azure Policy**: deny or audit at the org root. Region restrictions, service restrictions, public-access bans.
  - **Account baseline**: every new account inherits the baseline (logging, GuardDuty, IAM, tags).
  - **CI policies**: tflint, tfsec, checkov, OPA. PR can't merge with policy violations.
  - **Runtime policies**: Config Rules / SCC / Defender for Cloud. Continuous evaluation.
  - **Architecture review board**: lightweight, on-demand. ADRs gate high-impact decisions.
- Anti-patterns: policies that block valid work without explanation, no exception process, no owner per policy.
- Output: `governance/<org>.md` + policy catalog + exception process.

## 4. Execution Order (Cloud Architecture Cycle)

For a new system or major version:

1. `/cloud adr <key_decisions>` → write the decision record first
2. `/cloud arch-design <system>` → overall architecture
3. `/cloud landing-zone <org>` → org/account structure (if not done)
4. `/cloud topology <system>` → network
5. `/cloud security <system>` → IAM + encryption + secrets
6. `/cloud network-edge <system>` → DNS + CDN + LB + TLS
7. `/cloud compute <workload>` → compute platform
8. `/cloud storage <data>` → storage tiers + lifecycle
9. `/cloud database <data>` → DB choice + backup
10. `/cloud reliability <system>` → multi-AZ + health checks
11. `/cloud scalability <system>` → scaling + capacity
12. `/cloud observability <system>` → logs + metrics + traces + alerts
13. `/cloud slo <service>` → SLI/SLO/SLA
14. `/cloud disaster-recovery <system>` → DR tier + runbooks
15. `/cloud multi-region <system>` (if needed) → global topology
16. `/cloud cost-optimize <system>` → right-size + commitments
17. `/cloud threat-model <system>` → STRIDE
18. `/cloud compliance <framework>` (if applicable) → controls + evidence
19. `/cloud iac <module>` → Terraform / Pulumi / CFN
20. `/cloud iac-review <path>` → IaC review pass
21. `/cloud chaos <system>` → game day plan
22. `/cloud well-architected <system>` → final review
23. `/cloud governance <org>` (if new org) → guardrails

> 🛑 **No production workload without: ADR, IaC, multi-AZ, backups, observability, SLO, runbooks, threat model reviewed, baseline applied.**

## 5. Output Location
All artifacts written to the system's repo by default. Architecture docs under `arch/`, IaC under `infra/` (or `terraform/`, `pulumi/`), runbooks under `runbooks/`, ADRs under `docs/adr/`, diagrams under `diagrams/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing cloud architecture:

1. **Landing Zone Hygiene**: Org/subscription structure, SCPs/Org Policies applied, log archive, baseline on every account.
2. **Topology Discipline**: CIDR plan documented, subnets tiered, NACLs/SGs explicit, no public DB subnets, NAT per AZ.
3. **Compute Right-Sizing**: Utilization >40% on average; sustained <20% = over-provisioned; sustained >80% = under-provisioned.
4. **Storage Lifecycle**: Lifecycle rules on every bucket; no public buckets; versioning + replication where required.
5. **Database Posture**: Multi-AZ on, encryption at rest + in transit, automated backups, cross-region copy for critical, restore tested.
6. **IAM Least Privilege**: No long-lived keys, workload identity in use, role naming consistent, permission boundaries set, break-glass monitored.
7. **Secrets Hygiene**: No secrets in code/env/config; rotation policy; audit access.
8. **Encryption Coverage**: TLS 1.2+ in transit (verify with scanner), KMS at rest, CMK for sensitive data.
9. **Network Edge**: TLS termination at edge, HSTS preload, WAF on public endpoints, DNS health checks + failover.
10. **Reliability Patterns**: Multi-AZ stateful, stateless app tier, deep health checks, graceful drain.
11. **DR Readiness**: RTO/RPO defined per workload, runbooks exist and tested, backups verified.
12. **Multi-Region Posture**: If multi-region — replication strategy documented, failover tested, conflict resolution defined.
13. **Scalability Signals**: HPA/ASG configured with min/max + cooldown, scaling on right metrics, load test evidence.
14. **Observability Maturity**: Structured logs with correlation IDs, RED/USE metrics, distributed traces, SLO-based alerts (not CPU-only).
15. **SLO Definition**: SLI/SLO/SLA defined per critical service, error budget tracked.
16. **Cost Posture**: Tagging enforced, RI/SP coverage tracked + utilized, dev envs scheduled off, lifecycle in use, no stale resources.
17. **Threat Model Currency**: STRIDE done in last 6 months or after last major change.
18. **Compliance Evidence**: Continuous evidence pipeline (no screenshots), control owners assigned, access reviews quarterly.
19. **IaC Compliance**: All infra in IaC, state remote + locked, plan in CI, drift detection, secrets not in code.
20. **Guardrail Enforcement**: Org policies evaluated continuously, CI policy checks, exception process documented.
21. **Chaos Practice**: Quarterly game days run, experiments automated, stop conditions defined.
22. **ADR Discipline**: Non-trivial decisions have ADRs, dated, reviewed.

Output: A report listing `Aligned` components and `Violation` instances with concrete fixes + effort estimate + risk rating.

## 7. Hard Rules
- **Never** run production workloads in a single AZ.
- **Never** store secrets in code, env vars, config files, or unencrypted parameter stores.
- **Never** allow long-lived access keys for workloads — use workload identity.
- **Never** leave a bucket/database/subnet public by default.
- **Never** skip encryption in transit (TLS 1.2+) or at rest (KMS).
- **Never** ship a system without an SLO, runbook, and observability stack.
- **Never** apply infrastructure via the console — IaC or pipeline only.
- **Never** make a major architectural choice without an ADR.
- **Never** trust a backup — restore-test quarterly.
- **Never** rely on CPU/memory alerts as your only signal — alert on SLO burn.
- **Always** apply the landing-zone baseline to every new account/subscription before workload landing.
- **Always** design for failure: every dependency has a timeout, retry policy, and circuit breaker.
- **Always** tag every resource — untagged = untrackable = invisible cost.
- **Always** size for headroom, not for current peak.
- **Always** document the RTO/RPO per workload and verify with a drill.