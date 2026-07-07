---
name: database-redis
description: Production-grade Redis data-layer engineering — key design, data-structure selection (string / hash / list / set / sorted set / stream / HyperLogLog), pipelining, Lua scripting, transactions, distributed locks, rate limiting, Streams vs Pub/Sub, RDB + AOF persistence, replica + Sentinel + Cluster topology, ACL + TLS, SCAN-based keyspace iteration, memory tuning, eviction policy, observability, and ops. The Redis default in the database cluster. Pairs with `database-postgresql` (durable primary store), `backend-fastapi` (cache + session layer), `backend-engineer` (general), and `database-migration` (cross-engine migrate).
---

- **Execution**: Run `/redis <action> [args]`. Actions: `scaffold`, `connect`, `settings`, `key`, `structure`, `pipeline`, `transaction`, `lua`, `pubsub`, `stream`, `lock`, `rate-limit`, `cache`, `expire`, `persist`, `snapshot`, `restore`, `replicate`, `sentinel`, `cluster`, `shard`, `scan`, `monitor`, `secure`, `acl`, `role`, `tune`, `audit`, `deploy`.

# Backend Redis Protocol

## 1. Mission
Ship Redis data layers that are **typed at the data-structure level, TTL-disciplined, memory-budgeted, cluster-ready, observable under load, and safe to operate at 3 AM**. The skill owns the conventions a team standardizes on — so 12 services don't end up with 12 different key prefixes, 12 different eviction policies, and 12 different opinions on `EXPIRE` vs `maxmemory-policy`.

> **Core principle:** Every key has a TTL unless it is intentional persistent config. Every key is namespaced by service + tenant. Every "hot" pattern (cache stampede, leaderboard, distributed lock) ships with a code path that has been load-tested. Every durable assumption is paired with a persistence story (RDB / AOF / replica / Cluster) — never "we'll add HA later".

## 2. Standards
Every Redis artifact MUST follow these rules:

- **Right structure, first time**: `STRING` for counters / flags / opaque blobs, `HASH` for objects with sparse fields, `LIST` for small FIFO queues, `SET` for unique membership, `ZSET` for leaderboards / time-ordered / sliding windows, `STREAM` for durable event log, `HYPERLOGLOG` for cardinality estimation, `GEO` for lat/lon. See §Reference — Structure Choice for the full matrix.
- **Key naming convention**: `service:tenant:entity[:id[:field]]`. Lowercase, colon-separated, no spaces, no wildcards. Never put user-supplied data unescaped in a key — allow-list `[A-Za-z0-9._-]` or hash it. Maximum key length ~1 KB (RDB efficiency degrades past that).
- **TTL discipline**: every cache, session, lock, rate-limit, and ephemeral key carries `EX` or `PX`. Persistent keys (config, materialized projections) are explicitly tagged and reviewed. Never rely on `maxmemory-policy` to expire things for you — eviction ≠ TTL.
- **Pipelines for throughput**: any operation touching >5 keys per request uses a pipeline (`redis-cli --pipe` or client pipeline). Individual round-trips above ~1ms RTT are an anti-pattern.
- **Lua for atomicity**: when a multi-step operation must be atomic (check-then-set, read-modify-write across keys), use `EVAL` / `EVALSHA`. Do NOT emulate with `WATCH`/`MULTI`/`EXEC` — Lua is cheaper and clearer.
- **No `KEYS` in prod**: iterate with `SCAN` (cursor-based, non-blocking) and `MATCH` / `COUNT` filters. `KEYS` is O(N) and blocks the event loop.
- **Memory budget known**: `maxmemory` set on every instance, `maxmemory-policy` chosen for the workload (`allkeys-lru` for caches, `volatile-lru` when some keys must never evict, `noeviction` for durable stores), `maxmemory-samples` tuned (default 5, raise to 10 for better LRU).
- **Connection pooling + pool sizing**: one `redis://` URL per app instance; pool sized to `2-4 × CPU cores` for sync clients, `1 × cores` for async. Use `redis-py`, `ioredis`, `go-redis`, or Lettuce — pick what the language ecosystem already uses.
- **Pipelining + Lua + Cluster awareness**: the client must be cluster-aware (`-c` flag in `redis-cli`, cluster-enabled client lib). Commands touching multiple keys in Cluster mode must hash-tag them (`service:tenant{shardkey}:...`) so they land on one slot.
- **Observability is non-optional**: `INFO all` + `INFO commandstats` scraped, `SLOWLOG` captured, `LATENCY` events exported, keyspace hit rate tracked (`keyspace_hits / (hits + misses)` ≥ 0.9 is a healthy cache).
- **Security from day one**: `requirepass` (or `aclfile` in Redis 6+), `protected-mode yes` on public bind, `bind 127.0.0.1` (or specific subnets), `tls-port` for cross-network traffic, `rename-command CONFIG` / `rename-command FLUSHALL` to nothing.
- **Idempotent scripts**: every Lua script ships with `-- argv[1] = key, argv[2] = ttl` documented; every key operation is safe to retry; `SET ... NX` semantics are explicit.

## 3. Workflow Actions

### `/redis scaffold <service>`
Initialize the Redis data layer for a new service.
- Inputs: service name, expected workload (cache / session / queue / leaderboard / mixed), peak QPS, key TTL strategy, single vs Cluster vs Sentinel.
- Outputs: project layout — `redis/init.sh`, `redis/acl.conf`, `redis/redis.conf`, `Makefile` (targets: `redis.up`, `redis.down`, `redis.cli`, `redis.monitor`, `redis.flush-test`), `docker-compose.yml` (Redis + redisinsight / redis-commander for local inspection), `app/cache/` directory for client-side wrappers.
- Pairs with `/fa scaffold` for app-side wiring; `/fa cache` calls into this.

### `/redis connect <env_or_service>`
Diagnose and standardize connection settings.
- Inputs: target env (dev/staging/prod), TLS required (yes/no), auth method (password / ACL user), topology (standalone / Sentinel / Cluster).
- Outputs: validated `REDIS_URL` (e.g. `rediss://:password@host:6380/0?ssl_cert_reqs=required`), `redis-cli` ping, `INFO server` + `INFO replication` health probe, latency probe (`redis-cli --latency -h ...`), replica lag check, cluster state check (`redis-cli -c CLUSTER INFO`).
- Includes: connection retry / backoff plan, pool sizing per app instance, IPv6 vs IPv4 explicit, DNS-cache awareness (some clients cache forever — bad for failover).

### `/redis settings <service>`
Define and validate Redis configuration.
- Inputs: Redis version (7.x / 6.x / 5.x), workload (cache / OLTP-style / queue / pub-sub), memory budget, persistence requirements, replica topology, TLS.
- Outputs: `redis.conf` baseline — `bind`, `protected-mode`, `port` / `tls-port`, `requirepass` / `aclfile`, `maxmemory`, `maxmemory-policy`, `maxmemory-samples`, `save` rules (RDB) and `appendonly` (AOF), `appendfsync`, `tcp-keepalive`, `timeout`, `tcp-backlog`, `io-threads` (Redis 6+), `io-threads-do-reads`, `latency-monitor-threshold`, `slowlog-log-slower-than`, `slowlog-max-len`, `notify-keyspace-events`, `cluster-enabled` (if Cluster), `cluster-config-file`, `cluster-node-timeout`.
- Rule: pair every setting with its workload rationale + Redis default + impact.

### `/redis key <purpose>`
Design a key.
- Inputs: service, tenant (or `global`), entity, optional id, optional field.
- Outputs: full key string following `service:tenant:entity[:id[:field]]`. SHA1-hash the user-supplied id when it contains characters outside `[A-Za-z0-9._-]` (e.g. email → first 16 hex of sha1). Returns the key + the chosen data-structure (`STRING` / `HASH` / `LIST` / etc.) + TTL recommendation + serialization format (`JSON` / `MessagePack` / `protobuf`).
- Rule: never let the user-supplied id escape into the key string verbatim — path traversal / injection in cluster routing has happened in the wild.

### `/redis structure <use_case>`
Pick the right data structure.
- Inputs: use-case description (counter, leaderboard, recent-N, FIFO queue, pub-sub, event log, unique visitors, lat/lon lookup).
- Outputs: the structure (`STRING INCR` / `HASH` / `LIST` / `SET` / `ZSET` / `STREAM` / `HYPERLOGLOG` / `GEO`), the command sequence (write path + read path), the memory footprint estimate (`OBJECT ENCODING` + `DEBUG OBJECT <key>` / `MEMORY USAGE <key>`), the eviction trade-off, the Cluster compatibility note.
- See §Reference — Structure Choice.

### `/redis pipeline <purpose>`
Write a pipelined batch operation.
- Inputs: commands to batch, expected size, target client (redis-cli / ioredis / redis-py / Lettuce / go-redis).
- Outputs: pipelined command sequence, single round-trip in client code, error handling per-command, partial-failure policy (fail-fast / best-effort / log-and-continue), `redis-cli --pipe` form for bulk import (`cat data.txt | redis-cli --pipe`).
- Rule: pipeline size ≥ 100 commands / round-trip is normal; ≤ 10,000 to avoid head-of-line blocking on huge pipelines.

### `/redis transaction <scenario>`
Write a `MULTI` / `EXEC` block.
- Inputs: commands that must run atomically, optimistic-concurrency need (use `WATCH`?), retry policy.
- Outputs: `MULTI` / `EXEC` block (or recommendation to use Lua instead — usually yes). For `WATCH`-based optimistic concurrency: `WATCH` → read → conditional `MULTI` → `EXEC` / `DISCARD` with retry on `nil` (other client modified).
- Rule: prefer Lua over MULTI/EXEC for anything beyond 2-3 commands. `MULTI` doesn't roll back on runtime errors — only on `EXEC`-rejected errors.

### `/redis lua <script>`
Write a Lua script (the canonical atomicity primitive).
- Inputs: intent (rate limit, distributed lock with timeout, sliding window, complex read-modify-write), expected call rate, key count.
- Outputs: Lua script with `KEYS = [...]`, `ARGV = [...]` argument convention, `redis.call(...)` calls, return value convention (number for counters / boolean for locks / table for batch results). Plus the `EVALSHA` cache-friendly form (load via `SCRIPT LOAD`, call by SHA).
- Rule: use `redis.replicate_commands()` if the script has non-deterministic behavior (e.g. uses `TIME` or `random`). Cap script execution time (default 5s — `lua-time-limit`); long scripts block the event loop, break into smaller scripts or move logic to the caller.

### `/redis pubsub <topic_or_channel>`
Wire Pub/Sub.
- Inputs: channel pattern (exact / `psubscribe` glob), publisher + subscriber responsibilities, fire-and-forget vs durable requirement.
- Outputs: `PUBLISH <channel> <payload>`, `SUBSCRIBE <channel>` / `PSUBSCRIBE <pattern>`, payload format (`JSON` recommended for forward-compat), backpressure policy (slow subscribers block — design for that), example client loop (redis-py's `pubsub.run_in_thread()` or equivalent).
- Rule: prefer Streams over Pub/Sub when messages must not be lost, when a subscriber needs to replay history, or when multiple consumers compete for the same message (Pub/Sub broadcasts to all).

### `/redis stream <stream_name>`
Wire Redis Streams (event log / queue).
- Inputs: stream name, message schema, consumer group structure, retention policy (`MAXLEN` / `MINID`), pending-message cleanup (`XAUTOCLAIM` / `XPENDING` + `XACK`).
- Outputs:
  - **Producer**: `XADD <stream> * field value ...` with `MAXLEN ~ N` for approximate trimming.
  - **Consumer group**: `XGROUP CREATE <stream> <group> $ MKSTREAM` (or `0` to consume history), `XREADGROUP GROUP <group> <consumer> COUNT N BLOCK ms STREAMS <stream> >`, `XACK <stream> <group> <id>` after successful processing.
  - **Reclaim stuck messages**: `XPENDING <stream> <group>` then `XCLAIM` / `XAUTOCLAIM` to a healthy consumer.
- Rule: `MAXLEN ~ N` (approximate) is much cheaper than `MAXLEN N` (exact) and is fine for most use cases.

### `/redis lock <purpose>`
Distributed lock with timeout.
- Inputs: lock name, holder identity, lease duration, retry policy on contention.
- Outputs: `SET <key> <holder_token> NX PX <lease_ms>` (canonical, since `SETNX` + `EXPIRE` is a known race). Release with Lua:
  ```lua
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  else
    return 0
  end
  ```
- Rule: only the holder can release — check the token, don't blindly `DEL`. For multi-instance Redlock, see `references`; single-instance SET NX PX is enough for most apps.

### `/redis rate-limit <algorithm>`
Rate limit a key.
- Inputs: key (user / IP / API key), algorithm choice (fixed window / sliding window / token bucket / leaky bucket), limits, burst tolerance.
- Outputs:
  - **Fixed window**: `INCR <key>` + `EXPIRE <key> <window>` (Lua to make atomic). Cheap, boundary-spike problem.
  - **Sliding window log**: `ZADD <key> <now> <now>` + `ZREMRANGEBYSCORE <key> 0 <now - window>` + `ZCARD`. Accurate, more memory.
  - **Token bucket**: Lua with `last_refill`, `tokens`, `capacity`, `rate`, returns `1`/`0`.
- Rule: pick fixed window for high-throughput / low-memory; sliding window for accurate enforcement; token bucket for burst tolerance.

### `/redis cache <pattern>`
Cache pattern (cache-aside / write-through / write-behind / refresh-ahead).
- Inputs: pattern choice, key strategy, value format, TTL policy, stampede protection, negative caching.
- Outputs:
  - **Cache-aside**: read-through on miss, write-through invalidate on update.
  - **Write-through**: write to DB + cache atomically (or cache after DB commit).
  - **Write-behind**: write to cache, async flush to DB.
  - **Stampede protection**: `SET NX EX <cooldown>` short-lock during regeneration; request coalescing; `probabilistic early expiration` (XFetch) for jittered TTL.
  - **Negative caching**: cache `nil` / `not_found` with short TTL (e.g. 30s) to prevent repeated lookups for missing keys.
- Rule: never use Redis as the source of truth for anything you'd cry over losing. Pair every cache pattern with a fallback to the primary store.

### `/redis expire <key_or_strategy>`
TTL strategy.
- Inputs: key purpose, expected lifetime, hot-vs-cold classification.
- Outputs: explicit `EXPIRE <key> <seconds>` or `PEXPIRE <key> <ms>` or `EXPIREAT <key> <unix_ts>`. Recommend `PEXPIRE` for sub-second precision (locks, rate limits). For persistent keys: document the choice and review.
- Rule: never set a key without a TTL unless it's tagged as persistent. Background: `EXPIRE` updates TTL; `TTL` / `PTTL` reports remaining.

### `/redis persist <strategy>`
Configure persistence (RDB / AOF / both).
- Inputs: durability requirement (can we lose 1 minute of data? 1 second? nothing?), write volume, disk budget.
- Outputs:
  - **RDB** (`save` rules): snapshot at intervals. Cheap, lossy (last snapshot only). Good for backup / disaster recovery.
  - **AOF** (`appendonly yes`, `appendfsync everysec` / `always` / `no`): durable, append-only. `everysec` is the production default — loses ≤ 1s of writes on crash.
  - **Mixed**: Redis 4+ RDB+AOF (RDB snapshot every N seconds + AOF in between). Best of both, recommended default.
- Rule: AOF + RDB is the production default. `appendfsync always` is too slow for most workloads. Disable `SAVE` rules only if AOF + replica covers your durability.

### `/redis snapshot <scope_or_schedule>`
Snapshot / dump workflow.
- Inputs: schedule (cron-style), target (local / S3 / GCS), retention, encryption, offsite copy.
- Outputs:
  - **Automatic via `BGSAVE`**: configured via `save` rules.
  - **Manual / script-driven**: `redis-cli BGSAVE` + wait for completion (`LASTSAVE`), then `cp /var/lib/redis/dump.rdb s3://...`.
  - **Copy-while-writing**: `redis-cli --rdb /tmp/dump.rdb` for a consistent snapshot without blocking.
- Rule: validate RDB integrity (`redis-check-rdb /var/lib/redis/dump.rdb`) on restore path. Keep at least 3 generations (hourly / daily / weekly).

### `/redis restore <dump_or_aof>`
Restore from RDB or AOF.
- Inputs: dump file path, target Redis, target DB, conflict policy (replace / refuse).
- Outputs: `redis-server --appendonly no --dbfilename dump.rdb --dir /data` startup, or AOF replay via `redis-check-aof` + `redis-server --appendonly yes`. Pre-flight checks: `INFO memory` capacity, `CONFIG SET maxmemory` to a known value, pre-restore `INFO persistence` baseline.
- Rule: never restore over a live prod instance unless the user explicitly confirms. Capture `INFO all` before + after for evidence.

### `/redis replicate <topology>`
Configure replication.
- Inputs: master/replica count, sync vs async, geographic spread, failover mechanism (manual / Sentinel / Cluster).
- Outputs:
  - **Async replication**: `REPLICAOF <master> <port>` on each replica. Cost: zero primary latency overhead. Risk: data loss on master crash (window of unreplicated writes).
  - **Synchronous (Redis Sentinel + `min-replicas-to-write` / `min-replicas-max-lag`)**: rejects writes when no replica is caught up. Cost: write latency in degraded mode.
  - **Diskless replication** (`repl-diskless-sync yes`): stream RDB to replicas over network, no temp file. Faster, requires good network.
- Output: replica config + `INFO replication` health check + failover runbook.

### `/redis sentinel <quorum>`
Configure Sentinel for HA.
- Inputs: Sentinel node count (always odd, min 3), quorum value, down-after-milliseconds, failover timeout, auth (Sentinel itself needs ACL).
- Outputs: `sentinel.conf` per node — `sentinel monitor <master> <ip> <port> <quorum>`, `sentinel auth-pass <master> <password>`, `sentinel down-after-milliseconds <master> 5000`, `sentinel parallel-syncs <master> 1`, `sentinel failover-timeout <master> 60000`. Sentinel itself runs on `:26379`.
- Rule: deploy Sentinel on different hosts than Redis. Always ≥ 3 Sentinels, ≥ 2 in different failure domains. Test failover quarterly.

### `/redis cluster <topology>`
Configure Redis Cluster (sharding).
- Inputs: target shard count (≥ 6 for HA: 3 masters + 3 replicas), key prefix / hash-tag strategy, cross-slot operations avoided, resharding plan.
- Outputs:
  - **Slot allocation**: 16384 slots split across masters. Each master has ≥ 1 replica.
  - **Hash tags**: `service:{tenantX}:user:42` → slot only on `{tenantX}`, so multi-key ops land on one shard.
  - **Bootstrap**: `redis-cli --cluster create <master1>:6379 ... <masterN>:6379 --cluster-replicas 1`.
  - **Add node**: `redis-cli --cluster add-node <new> <existing>` + `redis-cli --cluster reshard --from <src-id> --to <dst-id> --slots 1000`.
  - **Rebalance**: `redis-cli --cluster rebalance --cluster-weight <node>=<weight>`.
- Rule: hash-tag aggressively when multi-key operations exist. Cross-slot errors (`CROSSSLOT`) mean hash-tag discipline failed — debug, don't paper over.

### `/redis shard <key>`
Determine / assign the slot for a key.
- Inputs: key string.
- Outputs: `CLUSTER KEYSLOT <key>` (CRC16 of the substring inside `{}` if present, else of the whole key). Returns the slot number + the master node responsible.
- Rule: in production, trust the client library to compute slots — don't ask Redis per-call. Hash-tag consistency: the SAME tag must appear in every key that needs to land on one shard.

### `/redis scan <pattern>`
Iterate a keyspace safely.
- Inputs: pattern (`MATCH`), batch size (`COUNT`), target DB.
- Outputs: `SCAN 0 MATCH <pattern> COUNT <batch> ...` loop returning cursor + keys. In Cluster: `SCAN` per-node; client library handles fan-out (`-c` in `redis-cli`).
- Rule: never `KEYS *` in production. `SCAN` may return duplicates — dedupe client-side. `SCAN` may miss keys added during iteration — that's fine for ops, not for accurate inventory.

### `/redis monitor <scope>`
Wire Redis observability.
- Inputs: workload (cache / OLTP-style / queue), SLOs (p95 latency, hit rate, memory usage), alerting target.
- Outputs:
  - **Metrics**: `INFO all` scraped (every 10-30s) — `used_memory`, `used_memory_peak`, `used_memory_rss`, `mem_fragmentation_ratio`, `connected_clients`, `blocked_clients`, `keyspace_hits`, `keyspace_misses`, `total_commands_processed`, `instantaneous_ops_per_sec`, `rejected_connections`, `expired_keys`, `evicted_keys`.
  - **Slowlog**: `SLOWLOG GET 100` + `SLOWLOG RESET`; alert on entries.
  - **Latency**: `LATENCY HISTORY <event>`; key events — `command`, `fast-command`, `fork`, `rdb-unlink-temp-file`.
  - **Keyspace**: `INFO keyspace` per DB; alert on `expires` < expected (means TTLs missing) and on `evicted_keys` (means workload > capacity).
  - **Stream consumer lag**: `XPENDING <stream> <group>` for Streams.
- Output: monitoring config + dashboard JSON + alert rules.

### `/redis secure <scope>`
Lock down authentication and network.
- Inputs: scope (cluster / node), auth method (password / ACL), network policy, TLS required, public-internet exposure.
- Outputs:
  - **AUTH**: `requirepass <secret>` (legacy single-password) or `aclfile /etc/redis/users.acl` (Redis 6+ ACL).
  - **Network**: `bind 127.0.0.1 ::1` (or specific NIC IPs), `protected-mode yes` (refuses external connections without auth), `rename-command CONFIG ""` / `rename-command FLUSHALL ""` / `rename-command KEYS ""`.
  - **TLS**: `tls-port 6380`, `tls-cert-file`, `tls-key-file`, `tls-ca-cert-file`, `tls-auth-clients` (yes / optional / no), `tls-protocols TLSv1.3`.
- Rule: app connects with `rediss://` (TLS), ACL user, least-required permissions. Never run Redis on a public IP without `protected-mode`, TLS, ACL, and a firewall.

### `/redis acl <user_or_role>`
Define an ACL user (Redis 6+).
- Inputs: name, role (app / admin / read-replica / monitoring), required commands, key patterns, channels.
- Outputs: `aclusers` plan + `ACL SETUSER <name> on '>password' ~app:tenant42:* &channel:* +@read +@write -@dangerous`. Categories used: `@read`, `@write`, `@admin`, `@dangerous`, `@slow`, `@blocking`, `@pubsub`, `@stream`, `@sortedset`, etc.
- Rule: app user gets `+@read +@write -@admin -@dangerous -@keyspace -@connection` (or whatever the workload needs, never `@all`). Admin user separate. Read-only users for reporters.

### `/redis role <name_or_purpose>`
Define a role / connection identity (works in tandem with `/redis acl`).
- Inputs: name, purpose (app / migrator / reporter / read-replica / monitoring / maintenance), default DB, connection pool sizing.
- Outputs: ACL user + grant matrix + default DB selection + `CLIENT SETNAME <name>` discipline so `CLIENT LIST` shows which app instance is which connection.

### `/redis tune <query_or_workload>`
Targeted performance tuning.
- Inputs: hot key or workload, target SLO (p99 latency, throughput), current `INFO commandstats` / `LATENCY HISTORY`.
- Outputs:
  - Hypothesis (e.g. "this key is on a hot shard", "big keys cause fork stalls", "Lua script blocking event loop").
  - Minimal change (key redesign with hash-tag, shard split, big-key split, script split, `io-threads` raise).
  - Re-measure with `INFO commandstats` delta + `LATENCY` event comparison.
- Rule: change one thing at a time. Capture before/after `INFO` and `LATENCY`.

### `/redis audit <service_or_cluster>`
Audit an existing Redis deployment. See §6 for the audit dimensions.

### `/redis deploy <topology>`
Pre-deployment + post-deployment runbook.
- Inputs: topology (standalone / Sentinel / Cluster), persistence strategy, replica topology, auth strategy.
- Outputs: pre-deploy checklist (`INFO` baseline, `MEMORY` baseline, persistence files inventoried, ACL users reviewed), deploy steps (rolling restart for config change with `CONFIG REWRITE`), post-deploy checks (`INFO` delta, hit rate, latency, `ROLE` of each node, `CLUSTER INFO` if Cluster), rollback playbook (snapshot/restore from previous known-good RDB).
- Rule: every config change ships with a known-good rollback (revert to previous `redis.conf` + `CONFIG REWRITE` or rollback the deploy). For breaking-protocol changes (e.g. flipping `appendonly` from no to yes), do it on a maintenance window.

## 4. Execution Order (Full Redis Service Cycle)

For a new service's Redis data layer:

1. `/redis scaffold <service>` → project layout + docker-compose
2. `/redis connect <env>` → connection manifest + TLS + auth
3. `/redis settings <env>` → `redis.conf` baseline (memory, persistence, eviction)
4. `/redis acl <user>` × N → app / migrator / reporter / monitoring users
5. `/redis role <name>` × N → connection identities + default DB
6. `/redis secure <scope>` → bind + protected-mode + rename-command
7. `/redis key <purpose>` × N → key naming for every entity
8. `/redis structure <use_case>` × N → data-structure choice per use case
9. `/redis pipeline <purpose>` × N → batched reads/writes
10. `/redis lua <script>` × N → atomic multi-step ops (locks, rate limits, sliding windows)
11. `/redis lock <purpose>` × N → distributed locks
12. `/redis rate-limit <algorithm>` × N → per-user / per-IP / per-API-key limits
13. `/redis cache <pattern>` × N → cache-aside / write-through / refresh-ahead
14. `/redis expire <key_or_strategy>` → TTL audit per key class
15. `/redis pubsub <topic>` or `/redis stream <stream>` → messaging per requirement
16. `/redis snapshot <schedule>` → backup schedule
17. `/redis persist <strategy>` → RDB / AOF / mixed
18. `/redis restore` dry-run → restore-tested verification
19. `/redis replicate <topology>` → replica wiring
20. `/redis sentinel <quorum>` → HA (if not Cluster)
21. `/redis cluster <topology>` → sharding (if scale demands)
22. `/redis shard <key>` → hash-tag discipline per multi-key op
23. `/redis scan <pattern>` → ops scripts
24. `/redis monitor <scope>` → metrics + slowlog + alerts
25. `/redis tune <query>` → per under-SLO workload
26. `/redis audit <service>` → pre-launch review
27. `/redis deploy <topology>` → production cutover

> 🛑 **No production rollout without:** ACL users defined, `rename-command CONFIG/FLUSHALL/KEYS` disabled, `protected-mode` and `tls-port` enabled, `maxmemory` set with explicit policy, persistence (RDB + AOF or replica) verified, `INFO` baseline + dashboards live, Sentinel or Cluster HA tested (failover drill within 90 days), `SLOWLOG` + `LATENCY` exported, hit-rate / memory / connection-count alerts defined.

## 5. Output Location
All artifacts written under the service's source tree by default. Config files: `redis/`. Lua scripts: `redis/lua/`. Client wrappers: `app/cache/`, `app/locks/`, `app/queues/`. Audit/tune reports: `audit/`, `tune/`. Project-level docs in `/<project>/services/<service>/redis/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing Redis deployment:

1. **Version & topology**: Redis version, single / Sentinel / Cluster, replica count, geographic spread, Cluster slot balance. Flag EOL versions (Redis 6.x mainline ended community support 2025 — Redis 7.x+ recommended).
2. **Auth discipline**: `requirepass` set OR `aclfile` with at least one ACL user. `INFO server` `redis_version`. `aclusers` enumerated. App user has `+@read +@write` only — no `@admin`, no `@dangerous`.
3. **Network security**: `protected-mode yes`, `bind` to specific subnets (never `0.0.0.0` for public exposure), TLS on (`tls-port`), `redis-cli -p 6379 INFO server` from outside the trusted subnet should refuse.
4. **Command surface reduction**: `rename-command CONFIG ""`, `rename-command FLUSHALL ""`, `rename-command KEYS ""`, `rename-command FLUSHDB ""` (or `rename-command` to a long random alias), `rename-command SHUTDOWN ""`. None of these should be reachable by the app role.
5. **Key naming**: matches `service:tenant:entity[:id[:field]]`. No spaces, no wildcards, no user-supplied unescaped chars in keys. Key length < 1 KB.
6. **TTL discipline**: `INFO keyspace` shows `expires` field > 0 in steady state. Spot-check 100 sample keys via `RANDOMKEY` + `TTL` — > 95% should have TTL > 0. Persistent keys tagged and documented.
7. **Memory budget**: `maxmemory` set, `maxmemory-policy` matches workload (`allkeys-lru` for pure cache, `volatile-lru` for hybrid, `noeviction` for durable), `used_memory / maxmemory` < 0.85 sustained. `mem_fragmentation_ratio` between 1.0 and 1.5 — flag > 2.
8. **Big keys**: scan for big keys via `redis-cli --bigkeys`. Flag any key > 1 MB (or workload-appropriate threshold). Big keys cause fork stalls on RDB save + AOF rewrite + replica sync.
9. **Hot keys**: identify via `MONITOR` sample (1-5s window) + `OBJECT FREQ` (Redis 4+). Flag any single key > 10% of total QPS — design for split.
10. **Latency**: `LATENCY HISTORY command` shows p99 < target. `LATENCY LATEST` clean. `slowlog-log-slower-than` set (e.g. 5ms for cache, 100ms for queue).
11. **Hit rate**: `keyspace_hits / (keyspace_hits + keyspace_misses)`. < 0.8 → cache not effective; > 0.99 → review TTLs (might be too aggressive).
12. **Eviction pressure**: `evicted_keys` rate. > 0 sustained means workload exceeds capacity → raise memory, raise eviction policy, or reduce TTLs.
13. **Persistence**: `rdb_last_save_time` recent OR `aof_enabled = yes`. RDB integrity verified with `redis-check-rdb`. AOF integrity verified with `redis-check-aof`. Backup schedule + retention documented.
14. **Replication health** (non-Cluster): `INFO replication` shows all replicas `state = online`, `lag` < 1s sustained, `master_link_status = up`.
15. **Cluster health** (Cluster): `CLUSTER INFO` `cluster_state = ok`, `cluster_slots_assigned = 16384`, `cluster_slots_ok = 16384`, slot balance within 10% across masters, all replicas online.
16. **Security baseline**: ACL users enumerated, no anonymous default user (`ACL WHOAMI` returns `<unknown>` from non-default DB), TLS required from app, no public-internet bind without TLS + auth + protected-mode + firewall.

Output: a report with `Aligned` components and `Violation` instances, each tagged with severity (`P0` blocks launch / `P1` must-fix this quarter / `P2` nice-to-have), a concrete fix, and an effort estimate.

## 7. Hard Rules
- **Never** run Redis without `protected-mode yes` + auth + bind-to-specific-subnets on any instance reachable beyond `127.0.0.1`.
- **Never** use `KEYS` in production — always `SCAN`.
- **Never** ship a key without a TTL unless it is intentionally persistent and tagged.
- **Never** rely on `maxmemory-policy` to expire your data — eviction ≠ TTL, and evicted keys don't trigger downstream cache invalidation.
- **Never** use `SETNX` + `EXPIRE` separately for a lock — that's the classic non-atomic race. Use `SET key value NX PX ms`.
- **Never** rely on `MULTI`/`EXEC` for atomicity when Lua is available — Lua is cheaper and clearer, and `MULTI` doesn't roll back on runtime errors.
- **Never** call a long-running Lua script that blocks the event loop. Cap execution via `lua-time-limit` and design scripts to be O(1) per command.
- **Never** ship a multi-key op in Cluster without hash-tags (`{tenantX}:...`) so the keys land on one slot. Cross-slot errors are a discipline failure.
- **Never** ship a hot key that dominates the workload — split or shard.
- **Never** store user-supplied input verbatim in a key string — allow-list `[A-Za-z0-9._-]` or hash it.
- **Never** ship a big key > 1 MB without splitting — fork stalls on RDB save / AOF rewrite / replica sync will kill P99.
- **Never** use `redis-cli FLUSHALL` against prod — `rename-command FLUSHALL ""`.
- **Never** connect an app as the admin / default user — always a dedicated ACL user with `-@admin -@dangerous -@keyspace`.
- **Always** set `maxmemory` and an explicit `maxmemory-policy` on every instance.
- **Always** pair every Redis data structure choice with a TTL (unless persistent) and an explicit key-namespace.
- **Always** load Lua scripts via `SCRIPT LOAD` + `EVALSHA` (not `EVAL` per call) to avoid re-shipping the script body.
- **Always** `CLIENT SETNAME <app-name>` so `CLIENT LIST` shows which app instance is which.
- **Always** `INFO all` + `SLOWLOG GET` + `LATENCY LATEST` before declaring a tuning change "done".
- **Always** fail over (Sentinel) or reshuffle (Cluster) at least once per quarter if the deployment is business-critical.
- **Always** `rename-command` the dangerous commands (`CONFIG`, `FLUSHALL`, `FLUSHDB`, `KEYS`, `SHUTDOWN`, `DEBUG`) to either nothing or a long random alias.
- **Always** `tls-port` + `tls-auth-clients yes` for any cross-network exposure.

---

# Reference — Structure Choice

## Pick by intent

| Intent | Structure | Command shape | Notes |
|---|---|---|---|
| Counter, flag, simple cache value | `STRING` | `SET key val EX <s>`, `GET`, `INCR`, `DECR` | Cheapest. `INCR` is atomic. |
| Object with fields (user profile, settings blob) | `HASH` | `HSET key f1 v1 f2 v2`, `HGET`, `HMGET`, `HGETALL` | Better than `JSON` string for partial updates and field-level TTL (HFE 7.4+). |
| Small FIFO queue, recent-N activity, producer/consumer with bounded backlog | `LIST` | `LPUSH` / `RPUSH` / `LPOP` / `RPOP` / `LRANGE` / `LTRIM` | `LPUSH + LTRIM 0 N` = "keep most recent N" pattern. |
| Unique membership, tags, "who liked this" | `SET` | `SADD`, `SREM`, `SISMEMBER`, `SMEMBERS`, `SINTER`, `SUNION` | Order-insensitive. `SRANDMEMBER` for random sampling. |
| Leaderboard, sliding-window log, time-series index | `ZSET` | `ZADD key score member`, `ZRANGEBYSCORE`, `ZRANK`, `ZINCRBY` | Score = numeric. O(log N) ops. |
| Durable event log, multi-consumer queue, message replay | `STREAM` | `XADD`, `XREADGROUP`, `XACK`, `XPENDING`, `XCLAIM` | Like Kafka lite. Consumer groups + PEL. |
| Cardinality estimation (unique visitors, dedup) | `HYPERLOGLOG` | `PFADD`, `PFCOUNT`, `PFMERGE` | 12 KB per key regardless of cardinality. ±0.81% standard error. |
| Lat/lon lookup, "near me", geofencing | `GEO` (ZSET under the hood) | `GEOADD`, `GEOSEARCH`, `GEODIST` | Sorted set on geohash. |
| Bit flags, presence, feature toggles | `STRING` (bitfield) | `SETBIT`, `GETBIT`, `BITCOUNT`, `BITOP` | Compact for sparse boolean vectors. |
| Time-limited single-key lock | `STRING` with NX PX | `SET key token NX PX <ms>` | Holder token required for safe release. |

## Memory footprint cheat sheet

- **STRING**: ~50 bytes overhead + value length.
- **HASH**: very efficient when field count < ~1000; otherwise convert to plain JSON string or split.
- **LIST**: 32 bytes per element (linked-list encoding) or ziplist for small lists.
- **SET**: 56 bytes per member (intset for small int-only sets).
- **ZSET**: 56 + 24 = ~80 bytes per member (ziplist for small).
- **STREAM**: ~150 bytes overhead + radix tree nodes per entry.
- **HYPERLOGLOG**: 12 KB fixed.
- **GEO**: same as ZSET.

Always validate with `MEMORY USAGE <key>` per representative key.

## Encoding transitions

- Small HASH / LIST / SET / ZSET use `ziplist` / `listpack` (compact). When they exceed `hash-max-ziplist-entries` (default 128) or `hash-max-ziplist-value` (default 64 bytes), encoding flips to hashtable / skiplist — and memory blows up. Tune `hash-max-ziplist-entries` per workload; or explicitly split big fields.

---

# Reference — Key Naming

## Convention

```
service:tenant:entity[:id[:field]]
```

Examples:
- `app:tenant42:user:123` — user object (string-serialized JSON or hash)
- `app:tenant42:user:123:profile` — specific sub-object
- `app:tenant42:user:123:session` — session token (TTL 30m)
- `app:tenant42:rate:user:123:1m` — rate limit window
- `app:tenant42:lock:order:42` — distributed lock
- `app:tenant42:leaderboard:weekly` — sorted set
- `app:tenant42:stream:events` — Redis stream
- `app:tenant42:cache:product:42` — cache entry

## Tenant isolation in Cluster

Use a hash-tag on the tenant portion so all tenant keys land on one shard:

```
app:{tenant42}:user:123
app:{tenant42}:session:abc
app:{tenant42}:rate:user:123:1m
```

All three keys share the slot because `tenant42` is inside `{}`. Multi-key ops (`MGET`, `SUNION`, Lua `KEYS = [...]`) work because they're co-located.

## User-supplied input in keys

Allow-list `[A-Za-z0-9._-]`. For anything else (email, OAuth subject, URL slug), SHA1-hash the first 16 hex characters:
```python
import hashlib
def safe_key(tenant, entity, raw_id):
    safe = re.sub(r'[^A-Za-z0-9._-]', '', raw_id)[:32] or hashlib.sha1(raw_id.encode()).hexdigest()[:16]
    return f"app:{tenant}:{entity}:{safe}"
```

---

# Reference — Lua Scripts

## Lock release (atomic, holder-checked)

```lua
-- KEYS[1] = lock key
-- ARGV[1] = holder token (UUID)
-- returns 1 if released, 0 if lock held by someone else
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
```

## Lock extend (atomic, holder-checked)

```lua
-- KEYS[1] = lock key
-- ARGV[1] = holder token
-- ARGV[2] = new TTL ms
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
else
  return 0
end
```

## Rate limit — fixed window (atomic)

```lua
-- KEYS[1] = rate key (e.g. "rl:user:42:1m")
-- ARGV[1] = window seconds
-- ARGV[2] = max requests
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if current > tonumber(ARGV[2]) then
  return 0
end
return 1
```

## Rate limit — sliding window log (accurate)

```lua
-- KEYS[1] = window key
-- ARGV[1] = now (ms)
-- ARGV[2] = window ms
-- ARGV[3] = max requests
-- ARGV[4] = unique member (e.g. UUID)
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local maxn   = tonumber(ARGV[3])
local cutoff = now - window
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, cutoff)
local count = redis.call('ZCARD', KEYS[1])
if count >= maxn then
  return 0
end
redis.call('ZADD', KEYS[1], now, ARGV[4])
redis.call('PEXPIRE', KEYS[1], window)
return 1
```

## Token bucket

```lua
-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = refill rate (tokens/sec)
-- ARGV[3] = now (sec)
-- ARGV[4] = requested tokens
-- ARGV[5] = unique member for last_refill (UUID)
local data    = redis.call('HMGET', KEYS[1], 'tokens', 'last')
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local tokens = tonumber(data[1]) or capacity
local last   = tonumber(data[2]) or now
local elapsed = math.max(0, now - last)
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens < requested then
  redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
  redis.call('PEXPIRE', KEYS[1], 60000)
  return 0
end

tokens = tokens - requested
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
redis.call('PEXPIRE', KEYS[1], 60000)
return 1
```

## Cache stampede protection (SET NX)

```lua
-- KEYS[1] = cache key
-- ARGV[1] = placeholder value
-- ARGV[2] = short cooldown ms
local got = redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', tonumber(ARGV[2]))
return got and 1 or 0
```

The regeneration goroutine that successfully sets the placeholder proceeds; others see `nil` and either wait + retry or return stale.

## Loading + calling (EVALSHA cache)

```bash
# Load
SHA=$(redis-cli SCRIPT LOAD "$(cat script.lua)")

# Call (use NOSCRIPT detection: if EVALSHA returns NOSCRIPT, fall back to EVAL)
redis-cli EVALSHA "$SHA" 1 mykey arg1 arg2

# Or via redis-py / ioredis: register_script returns a callable that handles NOSCRIPT.
```

---

# Reference — Stream Patterns

## Producer (XADD)

```bash
redis-cli XADD app:tenant42:events MAXLEN '~' 1000000 '*' \
  type "order.created" order_id 42 amount 1999 created_at "$(date +%s)"
```

`MAXLEN ~ N` (approximate trim) is much cheaper than `MAXLEN N` and is fine for "keep recent million".

## Consumer group setup

```bash
redis-cli XGROUP CREATE app:tenant42:events order-processors '$' MKSTREAM
# $ = only new messages. Use 0 to start from beginning of stream.
```

## Consumer read

```bash
redis-cli XREADGROUP GROUP order-processors worker-1 \
  COUNT 100 BLOCK 5000 STREAMS app:tenant42:events '>'
```

`'>` = new (unread) messages. To read pending (already-delivered-but-not-acked) messages for a specific consumer: use the consumer's last-delivered-id instead.

## Acknowledge

```bash
redis-cli XACK app:tenant42:events order-processors <id>
```

## Reclaim stuck (XAUTOCLAIM, Redis 6.2+)

```bash
redis-cli XAUTOCLAIM app:tenant42:events order-processors worker-1 \
  <min-idle-time-ms> 0 COUNT 100
```

Returns `(next-cursor, claimed-entries, deleted-ids)`. Reclaim messages idle longer than threshold — handles crashed consumers.

## Pending inspection

```bash
redis-cli XPENDING app:tenant42:events order-processors
# → count, smallest id, greatest id, consumers

redis-cli XPENDING app:tenant42:events order-processors - + 10 worker-1
# → detailed list with idle time and delivery count
```

## Stream vs Pub/Sub

| Property | Pub/Sub | Streams |
|---|---|---|
| Persistence | None — fire-and-forget | Yes — every entry persisted (until MAXLEN) |
| Replay | No | Yes — read from any historical id |
| Consumer groups | No | Yes — load-balance across consumers |
| Backpressure | Slow subscribers block the server | Consumers pull at their own pace (`BLOCK ms`) |
| Fan-out | Broadcast to all subscribers | Each consumer group sees every message once |

---

# Reference — Connection & Pool Sizing

## Single instance

```python
import redis
r = redis.Redis(
  host="db.local", port=6379, db=0,
  password=os.environ["REDIS_PASSWORD"],
  ssl=True, ssl_cert_reqs="required",
  decode_responses=True,
  socket_timeout=2.0,
  socket_connect_timeout=1.0,
  health_check_interval=30,
)
```

## Sentinel

```python
from redis.sentinel import Sentinel
sentinel = Sentinel(
  [("sentinel-1", 26379), ("sentinel-2", 26379), ("sentinel-3", 26379)],
  password=os.environ["REDIS_PASSWORD"],
  ssl=True, ssl_cert_reqs="required",
)
r = sentinel.master_for("mymaster", db=0, decode_responses=True)
```

## Cluster

```python
from redis.cluster import RedisCluster
r = RedisCluster(
  host="cluster.cfg.local", port=6379,
  password=os.environ["REDIS_PASSWORD"],
  ssl=True, ssl_cert_reqs="required",
  decode_responses=True,
)
```

The client computes slots and routes commands. Multi-key ops require hash-tag co-location — no cross-slot ops.

## Pool sizing

- Sync clients: 2-4 × CPU cores per app instance is plenty.
- Async clients (ioredis, Lettuce, aioredis): 1 × cores; the event loop handles concurrency.
- Too many connections → `connected_clients` > 80% of `maxclients` → eviction by Redis or accept failure.

## Connection hygiene

- Always `socket_keepalive=True`.
- `health_check_interval=30` so the client pings every 30s and drops dead connections before the next request.
- `socket_timeout=2-5s` for normal workloads; shorter for fail-fast.

---

# Reference — Performance & Memory

## `INFO` key signals

| Field | Healthy | Investigate |
|---|---|---|
| `used_memory / maxmemory` | < 0.85 sustained | Raise memory, lower TTLs, or evict cold keys |
| `mem_fragmentation_ratio` | 1.0 - 1.5 | > 2 = allocator fragmentation → `MEMORY PURGE` (Redis 4+) or restart |
| `keyspace_hits / (hits + misses)` | 0.8 - 0.99 | < 0.8 = bad cache hit ratio; > 0.99 = TTLs too aggressive |
| `evicted_keys` rate | 0 sustained | > 0 = workload exceeds capacity |
| `expired_keys` rate | matches TTL policy | Sudden 0 = TTLs missing (audit) |
| `connected_clients` | < 80% `maxclients` | Saturated |
| `blocked_clients` | < 10 sustained | Long Lua / `BLPOP` / `XREAD BLOCK` — investigate |
| `instantaneous_ops_per_sec` | within capacity | Sudden drop = latency issue |
| `rdb_last_save_time` | recent | RDB failing silently |
| `rdb_last_bgsave_status` | "ok" | Failed RDB — check disk |

## Big keys

```bash
redis-cli --bigkeys
```

Or for-each in pipeline:
```bash
redis-cli --scan --pattern 'app:*' | xargs -P 10 -I{} redis-cli MEMORY USAGE {}
```

Flag any key > 1 MB. Common culprits: serializing huge JSON blobs into HASH (push to JSON STRING or split), LIST / ZSET as activity logs without `LTRIM` / `ZREMRANGEBYRANK`.

## Hot keys

```bash
# 1-5 second MONITOR sample — non-blocking on small workloads only.
redis-cli MONITOR | head -1000 | awk '{print $4}' | sort | uniq -c | sort -rn | head
```

For ongoing monitoring, use `redis-cli --hotkeys` (Redis 7+) or `OBJECT FREQ` on candidate keys. A single key > 10% of total QPS is a split target.

## Latency

```bash
redis-cli CONFIG SET latency-monitor-threshold 5
redis-cli LATENCY HISTORY command
redis-cli LATENCY LATEST
redis-cli LATENCY RESET
```

`LATENCY RESET <event>` resets a specific event class. Common offenders: `command` (slow command), `fast-command` (most commands are O(1) — flag outliers), `fork` (RDB save / AOF rewrite — too-frequent = bad), `rdb-unlink-temp-file`.

## Slowlog

```bash
redis-cli CONFIG SET slowlog-log-slower-than 5000  # microseconds = 5 ms
redis-cli SLOWLOG GET 50
redis-cli SLOWLOG RESET
```

Alert on `SLOWLOG LEN > 0` — or better, scrape `SLOWLOG GET 50` periodically and pattern-match.

## Memory tuning

- `maxmemory <bytes>` — set explicitly. Always.
- `maxmemory-policy` — pick by workload:
  - `allkeys-lru` (default-ish for cache): evict any key, least-recently-used first.
  - `allkeys-lfu` (Redis 4+): least-frequently-used first. Better for "some keys are hot for a long time" workloads.
  - `volatile-lru` / `volatile-lfu`: only evict keys with TTL set. Use when persistent keys must survive.
  - `allkeys-random` / `volatile-random`: rarely correct.
  - `noeviction`: write requests fail when memory full. Use only for durable stores.
- `maxmemory-samples 10` (default 5): raise for better LRU approximation at minor CPU cost.
- `hash-max-ziplist-entries 128` / `hash-max-ziplist-value 64`: lower if you have many small HASHes; raise if you have fewer large ones. Encoding flip = memory blow-up.

## I/O threads (Redis 6+)

For multi-core hosts:
```
io-threads 4
io-threads-do-reads yes
```
Worth it for write-heavy workloads. Measure before/after — not magic.

---

# Reference — Operations & Backups

## Backup / snapshot

```bash
# Trigger BGSAVE and wait
redis-cli BGSAVE
# Poll for completion
while [ "$(redis-cli LASTSAVE)" = "$OLD" ]; do sleep 1; done

# Atomic copy-while-writing snapshot (preferred for offsite backup)
redis-cli --rdb /tmp/dump.rdb
gpg -c /tmp/dump.rdb
aws s3 cp /tmp/dump.rdb.gpg s3://backups/redis/$(date +%Y%m%d-%H%M%S).rdb.gpg

# Verify integrity
redis-check-rdb /tmp/dump.rdb
```

## Restore

```bash
# Stop Redis (or use a separate port) to avoid corrupting live data
sudo systemctl stop redis

# Replace dump
sudo cp /path/to/dump.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis

# Verify
redis-cli INFO persistence
redis-cli DBSIZE
redis-cli --scan --pattern '*' | wc -l
```

For AOF replay:
```bash
redis-check-aof --fix /var/lib/redis/appendonly.aof
```

## Replication

- **Replica of**: `REPLICAOF <master> <port>` (Redis 5+).
- **Diskless**: `repl-diskless-sync yes`, `repl-diskless-sync-delay 5`.
- **Health check**: `INFO replication` — `master_link_status: up`, `master_last_io_seconds_ago: 0`, `slave_repl_offset` close to `master_repl_offset`.

## Sentinel HA

3 Sentinel nodes minimum, on different hosts. Critical config:
```
sentinel monitor mymaster 10.0.1.10 6379 2
sentinel auth-pass mymaster <password>
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 60000
```

Trigger failover for testing:
```bash
redis-cli -p 26379 SENTINEL FAILOVER mymaster
```

## Cluster

```bash
# Bootstrap
redis-cli --cluster create \
  10.0.1.10:6379 10.0.1.11:6379 10.0.1.12:6379 \
  10.0.1.20:6379 10.0.1.21:6379 10.0.1.22:6379 \
  --cluster-replicas 1 \
  --user default --pass <password> --tls

# Inspect
redis-cli -c CLUSTER INFO
redis-cli -c CLUSTER NODES
redis-cli -c CLUSTER KEYSLOT <key>
redis-cli -c CLUSTER SLOTS

# Add node
redis-cli --cluster add-node 10.0.1.13:6379 10.0.1.10:6379

# Migrate slots
redis-cli --cluster reshard --cluster-from <src-node-id> --cluster-to <dst-node-id> --cluster-slots 1000

# Rebalance
redis-cli --cluster rebalance --cluster-weight <node-id>=1.5
```

## `SCAN` (production key iteration)

```bash
# All keys
redis-cli --scan | head

# Pattern
redis-cli --scan --pattern 'app:tenant42:*'

# Per iteration batch
redis-cli --scan --pattern 'app:tenant42:user:*' --count 1000

# In Cluster
redis-cli -c --scan --pattern 'app:tenant42:user:*'
# Client lib fan-outs per shard automatically.
```

## Quick triage

| Symptom | First check |
|---|---|
| App errors "timeout" | `CLIENT LIST`, `connected_clients`, network RTT |
| Sudden high latency | `LATENCY LATEST`, `SLOWLOG GET`, `INFO commandstats` |
| Memory climbing | `INFO memory`, `MEMORY USAGE` on suspect keys, `MEMORY DOCTOR` |
| Hit rate dropped | `INFO stats` — is `keyspace_misses` spiking? TTL audit |
| `OOM command not allowed` | `maxmemory` reached + `noeviction` → raise memory or evict |
| Replica lag | `INFO replication` `lag` field, network |
| Cluster `CLUSTERDOWN` | `CLUSTER INFO`, slot coverage — `cluster_slots_ok != 16384` |
| Stream consumer stuck | `XPENDING <stream> <group>`, then `XCLAIM` / `XAUTOCLAIM` |
| Lua script timeout | `SLOWLOG GET` — find script, split or `lua-time-limit` |
| Fork stalled (high latency, low CPU) | `INFO persistence` `rdb_last_bgsave_status`, `aof_last_rewrite_time` |