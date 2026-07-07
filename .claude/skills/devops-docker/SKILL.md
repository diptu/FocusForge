---
name: devops-docker
description: Production-grade container engineering — multi-stage Dockerfiles, base-image selection (distroless / alpine / slim), BuildKit + buildx, multi-platform images, image scanning (Trivy / Docker Scout), signing (cosign / sigstore), SBOM, registry strategy, Compose for local dev, networking and volumes, secrets and configs, non-root user discipline, healthchecks, resource limits, signal handling, runtime hardening, image hygiene, and ops debugging. The container default in the devops cluster. Pairs with `backend-fastapi` (app Dockerfile), `backend-engineer` (general), `devops-k8s` (production orchestrator), and `devops-ci` (build pipelines).
---

- **Execution**: Run `/docker <action> [args]`. Actions: `scaffold`, `dockerfile`, `base`, `multi-stage`, `compose`, `service`, `network`, `volume`, `secret`, `config`, `build`, `push`, `pull`, `tag`, `scan`, `sign`, `sbom`, `run`, `exec`, `logs`, `healthcheck`, `limit`, `user`, `multi-arch`, `prune`, `inspect`, `debug`, `update`, `audit`, `deploy`.

# DevOps Docker Protocol

## 1. Mission
Ship containerized artifacts that are **small, reproducible, scan-clean, rootless, signed, multi-arch by default, and boring to operate**. The skill owns the conventions a team standardizes on — so 12 services don't end up with 12 different Dockerfile styles, 12 different base images, and 12 different opinions about whether `apt-get update` belongs in the same `RUN` as `apt-get install`.

> **Core principle:** Every image is reproducible from its `Dockerfile` + lockfile (no `latest`, no `apt-get update` in a separate layer). Every container runs as a non-root user. Every image is scanned before push and signed before deploy. Every container has a healthcheck, resource limits, and a defined signal handler. `latest` is forbidden in any tag that touches production.

## 2. Standards
Every Docker artifact MUST follow these rules:

- **Reproducible builds**: pinned base image by digest (`@sha256:...`) for prod, by tag for dev. Lockfiles (`uv.lock`, `package-lock.json`, `go.sum`, `requirements.txt` with hashes) copied into the image. `apt-get update && apt-get install -y` in ONE `RUN` layer (otherwise stale-apt cache). No `latest` tags in any context that names a specific image for prod.
- **Multi-stage by default**: build stage throws away dev deps; final stage copies only artifacts. Single-stage images are allowed only for trivial scratch / static-binary cases. Multi-stage reduces image size 5-50× and attack surface.
- **Smallest reasonable base**: prefer `distroless` (gcr.io/distroless/*), `scratch` for static binaries, `alpine` when you need a shell and musl is acceptable, `slim` (debian-slim) when glibc is required. Reject `ubuntu:latest`, `node:latest`, `python:latest` for prod.
- **Non-root user**: `USER <uid>` (numeric, not name — numeric pins across base-image rebuilds) with `USER 65532` (distroless nonroot) or `nobody` as the floor. The image must `chown` or `chmod` any writable dir to that UID. Containers running as `root` are a P0 audit finding.
- **`.dockerignore` exists and is honest**: `.git`, `node_modules`, `.venv`, `__pycache__`, `*.pyc`, `.env`, `.envrc`, `.idea`, `.vscode`, `coverage/`, `dist/` (when built inside), `Dockerfile`, `docker-compose*.yml`, `README.md`, `*.log`, `.DS_Store`. Build context size matters — slimmer context = faster builds + smaller cache keys.
- **Layer order for cache**: least-changing layers first (base image → OS deps → language toolchain → deps install → source). Source code in its own `COPY` at the end so dependency layers cache through code changes.
- **BuildKit enabled**: `DOCKER_BUILDKIT=1` (or buildx default) for `--mount=type=cache`, `--mount=type=bind`, `--mount=type=ssh`, heredocs, parallel stages. Legacy builder is deprecated.
- **Healthchecks defined**: every long-running service image declares `HEALTHCHECK` (curl / wget / `[ -f ... ]` / custom). Compose + orchestrators use it. No healthcheck = container "running" while app is deadlocked.
- **Resource limits set**: `mem`, `cpus`, `pids-limit` declared at run / compose / k8s level. Containers without limits compete for host resources and cause noisy-neighbor outages.
- **Signal handling correct**: PID 1 must reap zombies and forward signals. Use `tini` / `dumb-init` as `ENTRYPOINT` prefix, or use a base image that already includes one (distroless has none — handle in `CMD`). Application must handle `SIGTERM` for graceful shutdown.
- **No secrets in image**: never `COPY` `.env`, credentials, or tokens. Mount at runtime (`--env-file`, compose `environment`, k8s `Secret`). Scan with `trivy` / `docker scout` to verify.
- **Image scan clean before push**: `trivy image --exit-code 1 --severity HIGH,CRITICAL` is a CI gate. SBOM generated on every build (`docker buildx imagetools inspect --raw` or `syft`).
- **Image signed before deploy**: `cosign sign --key <key> <image>` (or keyless via OIDC + Rekor). Verify in admission controller (k8s `cosign verify` via Kyverno / Connaisseur / sigstore-policy-controller).
- **Multi-arch from day one**: `linux/amd64,linux/arm64` for any image that ships. Buildx handles this in a single `docker buildx build --platform=...`. Mac dev hosts on Apple Silicon will silently pull the wrong arch if you only ship amd64.
- **Logging to stdout/stderr**: app writes logs to stdout/stderr; the runtime (Docker / k8s) captures and ships them. Logging drivers (`json-file`, `journald`, `syslog`, `fluentd`, `gelf`) are configured at the daemon / orchestrator level, not baked into the image.
- **Labels + metadata**: `org.opencontainers.image.source`, `org.opencontainers.image.revision`, `org.opencontainers.image.version`, `org.opencontainers.image.created` set via `LABEL` or `--label` on buildx. Owners, support contacts, license — label them.

## 3. Workflow Actions

### `/docker scaffold <service>`
Initialize the container artifacts for a new service.
- Inputs: service name, language/runtime (Python / Node / Go / Java / Rust / static), base image preference, registry, build platform list.
- Outputs: `Dockerfile` (multi-stage), `.dockerignore`, `docker-compose.yml` (service + dev DBs + proxy), `docker-compose.prod.yml` (prod overrides), `Makefile` (targets: `docker.build`, `docker.run`, `docker.push`, `docker.scan`, `docker.shell`, `docker.logs`, `docker.compose.up`, `docker.compose.down`, `docker.prune`), `scripts/docker-push.sh`, `docs/docker.md`.
- Pairs with `/fa scaffold` for app-side wiring.

### `/docker dockerfile <service>`
Write the Dockerfile.
- Inputs: runtime, base image, build dependencies, runtime dependencies, entrypoint, port, non-root UID, healthcheck.
- Outputs: optimized `Dockerfile` with: pinned base, multi-stage, layer ordering for cache, `[--mount=type=cache]` for package managers (Bun / npm / pip / uv / cargo / go), OCI labels, `HEALTHCHECK`, `USER <uid>`, `ENTRYPOINT` + `CMD`.
- Rule: every `RUN apt-get` MUST be `apt-get update && apt-get install -y --no-install-recommends <pkgs> && rm -rf /var/lib/apt/lists/*` in one layer.

### `/docker base <service>`
Pick the right base image.
- Inputs: runtime (Python 3.12 / Node 20 / Go 1.22 / Java 21 / Rust / static binary), distro constraint (glibc vs musl), size vs compatibility tradeoff, CVE-update cadence.
- Outputs: base image recommendation with rationale:
  - **Distroless** (`gcr.io/distroless/python3-debian12`, `gcr.io/distroless/nodejs20-debian12`, `gcr.io/distrelfess/static-debian12`) — minimal, no shell, no package manager. Smallest. Use when app doesn't need shell access at runtime.
  - **Alpine** (`python:3.12-alpine`, `node:20-alpine`) — small with apk + shell. musl libc; some wheels don't work. Use for Go / Node where musl is fine.
  - **Slim** (`python:3.12-slim-bookworm`, `node:20-slim-bookworm`) — debian-slim, glibc, smaller than full debian. Use when glibc required and `apt-get` access needed at build time.
  - **scratch** (`FROM scratch`) — for static binaries (Go, Rust with `musl` target). No shell, no libc. Smallest possible.
- Rule: pinned by digest for prod. Always `apt-get update && install` in single `RUN`. Always rebase on security updates via `/docker update`.

### `/docker multi-stage <service>`
Convert single-stage to multi-stage.
- Inputs: current single-stage Dockerfile (if exists), language, build vs runtime deps split.
- Outputs: multi-stage Dockerfile with named stages (`builder`, `runtime`, `final`), `--target=<stage>` flexibility for CI vs prod images, `COPY --from=builder` to copy artifacts only. BuildKit cache mounts (`--mount=type=cache,target=/root/.cache/pip`) for dependency caches.
- Rule: build stage can be heavy (compile toolchain, dev deps); runtime stage carries only the artifacts + minimal runtime deps.

### `/docker compose <service>`
Write `docker-compose.yml` for local dev.
- Inputs: service, dependencies (db / cache / broker / proxy), network topology, volume mounts for live reload, env files.
- Outputs: `docker-compose.yml` with: named services, named volumes, named network, `depends_on: { service: { condition: service_healthy } }`, `healthcheck` per service, `restart: unless-stopped`, `env_file: .env`, `volumes` for live source code reload (dev only), `ports` (dev only — prod uses reverse proxy / orchestrator networking).
- Rule: `docker-compose.yml` is for LOCAL DEV. Production uses compose only for trivial single-host deployments; otherwise k8s / Swarm / ECS / Nomad.

### `/docker service <name>`
Add a service to the dev `docker-compose.yml`.
- Inputs: service name, image (build / pull), depends_on list, env, ports, volumes, healthcheck, resource limits.
- Outputs: service block in compose, consistent ordering (deps before dependents), shared network membership, default `restart: unless-stopped`, sensible `mem_limit` / `cpus` for local dev (e.g. 512M / 1.0).

### `/docker network <topology>`
Network design.
- Inputs: services and their connectivity, isolation requirements.
- Outputs: bridge network (`docker network create app-net`), service-to-service resolution by service name (Compose default), external networks for shared infra (`docker network connect app-net <external-container>`). For Swarm / prod: overlay networks with `--driver overlay` and `--opt encrypted`.
- Rule: never use the default `bridge` for prod. Always create named networks and pin services to them. `--internal` for fully-isolated backends (e.g. DB).

### `/docker volume <purpose>`
Persistent storage.
- Inputs: data type (db data / uploaded files / shared cache), mount strategy (named volume / bind mount / tmpfs).
- Outputs:
  - **Named volume** (`app-data:/var/lib/postgresql/data`) — managed by Docker, default choice for DBs and persistent state.
  - **Bind mount** (`./src:/app/src`) — for live-reload dev; never for prod DB data (host filesystem semantics leak in).
  - **tmpfs** (`--tmpfs /tmp`) — for ephemeral non-persistent state (lock files, scratch).
- Rule: prod DB data must be on a named volume AND backed by a real backup strategy (see `/database-postgresql backup` / `/database-redis snapshot`). Volume in same compose file as service; named volumes survive `docker-compose down` (only `down -v` removes them).

### `/docker secret <name>`
Inject secrets at runtime, never at build.
- Inputs: secret type (env var / file mount / orchestrator secret), source (file / env / vault / k8s Secret), target path inside container.
- Outputs:
  - **Compose**: `secrets: { db_password: { file: ./secrets/db_password.txt } }` + `service.secrets: [{ source: db_password, target: /run/secrets/db_password }]`. NEVER `environment: DB_PASSWORD=...` from `.env` in git.
  - **CLI**: `docker run -e DB_PASSWORD_FILE=/run/secrets/db_password -v $(pwd)/secrets/db_password.txt:/run/secrets/db_password:ro ...`
  - **K8s**: `Secret` resource mounted as `envFrom` or volume.
- Rule: secrets never baked into image, never in `.env` in git, never in `ARG` (visible in `docker history`). Use BuildKit `--mount=type=secret` for build-time secrets that should not be cached in layers.

### `/docker config <name>`
Inject non-secret config at runtime.
- Inputs: config type (env var / file mount / configmap), format (env / YAML / TOML / JSON), source.
- Outputs: similar to secrets but for non-sensitive values. Use `--mount=type=bind,source=...,target=...` (read-only), Compose `configs:` section, k8s `ConfigMap`.
- Rule: separate config from image so the same image serves dev / staging / prod with different env.

### `/docker build <service>`
Build the image with BuildKit.
- Inputs: target stage, tag, build args, platforms, labels.
- Outputs:
  ```bash
  docker buildx build \
    --tag registry.example.com/app/service:1.4.2 \
    --tag registry.example.com/app/service:1.4 \
    --tag registry.example.com/app/service:sha-${GIT_SHA} \
    --label org.opencontainers.image.source=https://github.com/org/app \
    --label org.opencontainers.image.revision=${GIT_SHA} \
    --label org.opencontainers.image.version=1.4.2 \
    --cache-from type=registry,ref=registry.example.com/app/service:cache \
    --cache-to type=registry,ref=registry.example.com/app/service:cache,mode=max \
    --push \
    --pull \
    .
  ```
- Rule: `--pull` ensures base image is the latest patch (rebase on CVE fixes). `--cache-to type=registry` shares cache across CI runs.

### `/docker push <image>`
Push to registry.
- Inputs: tag(s), registry, auth, signing key.
- Outputs: `docker push` (or `docker buildx build --push`), `cosign sign`, SBOM attached.
- Rule: never push without scanning first. Never push without signing. Never push `:latest` for prod-bound artifacts.

### `/docker pull <image>`
Pull from registry.
- Inputs: image reference, by-tag or by-digest.
- Outputs: `docker pull <ref>` or `docker pull <ref>@sha256:...`. By-digest preferred for prod deploys (immutable).
- Rule: never pin prod deployment to a mutable tag — always digest.

### `/docker tag <image>`
Manage tags.
- Inputs: source image, target tag(s).
- Outputs: `docker tag <src> <dst>` or `docker buildx imagetools create` for multi-tag. Tags scheme:
  - `service:1.4.2` (semver, prod)
  - `service:1.4` (semver minor, prod channel)
  - `service:sha-${GIT_SHA}` (immutable, audit)
  - `service:cache` (BuildKit cache)
  - `service:latest` (dev only — NEVER prod)
- Rule: never rely on `latest` for anything. Always include git SHA tag.

### `/docker scan <image>`
Security scan.
- Inputs: image reference, severity threshold, scanner (Trivy / Docker Scout / Snyk / Grype).
- Outputs: scan report, exit-code-on-severity for CI gating:
  ```bash
  trivy image --exit-code 1 --severity HIGH,CRITICAL registry.example.com/app/service:1.4.2
  ```
- Rule: HIGH/CRITICAL CVE = block prod push. MEDIUM = review and document. LOW = informational. Re-scan on every base image rebuild.

### `/docker sign <image>`
Image signing (sigstore / cosign).
- Inputs: image reference, signing key (or OIDC keyless), transparency log (Rekor).
- Outputs:
  ```bash
  # Key-based
  cosign sign --key cosign.key registry.example.com/app/service:1.4.2

  # Keyless (GitHub Actions / OIDC)
  cosign sign registry.example.com/app/service:1.4.2

  # Verify
  cosign verify --key cosign.pub registry.example.com/app/service:1.4.2
  ```
- Rule: every prod image is signed. Verification enforced at admission controller (k8s) / runtime (Compose with `cosign verify`).

### `/docker sbom <image>`
Generate SBOM (Software Bill of Materials).
- Inputs: image reference, format (SPDX / CycloneDX), scanner (syft / docker buildx / trivy).
- Outputs:
  ```bash
  syft registry.example.com/app/service:1.4.2 -o spdx-json > sbom.spdx.json
  # or with buildx:
  docker buildx build --sbom=true --tag ... --push .
  ```
- Rule: SBOM attached as OCI artifact. Track for license compliance + supply-chain audits.

### `/docker run <image>`
Run a container correctly.
- Inputs: image, command override, env, volume mounts, network, port mapping, resource limits, restart policy, init, user.
- Outputs:
  ```bash
  docker run -d \
    --name app \
    --init \
    --user 1000:1000 \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=64m \
    --memory 512m \
    --memory-swap 512m \
    --cpus 1.0 \
    --pids-limit 256 \
    --cap-drop ALL \
    --cap-add NET_BIND_SERVICE \
    --security-opt no-new-privileges \
    --restart unless-stopped \
    --health-cmd "curl -fsS http://localhost:8080/health || exit 1" \
    --health-interval 30s \
    --health-timeout 3s \
    --health-retries 3 \
    --health-start-period 10s \
    --log-driver json-file \
    --log-opt max-size=10m --log-opt max-file=3 \
    -p 127.0.0.1:8080:8080 \
    -v app-data:/var/lib/app \
    --network app-net \
    registry.example.com/app/service:1.4.2
  ```
- Rule: always `--init` (tini) unless base image provides one. Always `--cap-drop ALL` then add back only what you need. Always `--security-opt no-new-privileges`. Always `--read-only` unless the app writes to FS (then explicit `--tmpfs` for writable dirs). Always `--log-opt max-size` / `max-file` to prevent disk fill.

### `/docker exec <container>`
Execute in a running container.
- Inputs: container, command, user.
- Outputs: `docker exec -it <container> <cmd>`. Distroless images have no shell — exec requires `docker debug <container>` (Docker 24+) or a debug variant of the image (`-debug` tag) with busybox / shell added.
- Rule: never edit production containers (`docker exec vim ...`). For debugging, use ephemeral sidecar with the same image and mounts.

### `/docker logs <container>`
View logs.
- Inputs: container, since / until / tail / follow, driver-specific filters.
- Outputs: `docker logs --tail 200 --since 10m <container>` or `docker logs -f <container>`. JSON-file driver logs at `/var/lib/docker/containers/<id>/<id>-json.log`. Compose / k8s use the same drivers but route through their logging stack.
- Rule: don't `docker logs | grep error > file.log` — that's a placeholder for actual log shipping. Configure a log driver + shipper.

### `/docker healthcheck <service>`
Define a healthcheck.
- Inputs: service, endpoint / command, interval, timeout, retries, start period.
- Outputs:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \
    CMD curl -fsS http://localhost:8080/health || exit 1
  ```
- Compose equivalent at `service.healthcheck.test`. K8s equivalent via `livenessProbe` / `readinessProbe` (different semantics — see `/devops-k8s`).
- Rule: liveness probe must be cheap + match the actual app failure mode (don't `curl /` if it always returns 200 even when DB is down — check DB too). Readiness probe gates traffic; liveness probe restarts the container.

### `/docker limit <service>`
Resource limits.
- Inputs: container, memory (hard + soft), CPU, PID, I/O, ulimits.
- Outputs: `--memory`, `--memory-reservation`, `--cpus`, `--cpuset-cpus`, `--pids-limit`, `--blkio-weight`, `--ulimit nofile=...`. Compose at `service.deploy.resources.limits` + `reservations`. K8s at `resources.limits` + `resources.requests`.
- Rule: every container in prod has hard limits. `memory-swap = memory` to disable swap-in. `pids-limit` to prevent fork bombs. `ulimit nofile` per app needs (default 1024 too low for many apps).

### `/docker user <service>`
Non-root user discipline.
- Inputs: UID / GID, base image user, writable dirs.
- Outputs:
  ```dockerfile
  RUN groupadd --system --gid 1001 app && \
      useradd  --system --uid 1001 --gid app --no-create-home --shell /sbin/nologin app && \
      mkdir -p /app && chown -R app:app /app
  USER app
  ```
  Or for distroless:
  ```dockerfile
  USER 65532:65532  # distroless nonroot
  COPY --from=builder --chown=65532:65532 /build/app /app/
  ```
- Rule: numeric UID (not name) so it pins across base-image rebuilds. Never `USER root` in `CMD`/`ENTRYPOINT` scripts. Verify with `docker run --user 0:0 <image> id` should fail if container is well-hardened.

### `/docker multi-arch <service>`
Multi-platform builds.
- Inputs: target platforms (linux/amd64,linux/arm64), builder name.
- Outputs:
  ```bash
  docker buildx create --name multi --use
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag registry.example.com/app/service:1.4.2 \
    --push .
  ```
- Rule: ship amd64 + arm64 by default. Apple Silicon dev hosts silently pull arm64 — if you only ship amd64, your devs are running slow emulated images without realizing.

### `/docker prune <scope>`
Cleanup.
- Inputs: scope (images / containers / volumes / networks / build cache / system).
- Outputs:
  ```bash
  docker image prune -a              # unused images
  docker container prune             # stopped containers
  docker volume prune                # unused volumes (CAUTION: deletes data)
  docker network prune               # unused networks
  docker builder prune               # build cache
  docker system prune -a --volumes   # everything (CI / dev only)
  ```
- Rule: `docker system prune -a --volumes` deletes data. NEVER in prod. Use `docker builder prune --filter "until=24h"` to keep recent caches.

### `/docker inspect <target>`
Debug image / container / network / volume.
- Inputs: target.
- Outputs: `docker inspect <target>` (JSON), or specialized:
  ```bash
  docker image inspect <image>
  docker container inspect <container>
  docker network inspect <network>
  docker volume inspect <volume>
  docker context show
  ```
- Rule: `docker image inspect --format '{{.Config.User}}' <image>` to check non-root. `docker container inspect --format '{{.State.Health.Status}}' <container>` for healthcheck status. `docker container inspect --format '{{.HostConfig.CapDrop}}'` for capability drops.

### `/docker debug <target>`
Debug a failing container.
- Inputs: container / image, symptom.
- Outputs: troubleshooting tree:
  - Container won't start → check `docker logs`, `docker inspect` for `Error` in `State`, run with `--entrypoint /bin/sh` to inspect filesystem.
  - Container OOM-killed → `docker inspect --format '{{.State.OOMKilled}}' <c>` true. Raise `--memory` or fix the leak.
  - Healthcheck failing → exec `curl` manually; check DNS / network; check `HEALTHCHECK` command.
  - Slow startup → check `docker events`, `docker logs --since <start>`. Often waiting on DB; check dependency healthchecks.
  - Distroless has no shell → use `docker debug <container>` (Docker 24+) which spins up a sidecar with busybox + image's rootfs.
- Rule: never `docker exec rm -rf` on a running container. Stop it, snapshot the volume, restart.

### `/docker update <service>`
Base image update + CVE rebase strategy.
- Inputs: image, target base (e.g. `python:3.12-slim-bookworm` → `python:3.12.4-slim-bookworm`), CVE database (Trivy / Docker Scout).
- Outputs: updated Dockerfile with pinned base image digest, rebuilt image, scan result showing CVEs cleared, deploy plan. Automated via Dependabot / Renovate for `FROM` lines.
- Rule: every CVE fix should rebuild the image, not patch the running container. Containers are immutable in prod.

### `/docker audit <service_or_registry>`
Audit existing Docker artifacts. See §6.

### `/docker deploy <topology>`
Pre-deployment + post-deployment runbook.
- Inputs: target topology (single-host / Compose prod / k8s / ECS / Swarm), registry, signing, rollout strategy.
- Outputs:
  - **Pre-deploy**: image scanned clean, signed, SBOM attached, digest-pinned, image pulled on target, registry auth in place, network / volume mounts prepared.
  - **Deploy**: rolling replacement (k8s rolling update / Compose `up -d --no-deps --force-recreate <svc>`), healthcheck gate (don't move traffic until healthy).
  - **Post-deploy**: smoke test, log tail, metric delta, container `State.Health.Status = healthy`.
- Rule: every deploy uses image digest (`@sha256:...`), not mutable tag. Tag for human use, digest for machines.

## 4. Execution Order (Full Docker Service Cycle)

For a new service's container artifacts:

1. `/docker scaffold <service>` → project layout + Makefile + compose
2. `/docker base <service>` → base image chosen
3. `/docker dockerfile <service>` → Dockerfile written
4. `/docker multi-stage <service>` → multi-stage applied
5. `/docker user <service>` → non-root UID pinned
6. `/docker healthcheck <service>` → HEALTHCHECK defined
7. `/docker compose <service>` → local dev compose
8. `/docker service <name>` × N → each dependency
9. `/docker network <topology>` → named networks
10. `/docker volume <purpose>` × N → persistent volumes
11. `/docker secret <name>` × N → secrets wired (NOT in image)
12. `/docker config <name>` × N → config wired
13. `/docker limit <service>` → resource limits + ulimits
14. `/docker build <service>` → build with BuildKit + cache + labels
15. `/docker multi-arch <service>` → amd64 + arm64
16. `/docker scan <image>` → Trivy / Scout scan clean
17. `/docker sbom <image>` → SBOM attached
18. `/docker sign <image>` → cosign sign
19. `/docker push <image>` → registry push
20. `/docker run <image>` → smoke test run with all hardening flags
21. `/docker logs <container>` / `/docker exec` → smoke verification
22. `/docker update <service>` → base-image CVE rebase strategy
23. `/docker audit <service>` → pre-launch review
24. `/docker deploy <topology>` → production cutover

> 🛑 **No production rollout without:** image scan clean at HIGH/CRITICAL, image signed, SBOM attached, image pinned by digest, container runs as non-root, healthcheck defined, resource limits set, `--read-only` + explicit `--tmpfs` for writable dirs, `--cap-drop ALL`, `--security-opt no-new-privileges`, registry auth verified on target host.

## 5. Output Location
All artifacts written under the service's source tree by default. `Dockerfile`, `.dockerignore`, `docker-compose*.yml`, `Makefile`, `scripts/docker-*.sh`. Project-level docs in `/<project>/services/<service>/docker/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing Docker setup:

1. **Base image discipline**: every `FROM` is pinned by digest in prod-context images. No `latest`, no `ubuntu:latest`, no `node:latest`, no `python:latest`. Distroless / alpine / slim preferred over full-fat distros. Flag every mutable tag.
2. **Layer discipline**: every `RUN apt-get install` is `apt-get update && apt-get install -y --no-install-recommends <pkgs> && rm -rf /var/lib/apt/lists/*` in one layer. No `apt-get update` in a separate layer. No `curl | bash` (verifiable download + `chmod +x`). Flag any unverified `curl | sh`.
3. **Multi-stage usage**: complex builds (compile toolchain, large dev deps) are multi-stage. Final stage carries only runtime artifacts. Single-stage only for trivial static-binary / scratch images.
4. **Layer ordering for cache**: source code in its own `COPY` at the end. Dependency layers cache through code changes. `package-lock.json` / `uv.lock` / `go.sum` / `Cargo.lock` copied BEFORE source.
5. **`.dockerignore`**: exists and is comprehensive. `.git`, `node_modules`, `.venv`, `__pycache__`, `.env*`, `coverage/`, `.idea/`, `.vscode/`, `README.md` (usually), `*.log`. Build context size matters.
6. **Non-root user**: `USER` directive present, numeric UID (not name), UID > 0. Verify with `docker run --rm --entrypoint id <image>` — must return non-zero UID.
7. **No secrets in image**: `trivy image --secret-config <yaml> <image>` or manual review. No `.env`, no credentials, no `ARG` with secrets visible in `docker history`. Use `--mount=type=secret` for build-time secrets.
8. **Healthcheck defined**: `HEALTHCHECK` present in Dockerfile OR equivalent in compose / k8s. Flag any long-running service without a healthcheck.
9. **Init / signal handling**: `--init` or base image with tini. App handles `SIGTERM`. PID 1 reaps zombies (`docker run --init <image> ps -ef` should not show `<defunct>`).
10. **Read-only filesystem**: `--read-only` flag used where possible, `--tmpfs` for writable dirs. App should not write to FS except explicit tmp / cache / data dirs.
11. **Resource limits**: `--memory`, `--cpus`, `--pids-limit` declared in compose / k8s / CLI. No container runs unbounded.
12. **Capability drops**: `--cap-drop ALL` plus only the necessary `--cap-add`. No `--privileged`. No `--cap-add SYS_ADMIN` unless explicitly justified.
13. **Security options**: `--security-opt no-new-privileges` always set. `seccomp` profile not disabled (`--security-opt seccomp=unconfined` is an audit flag unless the app needs it).
14. **Logging driver**: `json-file` with `--log-opt max-size=10m --log-opt max-file=3` OR external driver (`journald`, `fluentd`, `gelf`, `splunk`). No unbounded log files.
15. **Image scan clean**: latest scan report shows zero HIGH/CRITICAL CVEs (or all HIGH/CRITICAL explicitly accepted with documented reason + ticket). Re-scan on every base image rebuild.
16. **Image signed**: `cosign verify` passes for the deployed image reference. Keyless (OIDC) or KMS-backed key, not a long-lived password.
17. **SBOM attached**: SPDX or CycloneDX SBOM in the registry. Re-generated on every build.
18. **Multi-arch**: image manifest lists `linux/amd64` AND `linux/arm64` for any customer-facing image. `docker manifest inspect <image>` should show both.
19. **Registry hygiene**: registry has private network / VPC endpoint. Anonymous pull disabled. Tag immutability enabled (no overwriting `:1.4.2`). Garbage collection schedule documented.
20. **Runtime hygiene**: no `docker exec` interactive sessions in prod (audit via `docker events`). Container restart count < 5 in last 24h. No OOM-killed containers (`docker inspect --format '{{.State.OOMKilled}}'`).

Output: a report with `Aligned` components and `Violation` instances, each tagged with severity (`P0` blocks launch / `P1` must-fix this quarter / `P2` nice-to-have), a concrete fix, and an effort estimate.

## 7. Hard Rules
- **Never** use `:latest` for any image that touches production. Pin by digest.
- **Never** run a container as `root` in production. Numeric UID, non-zero, no new privileges.
- **Never** `COPY` secrets, `.env`, credentials, or tokens into an image. Mount at runtime.
- **Never** use `--privileged` unless explicitly justified and documented.
- **Never** ship a long-running service image without `HEALTHCHECK`.
- **Never** use a single `RUN apt-get update` in one layer and `RUN apt-get install` in another — stale-cache poisoning.
- **Never** use `curl | bash` to install in a Dockerfile. Download + verify + execute.
- **Never** push an image without a clean Trivy scan at HIGH/CRITICAL severity.
- **Never** deploy an unsigned image in production.
- **Never** run unbounded containers (`--memory` and `--cpus` required).
- **Never** leave the logging driver unbounded — always `--log-opt max-size` + `max-file`.
- **Never** ship a single-arch image when the dev host or customer base has arm64 — silent emulation is worse than no image.
- **Never** edit a running container (`docker exec vim ...`) — containers are immutable; rebuild + redeploy.
- **Always** `USER <numeric_uid>` (not name) in every Dockerfile.
- **Always** `--init` (or base image with tini / dumb-init) so PID 1 reaps zombies and forwards SIGTERM.
- **Always** `HEALTHCHECK` in every long-running service image.
- **Always** `--cap-drop ALL` then add only the caps needed.
- **Always** `--security-opt no-new-privileges`.
- **Always** `--read-only` filesystem where possible, `--tmpfs` for writable dirs.
- **Always** `--log-opt max-size` + `--log-opt max-file` (or external driver).
- **Always** multi-stage build for any non-trivial app.
- **Always** BuildKit `--mount=type=cache` for package manager caches (faster + smaller layers).
- **Always** `trivy image --exit-code 1 --severity HIGH,CRITICAL` in CI before push.
- **Always** `cosign sign` + `cosign verify` for prod images.
- **Always** SBOM generated and attached as OCI artifact on every build.
- **Always** pin by digest (`@sha256:...`) for any deployment that targets prod.

---

# Reference — Dockerfile Patterns

## Multi-stage: Python (FastAPI / uv)

```dockerfile
# syntax=docker/dockerfile:1.7

ARG PYTHON_VERSION=3.12
ARG UV_VERSION=0.4.18

# --- builder ---
FROM python:${PYTHON_VERSION}-slim-bookworm AS builder
ARG UV_VERSION
RUN pip install --no-cache-dir uv==${UV_VERSION}
WORKDIR /build

# Dependency layer (caches through code changes)
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Source layer
COPY src ./src
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# --- runtime ---
FROM gcr.io/distroless/python3-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=builder --chown=65532:65532 /build/.venv /app/.venv
COPY --from=builder --chown=65532:65532 /build/src /app/src
ENV PATH=/app/.venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER 65532:65532
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \
  CMD ["/app/.venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8080/health').read()"]

ENTRYPOINT ["python", "-m", "src.main"]
```

## Multi-stage: Node (TypeScript / Next.js)

```dockerfile
# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20

# --- deps ---
FROM node:${NODE_VERSION}-slim-bookworm AS deps
WORKDIR /build
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# --- builder ---
FROM node:${NODE_VERSION}-slim-bookworm AS builder
WORKDIR /build
COPY --from=deps /build/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime ---
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=builder --chown=65532:65532 /build/dist /app/dist
COPY --from=builder --chown=65532:65532 /build/node_modules /app/node_modules
COPY --from=builder --chown=65532:65532 /build/package.json /app/package.json

USER 65532:65532
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["/app/node_modules/.bin/node", "-e", "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["/app/node_modules/.bin/node", "/app/dist/server.js"]
```

## Multi-stage: Go (static binary)

```dockerfile
# syntax=docker/dockerfile:1.7

ARG GO_VERSION=1.22

# --- builder ---
FROM golang:${GO_VERSION}-bookworm AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/app

# --- runtime ---
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=builder --chown=65532:65532 /out/app /app
USER 65532:65532
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["/app", "--healthcheck"]

ENTRYPOINT ["/app"]
```

## Multi-stage: Rust (musl + scratch)

```dockerfile
# syntax=docker/dockerfile:1.7

ARG RUST_VERSION=1.78

FROM rust:${RUST_VERSION}-slim-bookworm AS builder
RUN rustup target add x86_64-unknown-linux-musl
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release --target x86_64-unknown-linux-musl && \
    rm -rf src target/x86_64-unknown-linux-musl/release/deps/app*

COPY src ./src
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/build/target \
    cargo build --release --target x86_64-unknown-linux-musl

FROM scratch AS runtime
COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/app /app
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/app"]
```

## `.dockerignore` template

```
.git
.gitignore
.github
.gitattributes

# Build artifacts
node_modules
dist
build
out
.next
__pycache__
*.pyc
*.pyo
.pytest_cache
.mypy_cache
.ruff_cache
target
coverage
*.egg-info

# Secrets / config (NEVER ship)
.env
.env.*
*.pem
*.key
*.p12
secrets/

# IDE / OS
.idea
.vscode
.DS_Store
Thumbs.db
*.swp
*.swo

# Docker itself
Dockerfile*
docker-compose*.yml
.dockerignore

# Misc
*.log
*.md
LICENSE
docs/
```

---

# Reference — Compose Patterns

## Local dev (service + DB + cache)

```yaml
# docker-compose.yml
name: app

services:
  app:
    build:
      context: .
      target: builder   # dev target with full toolchain
    command: ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/app
      REDIS_URL: redis://cache:6379/0
    env_file:
      - .env.local
    volumes:
      - ./src:/app/src:ro   # live reload (read-only mount, app writes via tmpfs)
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    networks: [app-net]
    user: "1000:1000"
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=128m
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 20s
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-net
      - db-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--requirepass", "$(cat /run/secrets/redis_password)"]
    secrets:
      - redis_password
    volumes:
      - cache-data:/data
    networks: [app-net]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

secrets:
  db_password:
    file: ./secrets/db_password.txt
  redis_password:
    file: ./secrets/redis_password.txt

volumes:
  db-data:
  cache-data:

networks:
  app-net:
  db-net:
    internal: true   # db not exposed to host
```

## Production compose (rare — for simple single-host deployments)

```yaml
# docker-compose.prod.yml
name: app-prod

services:
  app:
    image: registry.example.com/app/service@sha256:${IMAGE_DIGEST}
    restart: always
    init: true
    user: "65532:65532"
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=64m
    cap_drop: ["ALL"]
    security_opt:
      - "no-new-privileges:true"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    secrets:
      - app_jwt_signing_key
    networks: [frontend, backend]
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "/app/.venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8080/health').read()"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 256M
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: "5"

  # ... db, cache as above, image pinned by digest ...
```

---

# Reference — Build, Scan, Sign, Push

## Build with BuildKit (CI-friendly)

```bash
# Single-arch
docker buildx build \
  --tag registry.example.com/app/service:1.4.2 \
  --tag registry.example.com/app/service:sha-${GIT_SHA} \
  --label org.opencontainers.image.source=https://github.com/org/app \
  --label org.opencontainers.image.revision=${GIT_SHA} \
  --label org.opencontainers.image.version=1.4.2 \
  --cache-from type=registry,ref=registry.example.com/app/service:cache \
  --cache-to type=registry,ref=registry.example.com/app/service:cache,mode=max \
  --pull \
  --push \
  .

# Multi-arch
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag registry.example.com/app/service:1.4.2 \
  --push \
  .

# Local build only (no push)
docker buildx build \
  --tag app:dev \
  --load \
  .
```

## Trivy scan (CI gate)

```bash
# Local
trivy image --severity HIGH,CRITICAL --exit-code 1 registry.example.com/app/service:1.4.2

# With ignore file for accepted CVEs
trivy image --severity HIGH,CRITICAL --exit-code 1 \
  --ignorefile .trivyignore \
  registry.example.com/app/service:1.4.2
```

## SBOM

```bash
# syft
syft registry.example.com/app/service:1.4.2 -o spdx-json > sbom.spdx.json

# buildx (attached as OCI artifact on push)
docker buildx build --sbom=true --push ...
```

## Sign with cosign

```bash
# Key-based
cosign generate-key-pair   # one-time: cosign.key + cosign.pub
cosign sign --key cosign.key registry.example.com/app/service:1.4.2

# Keyless (CI with OIDC, e.g. GitHub Actions)
cosign sign registry.example.com/app/service:1.4.2

# Verify
cosign verify --key cosign.pub registry.example.com/app/service:1.4.2

# Keyless verify (requires OIDC issuer + Rekor)
cosign verify \
  --certificate-identity-regexp 'https://github.com/org/app/' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  registry.example.com/app/service:1.4.2
```

---

# Reference — Runtime Hardening

## Capability drops

```bash
# Default: drop everything, add back only what you need
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE ...
```

Common capabilities and when to add:
- `NET_BIND_SERVICE` — bind port < 1024 (otherwise use port ≥ 1024)
- `NET_RAW` — raw sockets (ping, traceroute, some VPN/net tools)
- `SYS_PTRACE` — debugging (strace, gdb) — never in prod
- `SYS_ADMIN` — mount, swapon, etc. — almost never, very privileged
- `DAC_OVERRIDE` — bypass file permission checks

## Seccomp

```bash
# Default seccomp profile (recommended)
docker run --security-opt seccomp=default.json ...

# Audit-only mode (log violations, don't block)
docker run --security-opt seccomp=audit.json ...

# Disabled (dangerous — only for debugging kernel-level issues)
docker run --security-opt seccomp=unconfined ...
```

## AppArmor / SELinux

```bash
docker run --security-opt apparmor=docker-default ...
docker run --security-opt label=type:container_runtime_t ...
```

## No-new-privileges

```bash
docker run --security-opt no-new-privileges ...
```

Always set. Prevents setuid binaries from gaining privileges.

## Read-only root + tmpfs

```bash
docker run --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --tmpfs /run:rw,noexec,nosuid,size=16m \
  ...
```

App must write only to `/tmp`, `/run`, or mounted volumes.

## ulimits

```bash
docker run --ulimit nofile=65536:65536 \
           --ulimit nproc=4096:4096 \
           ...
```

Default 1024 file descriptors is too low for many apps. Raise per-app needs.

---

# Reference — Operations & Debug

## Common debug commands

```bash
# Why is this container unhealthy?
docker inspect --format '{{json .State.Health}}' <container> | jq
docker logs --tail 100 <container>

# What user is the container running as?
docker exec <container> id
docker image inspect --format '{{.Config.User}}' <image>

# What's in the image?
docker image history <image> --no-trunc
docker image inspect --format '{{json .Config}}' <image> | jq

# Network issues?
docker network inspect <network>
docker exec <container> nslookup <other-service>
docker exec <container> ping -c 3 <other-service>

# Disk usage?
docker system df
docker system df -v

# Resource usage?
docker stats
docker stats --no-stream <container>

# What env is set?
docker exec <container> env | sort

# What processes are running?
docker exec <container> ps -ef
```

## Container lifecycle events

```bash
# Stream events for one container
docker events --filter container=<container>

# All events since 1h ago
docker events --since 1h

# Common filters: container, image, event (start, die, health_status, exec_create, etc.)
```

## Disk pressure triage

```bash
docker system df
# Look at:
#   - Images: large + reclaimable
#   - Containers: large (RW layer size)
#   - Local Volumes: large (data!)
#   - Build Cache: huge if using buildx

docker system prune -a --filter "until=24h"   # safe: only >24h unused
docker builder prune --filter "until=24h"
# NEVER docker volume prune without explicit confirmation
```

## Restart policy

| Policy | Behavior |
|---|---|
| `no` | Don't restart. |
| `on-failure[:max-retries]` | Restart only on non-zero exit, optional retry cap. |
| `always` | Restart no matter what (including after daemon restart). |
| `unless-stopped` | Like `always` but skip if user manually stopped. |

`unless-stopped` is the default for local dev. `always` for prod (k8s manages this differently).

## Cleanup script (CI runner, weekly)

```bash
#!/usr/bin/env bash
set -euo pipefail

docker image prune -a --filter "until=168h" --filter "label!=keep=true"
docker container prune --filter "until=168h"
docker network prune --filter "until=168h"
docker builder prune --filter "until=168h"
docker system df
```

## Quick triage

| Symptom | First check |
|---|---|
| Container won't start | `docker logs`, `docker inspect` for `Error`, run with `--entrypoint /bin/sh` |
| Container OOM-killed | `docker inspect --format '{{.State.OOMKilled}}'` true → raise `--memory` or fix leak |
| Healthcheck failing | `docker exec` the curl / command manually, check DNS / network |
| Image pull slow | `docker pull` directly; check registry endpoint, network |
| Disk full from Docker | `docker system df`, prune dangling images + build cache |
| Container can't reach another | `docker network inspect`, `nslookup` inside container, check `depends_on` health |
| Permission denied on volume | `--user` UID mismatch — check volume owner UID matches container UID |
| Image scan failing | `trivy image <image>`, fix base image (rebase), rebuild + retest |
| Sign verify failing | `cosign verify --insecure-ignore-tlog` is a dev-only escape hatch; in prod, re-sign and re-push |