---
name: database-engineer
description: Production database engineering — engine selection, schema design, indexing (B-tree, GIN, BRIN, covering, partial), partitioning, sharding, query optimization + EXPLAIN plans, online schema migrations (expand-migrate-contract, gh-ost, pgroll, pg_repack), replication topologies (sync/async/logical), high availability + failover, disaster recovery + PITR, backup/restore drills, connection pooling + read-write proxies, observability (pg_stat, slow query, locks, lag), DB security (TLS, IAM, RLS, column encryption, audit), compliance (PCI/HIPAA/GDPR), upgrades, capacity planning, FinOps, multi-region, and data lifecycle. Pairs with `data-architect` (modeling + governance), `cloud-architect` (infrastructure), `backend-rest-api` (consuming services), and `sre` (incident response).
---

- **Execution**: Run `/db <action> [args]`. Actions: `db-select`, `schema-design`, `index`, `partition`, `sharding`, `query-optimize`, `migration`, `replication`, `ha`, `dr`, `backup`, `restore-drill`, `connection-mgmt`, `observability`, `security`, `compliance`, `upgrade`, `capacity`, `cost`, `lifecycle`, `multi-region`, `adr`, `audit`.

# Database Engineer Protocol

## 1. Mission
Operate databases that are **fast, durable, available, evolvable, and trusted**. The database engineer owns the engine + the schema + the operations: how it's tuned, how it survives failure, how it grows, how it changes without breaking consumers, and how it's defended. Most production disasters begin or end at the database layer. Treat it as load-bearing infrastructure — because it is.

> **Core principle:** Every byte in the database is on someone's critical path. The schema is a contract (see `data-architect`), the engine is the runtime, the operations are the SLA. Get any of those three wrong and the system is broken — even if the app is "fine."

## 2. Standards
Every database artifact MUST follow these rules:

- **Engine choice is justified**: write the ADR before provisioning. Match engine to workload (OLTP / OLAP / key-value / time-series / search / vector). Default to managed unless there's a reason not to.
- **Schema is a contract**: declarative DDL in version control, peer-reviewed, applied via migration pipeline. No ad-hoc `ALTER TABLE` against prod.
- **Migrations are online**: zero-downtime or staged-downtime with explicit window. Expand → migrate → contract. Locks held for ≤ seconds. Tested on realistic data volumes.
- **Backups are tested**: full + incremental + WAL/binlog continuous archiving. Restore-drill quarterly with measured RTO. Backup ≠ DR — both exist.
- **High availability is default**: every stateful production DB runs in HA topology (primary + replica + automated failover). Single-instance prod is a defect.
- **Replication is intentional**: sync vs async chosen per workload with RPO impact documented. Lag is monitored and alerted.
- **Connection management is not an afterthought**: pooling at the app tier or via proxy. Connection storms are diagnosed and capped. Auth not bypassed.
- **Indexes earn their keep**: every index justified by a query pattern. Unused indexes removed. Composite indexes ordered by selectivity.
- **Queries are measured**: EXPLAIN ANALYZE before shipping. Slow query log reviewed weekly. N+1 patterns caught in review.
- **Observability is a deployment prerequisite**: pg_stat / performance_schema / sys metrics exported to central store. Per-query latency, locks, replication lag, cache hit ratio, IOPS, connections, vacuum/bloat.
- **Security is layered**: TLS in transit, encryption at rest with KMS/CMK, IAM/least-privilege roles, row-level security where multi-tenant, audit log on access for sensitive data.
- **PII is handled at the column**: column-level encryption or tokenization for sensitive fields; deterministic masking for non-prod restore.
- **Capacity is planned, not reacted**: IOPS, connections, storage, CPU, memory sized with documented headroom. Saturation alerts at 70%.
- **Upgrades are routine**: minor versions monthly, major versions within N months of GA. Upgrades tested in staging against production query mix.
- **Cost is visible per cluster**: tag every instance/replica. Right-size annually. Serverless vs provisioned trade-off explicit.
- **Lifecycle is policy-driven**: TTL on ephemeral data, archival tier for cold data, hard delete on legal hold release.
- **Schema change is a deploy**: every ALTER is code-reviewed, migration-tested, observable in flight, reversible.
- **Boring proven engines on the hot path**: Postgres / MySQL / managed equivalents by default. Exotic engines for non-critical or sandbox.
- **The database is a peer**: engineers talk to DBAs/engineers before designing queries that touch the hot path. Schema review is required for new tables.

## 3. Workflow Actions

### `/db db-select <workload>`
Select a database engine.
- Inputs: workload (OLTP / OLAP / key-value / time-series / search / vector / graph / document), consistency model, scale target, ops appetite, license.
- Decision tree:
  - **OLTP relational, strong consistency, complex queries**: Postgres (managed: RDS/Aurora/Cloud SQL/Cloud SQL Enterprise/AlloyDB/Azure DB for Postgres/CockroachDB for global) or MySQL (managed: RDS/Aurora MySQL/Cloud SQL/Azure DB for MySQL).
  - **OLTP at extreme scale, single-digit-ms latency, predictable**: Spanner / CockroachDB / Yugabyte (globally distributed SQL) or DynamoDB / Cosmos DB / Firestore (NoSQL single-region).
  - **OLAP / analytical queries on large data**: ClickHouse / Snowflake / BigQuery / Redshift / Databricks SQL (see `data-architect` for warehouse).
  - **Key-value / session / cache**: Redis / Valkey / ElastiCache / Memorystore / KeyDB.
  - **Time-series**: TimescaleDB (Postgres extension) / InfluxDB / Timestream / QuestDB.
  - **Full-text + analytics**: OpenSearch / Elasticsearch / Meilisearch / Typesense.
  - **Vector / similarity**: pgvector / Pinecone / Weaviate / Qdrant / Vertex Vector Search (see `data-architect` `ml-data`).
  - **Graph**: Neo4j / Neptune / Cosmos DB (Gremlin).
  - **Document / schemaless**: MongoDB Atlas / Firestore / Cosmos DB (Mongo API) / DynamoDB.
  - **Wide-column at massive scale**: Cassandra / ScyllaDB / Cosmos DB (Cassandra API) / HBase / Bigtable.
- Standards:
  - **Default**: managed service over self-hosted unless regulatory/latency/economics dictate otherwise.
  - **License**: know your license (AGPL, SSPL, BSL). Avoid vendor lock-in patterns where possible.
  - **Tooling**: backup/restore built-in, online schema change supported, point-in-time recovery, monitoring hooks.
- Anti-patterns: MongoDB because "we don't know the schema", Postgres for OLAP at PB scale, picking Cosmos for "multi-region" without understanding consistency model, self-hosting what you could pay AWS to run.
- Output: `db/<engine>.md` + ADR + capability matrix.

### `/db schema-design <entity>`
Schema design (DDL, types, constraints).
- Inputs: entity, query patterns, write rate, storage budget, expected growth.
- Standards:
  - **Naming**: snake_case, plural table names, singular column names for attributes (or whichever is team convention; document it).
  - **Primary keys**:
    - Surrogate: `BIGINT GENERATED ALWAYS AS IDENTITY` or `UUIDv7` (sortable). Avoid UUIDv4 for clustered indexes — fragmentation.
    - Business keys: declared unique via constraint, not as PK.
  - **Foreign keys**: declared; cascade behavior explicit (`ON DELETE RESTRICT` default; `CASCADE` documented when used).
  - **Types**:
    - Use the smallest type that fits: `SMALLINT` vs `INT` vs `BIGINT` by range.
    - `TIMESTAMPTZ` not `TIMESTAMP` (always store in UTC).
    - `NUMERIC` for money (never `FLOAT`).
    - `TEXT` + `CHECK(length)` over `VARCHAR(N)` unless there's a hard cap.
    - `JSONB` (Postgres) for genuinely polymorphic attributes — not as a modeling escape.
  - **Constraints**: `NOT NULL` aggressively; `CHECK` for invariants; `UNIQUE` for business keys.
  - **Defaults**: explicit `DEFAULT` on every column (don't rely on implicit NULL).
  - **Audit columns**: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `created_by`, `updated_by`. Maintained via triggers or app code (documented).
  - **Soft delete**: `deleted_at TIMESTAMPTZ NULL` (or hard delete — explicit decision).
  - **Comments**: `COMMENT ON TABLE/COLUMN` for self-documenting catalog.
- Patterns:
  - **Temporal tables**: SCD2 (`valid_from`, `valid_to`, `is_current`) for history retention. Or use TimescaleDB hypertables / system-versioned tables where native.
  - **Lookup tables**: separate table with FK for fixed enumerations; avoid magic strings.
  - **Polymorphic associations**: explicit discriminator column + JSONB for the variant payload (preferred over polymorphic FKs).
  - **Outbox pattern**: append-only `outbox` table written in same transaction as business write; CDC publishes downstream.
- Anti-patterns: EAV, "we'll add constraints later", UUIDv4 PKs on clustered indexes, FLOAT for money, default-null for everything, magic string status fields without enum/lookup.
- Output: `schema/<table>.sql` + ER snippet + DDL + comments + review checklist.

### `/db index <table_or_query>`
Indexing strategy.
- Inputs: query patterns (per-table WHERE/ORDER BY/GROUP BY/JOIN), write amplification budget, cardinality.
- Index types:
  - **B-tree**: default. Equality + range. Composite — leftmost prefix rule.
  - **Hash** (Postgres): equality only. Smaller than B-tree for equality-only patterns.
  - **GIN**: full-text (tsvector), JSONB (`@>`), arrays (`&&`).
  - **BRIN**: huge append-only tables (timeseries, logs). Tiny storage, range scans.
  - **Partial**: `WHERE deleted_at IS NULL` for soft-delete tables, `WHERE status = 'active'`.
  - **Covering**: `INCLUDE (col1, col2)` for index-only scans.
  - **Expression**: `CREATE INDEX ON users (lower(email))` for case-insensitive lookups.
  - **Functional/bitmap**: vendor-specific.
- Patterns:
  - **Composite column order**: equality first, then range, then sort. Highest cardinality first (rule of thumb, verify with EXPLAIN).
  - **Index for FK**: every FK column gets an index or the JOIN degrades.
  - **Covering for hot paths**: include SELECT columns to avoid heap fetch.
  - **Don't double-index**: `(a)` is implicitly a prefix of `(a, b)`.
  - **Measure write amplification**: every index slows writes; track INSERT/UPDATE latency.
- Maintenance:
  - **`pg_stat_user_indexes`**: identify unused indexes (`idx_scan = 0`) — candidates for drop.
  - **`pg_stat_user_tables`**: identify missing indexes (sequential scans on large tables).
  - **Bloat**: rebuild periodically (`REINDEX CONCURRENTLY`).
- Anti-patterns: "index everything" (write amplification), `SELECT *` defeating covering indexes, missing index on FK, leftmost-prefix violations.
- Output: `indexes/<table>.md` + index list + query → index map + unused-index candidates.

### `/db partition <table>`
Partitioning strategy.
- Inputs: row count, growth rate, hot/cold distribution, query patterns, retention policy.
- Types:
  - **Range**: time-series (`PARTITION BY RANGE (created_at)`). Monthly/weekly partitions. Drop old partitions instead of DELETE.
  - **List**: discrete keys (region, tenant). For multi-tenant by tenant_id.
  - **Hash**: even distribution when no natural key. Helps write distribution.
  - **Composite**: range + list, range + hash.
- Standards:
  - **Partition key in primary key**: required in Postgres (PK must include partition columns).
  - **Index per partition** vs **global index**: vendor-specific. Postgres indexes are local; Oracle/MySQL have global. Know the trade-off.
  - **Retention**: `DROP PARTITION` (instant) over `DELETE` (vacuum-heavy). For "delete the last 90 days" the answer is a partition drop, not a row delete.
  - **Migration of existing data**: repartition by creating new partitioned table + COPY + swap (online).
- Patterns:
  - **TimescaleDB hypertables**: automatic time-based chunking; continuous aggregates.
  - **Postgres native partitioning** since v11 (good); pre-partition pruning in v11+ (great).
  - **MySQL partitioning**: long-supported, but no global indexes — design carefully.
- Anti-patterns: too few partitions (no pruning benefit), too many (planning overhead, files), partition key not in query WHERE, DELETE instead of DROP PARTITION for time-series.
- Output: `partitioning/<table>.md` + DDL + retention jobs + query plan evidence.

### `/db sharding <dataset>`
Sharding strategy.
- When to shard (only when necessary):
  - **Vertical first**: split columns into separate tables/instances (read replicas, feature stores).
  - **Functional first**: split by service/domain (orders DB vs users DB).
  - **Then read replicas**: scale reads.
  - **Then sharding**: scale writes beyond a single primary can handle.
- Inputs: target write throughput, dataset size, query locality, resharding cost.
- Strategies:
  - **Shard by tenant (customer_id)**: SaaS multi-tenant. Each tenant on one shard.
  - **Shard by geography (region)**: data residency + lower latency.
  - **Hash sharding (hash(user_id))**: even distribution, no natural key.
  - **Range sharding**: time or id ranges.
- Standards:
  - **Shard key in every query**: cross-shard queries are expensive (scatter-gather). Design the access pattern to keep queries local.
  - **Joins across shards**: avoided. Materialized views, denormalized projections, or "global lookup tables" replicated to all shards.
  - **Resharding plan**: how to add a shard without downtime (Vitess-style rebalancer, consistent hashing ring, manual migration window).
  - **Per-shard HA**: each shard is itself HA (primary + replica).
- Tools: Vitess (MySQL), Citus (Postgres extension), CockroachDB / Yugabyte / Spanner (built-in), MongoDB sharded cluster, DynamoDB partitioning (built-in).
- Anti-patterns: sharding when vertical/read-replica scaling would suffice, shard key in only 50% of queries, cross-shard JOINs as the default, no resharding plan.
- Output: `sharding/<dataset>.md` + shard key choice + topology + resharding runbook.

### `/db query-optimize <query>`
Optimize a slow query.
- Steps:
  1. **Get the actual query + frequency**: not the example from the ticket — the real production query.
  2. **`EXPLAIN (ANALYZE, BUFFERS, VERBOSE)`** (Postgres) / **`EXPLAIN ANALYZE`** (MySQL) / execution stats (DynamoDB).
  3. **Identify the bottleneck**:
     - Sequential scan on large table → missing index.
     - Nested loop with many iterations → better join order or hash join.
     - Sort spilling to disk → work_mem too low or sort needed earlier.
     - Lock waits → contention pattern.
     - Many buffer hits on cold data → cache miss pattern.
  4. **Hypothesize + test**: change one thing, measure.
  5. **Common wins**:
     - Add covering index.
     - Rewrite correlated subquery as JOIN.
     - Replace `SELECT *` with explicit columns.
     - Filter earlier (push down predicates).
     - Replace `OR` with `UNION ALL` of indexed cases.
     - Use `EXISTS` over `IN` for subqueries.
     - Avoid functions on indexed columns (`WHERE date(created_at)` breaks index; use range).
  6. **Statistics**: ensure `ANALYZE` ran recently; extended statistics on correlated columns (Postgres `CREATE STATISTICS`).
  7. **Cache**: materialized views for aggregations, Redis for hot lookups.
- Tools: `EXPLAIN`, `pg_stat_statements`, `auto_explain`, `pg_hint_plan`, slow query log, query store (MySQL/Postgres/MSSQL).
- Output: `optimize/<query>.md` + before/after EXPLAIN + index DDL + query rewrite + measured improvement.

### `/db migration <change>`
Online schema migration.
- Inputs: change (add/remove column, change type, add constraint, rename, backfill, partition), table size, write rate, downtime tolerance.
- **Expand → migrate → contract** pattern (online):
  1. **Expand**: add new structure non-destructively. New column nullable, new table, dual-write in app.
  2. **Migrate**: backfill old → new. Throttled. Monitor.
  3. **Switch reads**: app reads from new.
  4. **Switch writes**: app writes only to new.
  5. **Contract**: drop old structure (after observation period).
- Tools:
  - **MySQL**: `gh-ost` (GitHub), `pt-online-schema-change` (Percona).
  - **Postgres**: `pgroll` (Xata), `pg_repack`, manual expand-migrate-contract.
  - **MongoDB**: rolling index build, schema versioning.
  - **Vitess**: `OnlineDDL`.
  - **Cloud-managed**: RDS / Aurora zero-apply, Cloud SQL zero-downtime DDL (limited), Spanner online schema changes (native).
- Standards:
  - **Migrations in version control** (Liquibase / Flyway / Sqitch / Atlas / Drizzle).
  - **Reversible**: every migration has a rollback (or a documented reason it doesn't).
  - **CI**: dry-run on production-size snapshot. EXPLAIN the change. Lock duration estimated.
  - **Approval**: DDL on prod requires review (DBA or peer).
  - **Observability in flight**: lock waits, replication lag, error rate during the change.
- Patterns:
  - **Add NOT NULL column**: add nullable, backfill in batches, set NOT NULL with `VALIDATE CONSTRAINT` (Postgres) — `NOT VALID` first, `VALIDATE` later, avoids full table lock.
  - **Add index**: `CREATE INDEX CONCURRENTLY` (Postgres). `ALGORITHM=INPLACE, LOCK=NONE` (MySQL).
  - **Change type**: add new column of new type, dual-write, backfill, switch, drop old.
  - **Rename**: add new, dual-write, switch, drop. Don't just `RENAME` (breaks running app).
- Anti-patterns: `ALTER TABLE` on huge table without testing, single-transaction backfill (long lock), renaming without expand-contract, dropping column without app confirmation.
- Output: `migrations/<change>.md` + expand-migrate-contract steps + tools + rollback + observability plan.

### `/db replication <topology>`
Replication topology design.
- Inputs: durability, RPO/RTO targets, read scale, geographic distribution, write throughput.
- Modes:
  - **Synchronous**: zero data loss on primary failure. Latency cost on every write. For critical data with strict RPO=0.
  - **Asynchronous**: low write latency, risk of lag-bound data loss on failover. Most common.
  - **Semi-synchronous** (MySQL): one ack before commit, more replicas async. Compromise.
  - **Logical**: row-based change stream. Powers CDC consumers. Decoupled from HA.
- Topologies:
  - **Primary + replicas**: read replicas for scale; one promoted to primary on failover.
  - **Cascading**: replica → replica → replica (read fanout).
  - **Multi-primary (active-active)**: writes on multiple primaries (MySQL Group Replication, Galera, Postgres BDR, CockroachDB). Conflict resolution required.
  - **Cross-region**: async replica in another region for DR. Network latency aware.
- Standards:
  - **WAL/binlog retention**: enough for both HA failover and CDC catchup.
  - **Replication lag**: monitored per replica. Alerts on lag > SLO.
  - **Failover**: automated (managed: RDS Multi-AZ, Cloud SQL HA, Aurora) or manual with runbook (self-managed). Manual preferred for catastrophic cases to avoid split-brain.
  - **Read-after-write**: route reads-after-writes to primary (or to a non-lagging replica). Use session affinity or "stale-by-N" replica preference.
- Anti-patterns: synchronous replication across continents (latency kills writes), async without lag alerting, single replica (no HA), promoting a lagging replica as primary without acknowledging data loss.
- Output: `replication/<topology>.md` + topology diagram + RPO/RTO + failover runbook.

### `/db ha <cluster>`
High availability + failover design.
- Inputs: RTO/RPO, engine, budget, automation tolerance.
- Patterns:
  - **Managed HA** (preferred): RDS Multi-AZ, Aurora, Cloud SQL HA, Azure SQL Business Critical, Cosmos DB multi-region. Automated failover, 60-120s typical.
  - **Self-managed HA**:
    - Postgres: Patroni + etcd/Zookeeper for leader election + fencing. Repmgr + keepalived for VIP.
    - MySQL: MHA, Orchestrator, Group Replication, InnoDB Cluster.
    - MongoDB: replica set (3 nodes minimum).
  - **Synchronous replica in same region** for RPO=0. Async replicas elsewhere.
- Standards:
  - **≥2 replicas**: minimum for HA. ≥3 for quorum (Patroni, etcd, Galera, MongoDB).
  - **Fencing**: prevent split-brain (STONITH, fencing tokens).
  - **Health checks**: deep (real queries, not just process up).
  - **DNS endpoint** managed by failover (RDS endpoint, Cloud SQL IP, proxy).
  - **Failover tested**: quarterly game day. Measured RTO validated.
- Anti-patterns: single primary, no fencing, primary + 1 replica (no quorum for self-managed), relying on "we'll add HA later", failover without tested runbook.
- Output: `ha/<cluster>.md` + topology + failover automation + runbook + tested RTO.

### `/db dr <cluster>`
Disaster recovery strategy.
- Inputs: RTO/RPO, regulatory regime, budget.
- Tiers:
  - **Backup & restore**: cold backups in another region. RTO hours. Cheapest.
  - **Pilot light**: minimal replica in DR region, scaled up on activation. RTO tens of minutes.
  - **Warm standby**: scaled-down full replica in DR region. RTO minutes.
  - **Hot standby (multi-region active-passive)**: full replica, near-zero RTO. Costly.
  - **Active-active multi-region**: full read/write in ≥2 regions. Costliest. Only when data loss is unacceptable.
- Required artifacts:
  - **RPO/RTO matrix** per cluster.
  - **Backup strategy**: full + incremental + WAL/binlog continuous archiving (PITR).
  - **Cross-region replication** for critical data.
  - **Failover runbook**: pre-checks, promotion steps, app config flip, validation, rollback.
  - **Failback runbook**: tested before next incident.
  - **Quarterly DR drill** with measured RTO.
- Tools: managed (RDS cross-region replicas, Aurora Global Database, Cloud SQL cross-region, Spanner/CockroachDB multi-region), self-managed (WAL shipping, Barman, pgBackRest, Percona XtraBackup).
- Anti-patterns: backup in same region (not DR), no DR drill ever, "we'll figure it out when it happens", RPO promised to customers not actually tested.
- Output: `dr/<cluster>.md` + RPO/RTO + backup strategy + runbook + drill cadence.

### `/db backup <cluster>`
Backup strategy.
- Types:
  - **Full**: snapshot of entire dataset. Daily typical.
  - **Incremental / differential**: changes since last full. Smaller, faster.
  - **Continuous (WAL/binlog archiving)**: every change shipped. Enables PITR.
- Standards:
  - **3-2-1**: 3 copies, 2 different media, 1 offsite (cross-region).
  - **Encryption**: at rest (KMS CMK), in transit (TLS).
  - **Retention**: aligned to compliance + recovery needs (typical 7-30d point-in-time, 7y for regulated).
  - **Immutability**: backups write-once (S3 Object Lock / GCS retention / Azure immutable blob) — protects against ransomware + accidental delete.
  - **Verification**: backup integrity check + restore drill.
  - **Monitoring**: backup success/failure + duration + size. Alert on failure.
- Tools: managed snapshots (RDS/Aurora/Cloud SQL/Azure), `pg_basebackup` + WAL-G / pgBackRest / Barman (Postgres), `mysqldump` + `xtrabackup` (MySQL), `mongodump` + `oplog` (MongoDB).
- Anti-patterns: no backups, backups in same region only, no immutability, no alerting on backup failure, never tested.
- Output: `backup/<cluster>.md` + backup schedule + retention + immutability config + alert rules.

### `/db restore-drill <cluster>`
Restore drill (tested, not theoretical).
- Inputs: target RTO, restore scope (full vs subset), environment.
- Steps:
  1. **Pick a recent backup** (or PITR target time).
  2. **Restore to isolated environment** (staging account, separate VPC).
  3. **Measure**: restore duration (RTO validation), data consistency, application smoke test.
  4. **Document gaps**: missing data, slow restore, app config differences.
  5. **Fix gaps**: pre-stage config, parallelize restore, warmer caches.
- Cadence: **quarterly minimum** for production. Documented evidence (runbook + timestamp + result).
- Output: `restore-drills/<cluster>/<date>.md` + duration + validation results + remediation backlog.

### `/db connection-mgmt <cluster>`
Connection management + pooling.
- Inputs: app tier (serverless / containers / VMs), connection rate, peak concurrency, engine.
- Patterns:
  - **PgBouncer** (Postgres): transaction-level pooling (default), session-level (when needed). Cuts connection count by 10-100x.
  - **RDS Proxy / Cloud SQL Auth Proxy / Azure DB Proxy**: managed pooling with IAM auth, TLS termination, failover-aware.
  - **ProxySQL** (MySQL): pooling + read/write splitting + query routing + cache.
  - **Vitess**: connection pooling + routing at scale (MySQL).
- Standards:
  - **Pool size**: bounded. App tier concurrency × instance count, capped per backend.
  - **Auth**: TLS to DB; IAM / password rotation via proxy. App never holds DB password.
  - **Timeouts**: connection, statement, idle, transaction. Prevent runaway queries from holding pool slots.
  - **Prepared statements**: careful with transaction-pooling — some libs break. Test before deploying.
  - **Read/write split**: writes to primary, reads to replica (where app tolerates replica lag).
  - **Connection storms**: spikes crash the DB. Cap, rate-limit, backpressure at the proxy.
- Anti-patterns: 1000 connections from the app directly, password in app config, no timeouts, pooling disabled "for safety", unlimited connections on the DB side.
- Output: `connection-mgmt/<cluster>.md` + pool config + timeout policy + monitoring.

### `/db observability <cluster>`
Database observability setup.
- Metrics to export:
  - **Connections**: active, idle, waiting. Max connection limit vs current.
  - **Throughput**: QPS (reads/writes/sec), transactions/sec.
  - **Latency**: per-operation (read/write/commit). Histograms.
  - **Replication**: lag in bytes + seconds per replica.
  - **Locks**: lock waits, deadlocks, long-running transactions.
  - **Cache**: hit ratio (Postgres `pg_stat_user_tables`, MySQL InnoDB buffer pool). Target >99%.
  - **Vacuum/bloat** (Postgres): dead tuples, vacuum lag, bloat %.
  - **IOPS**: read/write IOPS, throughput, queue depth, await.
  - **WAL/binlog**: generation rate, archiving lag, retention.
  - **Slow queries**: top N by total time / frequency.
  - **Schema changes**: in-flight, completed, durations.
  - **Backup**: success/fail, duration, lag.
- Tools: `pg_stat_statements` (Postgres), `performance_schema` (MySQL), `db.server.stats()` (MongoDB), Datadog / New Relic / CloudWatch Database Insights / pgwatch2 / pganalyze / VividCortex.
- Patterns:
  - **Per-query**: `pg_stat_statements` aggregated by query fingerprint. Top 20 by `total_exec_time`.
  - **Alerting**:
    - Connection saturation >70%.
    - Replication lag > SLO.
    - Cache hit ratio drop.
    - Slow query spike.
    - Disk space <15% free.
    - Backup failure.
    - Long-running transaction >N minutes.
  - **Dashboards**: per-cluster (golden signals), per-database (workload), per-instance (host metrics).
- Anti-patterns: monitoring only host CPU/RAM (database-specific signals missed), no per-query visibility, alert on every spike (alert fatigue), no slow query review cadence.
- Output: `observability/<cluster>.md` + metrics list + dashboards + alert rules + SLOs.

### `/db security <cluster>`
Database security hardening.
- Layers:
  - **Network**:
    - DB in private subnet. No public endpoint (or public only with TLS + IP allowlist + IAM).
    - TLS required for all connections (`sslmode=verify-full` for Postgres, `require_secure_transport` for MySQL).
    - Bastion / SSM Session Manager / IAP for admin access.
  - **Authentication**:
    - IAM auth (RDS IAM, Cloud SQL IAM, Azure AD). No shared passwords.
    - Per-app service accounts (not shared DB user).
    - SCRAM-SHA-256 (Postgres ≥10), `caching_sha2_password` (MySQL 8).
  - **Authorization**:
    - Per-database user with grants limited to needed schemas/tables.
    - Row-level security (Postgres `CREATE POLICY`, MySQL via views, MongoDB via `$where`/aggregation stages).
    - Column-level grants or views for sensitive columns.
    - Privileged access time-bound (PAM just-in-time).
  - **Encryption**:
    - At rest: KMS CMK. Bring-your-own-key for regulated.
    - In transit: TLS 1.2+.
    - Application-level column encryption for the most sensitive fields (envelope encryption with KMS-backed DEK).
  - **Audit**:
    - Postgres: `pgaudit` (per-statement or per-session). Logs to CloudWatch/central.
    - MySQL: `audit_log` plugin.
    - MongoDB: `auditLog` destination.
    - All: log auth attempts, schema changes, data access for sensitive tables.
  - **Secrets**: passwords in Vault / SSM / Secret Manager — never in code/env. Rotated.
- Standards:
  - **Default deny**: revoke `PUBLIC` grants, remove default schemas.
  - **No superuser in app path**: app uses least-privilege role.
  - **Compliance**: PCI/HIPAA controls applied (see `/db compliance`).
  - **Vulnerability scans**: `pgcrypto` weaknesses, unpatched versions, weak ciphers.
- Anti-patterns: DB on public IP with weak password, app using superuser, no TLS, no audit, password in code, "internal-only" assumption relied on for security.
- Output: `security/<cluster>.md` + access model + encryption + audit config + IAM policy files.

### `/db compliance <framework>`
Map database controls to a compliance framework (PCI / HIPAA / GDPR / SOX).
- Inputs: framework, in-scope databases, evidence sources.
- Common control areas:
  - **Access**: IAM, MFA for admins, audit of access. Quarterly access reviews.
  - **Encryption**: at rest (KMS CMK), in transit (TLS). Key rotation documented.
  - **Audit logging**: per-statement or per-session. Tamper-proof retention.
  - **Backup & retention**: per-framework (e.g., HIPAA 6y, SOX 7y). Right-to-deletion flow for GDPR.
  - **Network**: DB in private subnet. No public exposure.
  - **Masking**: PII masked in non-prod. Deterministic masking for joins.
  - **Vulnerability management**: regular patching. CVE tracking.
- Patterns:
  - **Controls as code**: OPA/Sentinel/Config Rules for config drift.
  - **Continuous evidence**: CloudTrail + audit log → compliance dashboard.
  - **Per-control owner**: who is accountable for evidence + remediation.
- Anti-patterns: screenshot evidence at audit time, manual review, "we're compliant because the auditor said so last year".
- Output: `compliance/<framework>.md` + control matrix + evidence pipeline + owner per control.

### `/db upgrade <cluster>`
Version upgrades (major + minor) and patching.
- Inputs: current version, target version, engine, scale, downtime tolerance.
- Standards:
  - **Minor patches**: monthly cadence (security). Automated where safe.
  - **Major upgrades**: within N months of GA (e.g., Postgres major every 12-18 months). Staging first.
  - **Testing**: upgrade staging cluster with prod query replay (`pg_replay`/`pgstat` capture). Run regression suite.
  - **Compatibility check**: deprecated features, removed features, extension compatibility.
  - **Rollback plan**: snapshot before upgrade, tested restore path. Some upgrades aren't reversible (catalog changes).
  - **Online upgrade** where supported (e.g., RDS/Aurora rolling, Aurora Serverless v2 zero-downtime, Vitess OnlineDDL).
  - **Extension upgrades**: separately scheduled, tested.
- Anti-patterns: skipping major versions (skipping more than one major at a time on Postgres = problems), upgrading prod without staging test, no rollback plan, "we'll do security patches next quarter".
- Output: `upgrade/<cluster>.md` + upgrade plan + test matrix + rollback + observability plan.

### `/db capacity <cluster>`
Capacity planning.
- Inputs: current workload (QPS, IOPS, storage, connections, CPU, memory), growth forecast, headroom policy.
- Levers:
  - **CPU/memory**: scale up instance class, or scale out read replicas.
  - **IOPS**: provisioned IOPS (RDS io1/io2, Azure Ultra), local NVMe, IO-optimized instance classes.
  - **Storage**: autoscale storage (Aurora, Azure SQL), partitioned table by retention.
  - **Connections**: max_connections + pooling. Plan app tier concurrency × instances.
  - **Cache**: `shared_buffers` (Postgres), InnoDB buffer pool (MySQL). Hit ratio target.
  - **WAL/redo**: log generation rate, archival lag.
- Patterns:
  - **Headroom**: 50% headroom on hot metric (CPU, IOPS, connections) for sudden spikes.
  - **Saturation alerts**: 70% warning, 85% critical.
  - **Forecast**: 12-month growth projection per dimension.
  - **Burst**: serverless / Aurora Serverless v2 for variable workloads. Provisioned for steady high-utilization.
- Anti-patterns: maxing out IOPS/CPU before scaling, "we have headroom" with no measurement, single instance with no replica for capacity growth.
- Output: `capacity/<cluster>.md` + current + forecast + scaling triggers + cost curve.

### `/db cost <cluster_or_account>`
FinOps for databases.
- Inputs: billing data, instance inventory, utilization, tag coverage.
- Levers:
  - **Right-sizing**: instance class, storage, IOPS. Utilization >40% target.
  - **Pricing models**:
    - On-demand: ephemeral + low utilization.
    - Reserved Instances (1y/3y): steady-state baselines. Tracked + utilization alerts.
    - Serverless / Aurora Serverless v2 / Azure SQL Serverless / Cloud SQL Serverless: variable workloads.
    - Spot (self-managed on spot): non-prod only.
  - **Storage**:
    - Autoscale vs provisioned. Right-size allocated vs used.
    - Cold tier: archive old backups, audit logs (S3 IA / Glacier).
  - **Dev/test**:
    - Smaller instance classes, scheduled stop nights + weekends.
    - Restore-from-prod into dev instead of separate cluster (mask PII).
  - **Observability cost**: per-cluster spend tag. Show up in dashboards.
- Anti-patterns: paying for max IOPS 24/7, "production class" used for dev, dev cluster always on, untagged resources.
- Output: `cost/<scope>.md` + right-sizing opportunities + RI/SP plan + per-team cost.

### `/db lifecycle <table_or_cluster>`
Data lifecycle (TTL, archival, purge).
- Inputs: data class, regulatory requirement, query patterns, cost.
- Patterns:
  - **TTL**: per-row expiry (`expires_at` column + scheduled job, or Redis native TTL, or DynamoDB TTL).
  - **Cold tier**: partition old data to cheaper storage (TimescaleDB tiered storage, S3-backed tables via lakehouse).
  - **Archive**: write-only OLAP / data lake. Query via federated engine.
  - **Hard delete**: on legal hold release or right-to-deletion request. Cascading deletes + audit log of deletion.
- Standards:
  - **Retention policy**: per table, per data class. Documented.
  - **Lifecycle automation**: jobs that enforce TTL/archival. Auditable.
  - **Deletion verification**: rows actually gone (not just hidden via view).
- Anti-patterns: keeping PII forever "just in case", no expiry job, deleting without audit log, soft-delete + backup retention meaning data lives forever.
- Output: `lifecycle/<scope>.md` + retention matrix + TTL/archival jobs + deletion flow.

### `/db multi-region <cluster>`
Multi-region database design.
- Patterns:
  - **Active-passive**: primary in one region, async replicas elsewhere. Failover manual or runbook-driven.
  - **Active-active (write local, async replication)**: regional writes, eventual consistency. Conflict resolution documented.
  - **Active-active (global, strongly consistent)**: CockroachDB / Spanner / Yugabyte. Higher cost + latency.
  - **Region-local with global analytics**: operational DB per region, replicated to global warehouse for analytics.
- Standards:
  - **Data residency**: regional data stores for regulated data. No cross-region replication.
  - **Conflict resolution**: last-write-wins (LWW), vector clocks, CRDTs, application-level.
  - **Replication lag SLO**: defined per region pair. Alerted.
  - **Failover testing**: cross-region promotion runbook + drill.
- Anti-patterns: sync replication across continents, "active-active" without conflict resolution, RPO promised that the topology can't deliver, no data-residency tagging.
- Output: `multi-region/<cluster>.md` + topology + replication + conflict resolution + failover runbook + residency policy.

### `/db adr <decision>`
ADR for database engineering.
- Sections: Status, Context, Options, Decision, Consequences, Review date.
- Examples:
  - "Postgres vs MySQL for service X."
  - "Self-managed vs RDS."
  - "Vitess sharding vs vertical scale."
  - "Index strategy for query X."
  - "Replication: sync vs async."
  - "Backup retention: 30d vs 7y."
- Output: `docs/adr/NNNN-<slug>.md`.

### `/db audit <cluster_or_org>`
Audit an existing database estate.
- Dimensions (24):
  1. **Engine justification**: ADR for each engine. Default = managed.
  2. **Schema discipline**: DDL in version control, peer-reviewed, applied via migration tool.
  3. **Index hygiene**: every FK indexed; no unused indexes; covering indexes for hot paths.
  4. **Partition posture**: large tables partitioned; retention via DROP PARTITION; partition key in PK.
  5. **Sharding**: only when justified; shard key in every query; resharding plan exists.
  6. **Query discipline**: slow queries reviewed; EXPLAIN in PR; N+1 caught in review.
  7. **Migration safety**: zero-downtime patterns used; migrations tested on production-size data; reversibility documented.
  8. **Replication**: topology matches RPO; lag monitored; no sync across continents.
  9. **HA**: ≥2 replicas; automated failover tested; fencing in place.
  10. **DR**: RTO/RPO per cluster; backup in different region; restore drill quarterly with measured RTO.
  11. **Backup**: 3-2-1; immutable; encrypted; alerted on failure.
  12. **Restore drill**: quarterly minimum; evidence captured.
  13. **PITR**: enabled for critical clusters; recovery time objective measured.
  14. **Connection management**: pooling in place; bounded; auth via proxy; timeouts set.
  15. **Observability**: pg_stat_statements / performance_schema on; per-query latency; lock waits; cache hit ratio; replication lag; IOPS; backup status — all alerted.
  16. **Security network**: DB in private subnet; TLS enforced; no public endpoint.
  17. **Security auth**: IAM preferred; per-app service accounts; no shared passwords.
  18. **Security authz**: least-privilege grants; RLS for multi-tenant; column grants for sensitive.
  19. **Encryption**: at rest KMS CMK; in transit TLS 1.2+; app-level encryption for PII.
  20. **Audit logging**: pgaudit / performance_schema audit_log / Mongo audit enabled; tamper-proof retention.
  21. **PII handling**: classified; masked in non-prod; right-to-deletion flow tested.
  22. **Compliance**: PCI/HIPAA/GDPR controls applied; evidence continuous.
  23. **Upgrade cadence**: minor monthly; major within target window; staging-tested; rollback plan.
  24. **Capacity**: headroom measured; saturation alerted; forecast documented.
  25. **Cost**: tagged; right-sized; RI/SP coverage tracked + utilized; dev envs scheduled.
  26. **Lifecycle**: retention policy per class; TTL/archival automated; deletion flow tested.
  27. **Multi-region** (if applicable): topology justified; conflict resolution documented; failover tested.
  28. **ADR discipline**: non-trivial decisions have ADRs.
- Output: Aligned / Violation / Risk report + remediation backlog with effort estimate + risk rating.

## 4. Execution Order (Database Engineering Cycle)

For a new database cluster or major refactor:

1. `/db adr <key_decisions>` → engine, self-managed vs managed, replication mode, retention policy.
2. `/db db-select <workload>` → engine choice.
3. `/db schema-design <entity>` → DDL + constraints + types.
4. `/db index <table>` → index strategy.
5. `/db partition <table>` (if applicable) → partitioning strategy.
6. `/db sharding <dataset>` (only if needed) → sharding strategy.
7. `/db replication <topology>` → replication mode + topology.
8. `/db ha <cluster>` → failover + fencing.
9. `/db connection-mgmt <cluster>` → pooling + proxy.
10. `/db security <cluster>` → network + auth + authz + encryption + audit.
11. `/db backup <cluster>` → backup strategy + immutability + retention.
12. `/db dr <cluster>` → DR tier + runbooks.
13. `/db observability <cluster>` → metrics + dashboards + alerts.
14. `/db capacity <cluster>` → sizing + headroom + forecast.
15. `/db cost <cluster>` → pricing model + tagging.
16. `/db lifecycle <class>` → retention + TTL + archival.
17. `/db compliance <framework>` (if applicable) → controls + evidence.
18. `/db multi-region <cluster>` (if applicable) → topology + conflict resolution.
19. `/db upgrade <cluster>` → upgrade plan + test matrix + rollback.
20. `/db query-optimize <slow_query>` (ongoing) → slow query remediation.
21. `/db migration <change>` (per change) → online migration plan.
22. `/db restore-drill <cluster>` (quarterly) → restore drill + measured RTO.
23. `/db audit <scope>` → final review.

> 🛑 **No production cluster without: ADR, DDL in version control, HA topology, backup + immutability + alert, restore drill evidence, observability with per-query metrics, connection pooling, TLS, audit logging, retention policy, capacity forecast, runbooks.**

## 5. Output Location
DB artifacts in the service's repo (DDL, migrations, configs) or in a dedicated `data-platform/` repo for shared infrastructure. Migrations under `migrations/` or `db/migrations/`. Runbooks under `runbooks/db/`. ADRs under `docs/adr/`. Override with `--out=<path>`.

## 6. Audit Workflow
See the 28-dimension checklist in `/db audit <scope>` above. Output: report listing Aligned components + Violation instances + Risks with concrete fixes + effort estimate + risk rating.

## 7. Hard Rules
- **Never** run production stateful workloads on a single instance.
- **Never** apply schema changes via console or ad-hoc SQL — DDL goes through migration pipeline with review.
- **Never** add an index you cannot justify with a query pattern.
- **Never** drop a column without confirming no app code references it and no dependent view exists.
- **Never** rely on backups you haven't restored — restore-drill quarterly, evidence captured.
- **Never** keep DB credentials in code, env files, or config — Vault/SSM/Secret Manager + IAM where possible.
- **Never** expose a database publicly without TLS + IAM + IP allowlist.
- **Never** let the application use the database superuser.
- **Never** ship a migration that holds locks for more than a few seconds on a hot table.
- **Never** delete data without a documented retention policy and audit trail.
- **Never** rely on async replication for RPO=0 commitments.
- **Never** alert only on host CPU/memory — alert on database-specific signals (replication lag, lock waits, cache hit ratio, slow query rate).
- **Always** put DDL in version control with reversible migrations.
- **Always** measure migrations on production-size data before applying.
- **Always** encrypt data in transit (TLS) and at rest (KMS CMK).
- **Always** audit sensitive data access.
- **Always** test failover before relying on it.
- **Always** size for headroom (target 50% on hot metric), not for current peak.
- **Always** tag every cluster for cost allocation.
- **Always** document RTO/RPO per cluster and verify via drill.