---
name: devops-sre
description: Production-grade Site Reliability Engineering practice — SLO design and error-budget discipline, incident lifecycle (declare → mitigate → resolve → postmortem), on-call rotation + pager-hygiene, blameless postmortems, capacity planning, toil reduction + automation, release engineering + change management, risk register, chaos engineering / game days, production-readiness reviews, architecture reliability review, and the four golden SRE metrics (MTTR / MTBF / change-failure-rate / SLO compliance). The reliability default in the devops cluster. Pairs with `devops-observability` (SLO + alerts + runbooks), `devops-kubernetes` (release + rollout), `devops-docker` (image + supply chain), `devops-ci` (pipeline + change gates), and `backend-fastapi` (app reliability).
---

- **Execution**: Run `/sre <action> [args]`. Actions: `slo-design`, `slo-review`, `error-budget`, `budget-policy`, `incident-declare`, `incident-respond`, `incident-mitigate`, `incident-resolve`, `incident-postmortem`, `oncall`, `pager-hygiene`, `runbook`, `capacity-plan`, `release`, `change`, `risk-register`, `game-day`, `prr`, `arch-review`, `toil`, `reliability-metrics`, `audit`, `deploy`.

# DevOps SRE Protocol

## 1. Mission
Build reliability practice that is **SLO-driven, error-budget-rationed, incident-disciplined, blameless, toil-aware, and routinely stress-tested**. The skill owns the conventions a team standardizes on — so 12 services don't end up with 12 different on-call rotations, 12 different incident severities, and 12 different opinions about whether a 4am page is acceptable.

> **Core principle:** Reliability is a function of error budget. When the budget is healthy, the team takes risk (deploy, experiment, refactor); when it's exhausted, the team freezes non-critical changes and ships reliability work. Incidents are blameless — we learn from systems, not from people. Toil that exceeds 50% of an engineer's time is a hiring problem, not a dedication problem. Production-readiness is a gate, not a hope.

## 2. Standards
Every SRE artifact MUST follow these rules:

- **SLOs are the contract**: every user-facing service has 1-3 SLOs with explicit targets (typical 99.9% / 99.95% / 99.99%). Targets are reviewed quarterly. Targets without an error budget are not SLOs — they're aspirations.
- **Error budget policy is code**: when burn rate exceeds thresholds, the budget policy is enforced (slow deploys, freeze non-critical changes, escalate). The policy is documented, signed by leadership, and follows the alert escalation. "We promise an SLO and then ignore budget exhaustion" is a P0 cultural failure.
- **Incidents follow a lifecycle**: declare → triage → mitigate → resolve → learn. Every incident has an IC (Incident Commander), a scribe, and a comms channel. Severity 1-4 (or 5). MTTA / MTTR / MTBF tracked per service.
- **On-call is bounded**: max 1 week per shift. Handover documented. On-call rotation spans multiple timezones (or a primary + secondary model). Pager test quarterly.
- **Pager hygiene**: every page links to a runbook. Pages per on-call per week tracked. Target ≤ 4 / week for steady-state, ≤ 12 / week for incident response. Above target → fix the alert, not the on-call.
- **Blameless postmortems**: every P0/P1 incident gets a postmortem within 5 business days. Focus on systems + decisions + contributing factors. Never on individuals. Action items have owners + due dates + impact (preventing recurrence vs detection improvement).
- **Toil is measured**: each on-call tracks "ops hours" vs "engineering hours". If toil > 50% of total time, automation is the highest-priority engineering work.
- **Reliability metrics tracked per service**: MTTA (Mean Time To Acknowledge) target ≤ 5 min, MTTR (Mean Time To Resolve) target ≤ 60 min for P2 / ≤ 4 hours for P1, MTBF (Mean Time Between Failures), SLO compliance (ratio of in-budget days), change failure rate (target < 15%).
- **Capacity planning is annual**: forecast per service per quarter based on growth rate, peak QPS, headroom. Documented, reviewed, and drives build-ahead.
- **Change management policy**: standard changes (low-risk, well-understood) auto-approved; normal changes need a PR + review + CI green; emergency changes need IC approval. Every change shippable via progressive delivery (canary / blue-green).
- **Risk register maintained**: top 10 risks per service with likelihood, impact, mitigation status, owner. Reviewed monthly. SRE owns the register; engineering owns mitigation.
- **Game days / chaos drills quarterly**: at least one controlled failure exercise per quarter per tier-0 service. Documented, blameless, action items fed back.
- **Production-readiness review (PRR)**: every service hits production via a PRR. Checklist of SLO + observability + runbook + on-call + release + rollback + capacity. Blocking gate, not advisory.

## 3. Workflow Actions

### `/sre slo-design <service>`
Design or revise SLOs for a service.
- Inputs: service, user journeys, current performance baseline, business criticality, customer expectations.
- Outputs: SLI definitions (1-3), SLO targets with rationale, error budget policy, burn-rate alert thresholds, dashboards wired, alerting routed.
- Rule: target = max(floor: what users would notice, ceiling: what the system can deliver with 10× headroom for incidents). 99% / 99.9% / 99.99% are buckets — not a linear cost scale.
- Pair: `/observe slo <service>` for the actual implementation; `/sre slo-design` is the design conversation.

### `/sre slo-review <service>`
Quarterly SLO review.
- Inputs: current SLOs, actual performance (compliance%), budget burn events, recent incidents, customer-reported issues.
- Outputs: SLO review report — recommendation to keep / tighten / loosen each SLO. Tighten if consistent over-budget with no user pain (cheap to lower targets). Loosen if constantly under-budget with user pain ignored (raise targets or fix system). Always accompanied by business rationale + customer evidence.

### `/sre error-budget <service>`
Track error budget consumption.
- Inputs: service, SLO, time window (rolling 30d).
- Outputs:
  ```promql
  # Budget consumed (% of 30d budget)
  1 - (
    sum(rate(sli_query[30d]))
    / (1 - slo_target)
  )

  # Days of budget remaining at current burn rate
  budget_remaining_seconds / current_burn_rate_per_second / 86400

  # In-budget vs out-of-budget days per period
  sum_over_time(
    (sli_query >= (1 - slo_target))[30d:1d]
  ) / 30
  ```
- Dashboard panel: budget remaining % (gauge), burn rate (multi-window graph), in-budget days (stat).
- Rule: report error budget in team reviews, in PRR, in exec summaries. Budget is a fact, not a feeling.

### `/sre budget-policy <service>`
Define / enforce error budget policy.
- Inputs: service, SLO tier, current burn state, organization policy.
- Outputs: policy matrix:
  | State | Trigger | Action |
  |---|---|---|
  | Healthy | Budget remaining > 50% | Normal pace. Deploy + experiment freely. |
  | Caution | Budget remaining 20-50% | Slow rollouts, increase canary scope, defer risky launches. |
  | Critical | Budget remaining < 20% OR fast burn (5m/30m windows) | Freeze non-critical changes. SRE + eng + product triage. |
  | Exhausted | Budget remaining = 0 | Reliability-only mode: bug fixes + capacity + perf work. All non-essential deploys paused. |
- Output: policy.md documented, signed by leadership, integrated with deployment gates (Argo CD / Spinnaker can read budget state).
- Rule: the policy is enforceable — it's wired into deploy gates, not just a doc nobody reads.

### `/sre incident-declare <symptom>`
Declare an incident.
- Inputs: symptom (user-facing / system / alert fired), suspected severity, suspected service(s).
- Outputs: incident channel created (#inc-<date>-<slug>), IC + scribe + comms roles assigned, status page updated, customer comms drafted, timeline started, severity assigned (S1-S4 based on impact).
- Severity definitions:
  | Sev | User impact | Response time | Examples |
  |---|---|---|---|
  | S1 (Critical) | Major user-facing outage, revenue bleeding, all-region down | Page + war room | Global auth down, primary DB down |
  | S2 (Major) | Significant user-facing degradation, partial outage | Page + acknowledgement | Single-region down, payment degraded |
  | S3 (Minor) | Limited user-facing impact, internal or partial | Ticket + acknowledgement | Non-critical feature broken, perf degradation |
  | S4 (Low) | No immediate user impact, but risk of escalation | Ticket, next business day | Single instance crash, alarm noise |
- Rule: declare early, demote later. Under-declaring is worse than over-declaring.

### `/sre incident-respond <incident>`
Active incident response.
- Inputs: incident channel, IC, current timeline.
- Outputs: structured response:
  1. **Acknowledge** (MTTA target ≤ 5 min).
  2. **Establish facts**: what, when, scope, blast radius. Use `/observe dashboard` + `/observe query` + `/observe correlate`.
  3. **Mitigate first, root-cause later**: stop the bleeding. Rollback > fix forward > clever diagnosis.
  4. **Communicate**: status page updates every 30 min (S1) / 60 min (S2). Customer-facing comms drafted.
  5. **Escalate early**: if not progressing in 15 min, pull in another pair of eyes.
  6. **Update timeline**: every meaningful action goes in the timeline (scribe).
- Pair: `/observe correlate`, `/observe runbook`, `/k8s troubleshoot`.

### `/sre incident-mitigate <incident>`
Mitigate (stop the bleeding).
- Inputs: incident state, hypothesis tree.
- Outputs: mitigation decision tree:
  - **Bad deploy**: rollback (`kubectl rollout undo` for the right workload / `argocd app rollback --revision <n>` / Git revert + sync).
  - **Resource exhaustion**: scale out (`kubectl scale deploy --replicas=N`), unblock queue.
  - **Dependency failure**: enable degraded mode (read-only, stale data), feature flag off.
  - **Cascading failure**: break the chain — shed load via rate limits, shed dependencies via circuit breakers, isolate via NetworkPolicy / namespace cordon.
  - **Bad config**: revert via Git / GitOps revert.
  - **Bad data**: stop write path, evaluate read path, clear bad state.
  - **Security incident**: rotate credentials, isolate, retain evidence, engage security team.
- Rule: mitigation ≠ resolution. Mitigation is "users are not affected any more". Resolution is "this can't happen again" (and postmortem captures the gap).

### `/sre incident-resolve <incident>`
Resolve and verify.
- Inputs: incident state, mitigation applied, monitoring.
- Outputs:
  - **Verify**: dashboards trending back to baseline, error rate normal, SLO burn rate back to 0, no customer-reported issues.
  - **Declare resolved**: IC calls it. Update status page (resolved). Customer comms ("we've identified the issue and resolved it; we'll follow up with a postmortem").
  - **Stay vigilant**: monitoring continues, IC closes incident only after 30-60 min of stability.
  - **Open postmortem doc**: link from incident channel. Owner assigned. 5-day deadline for P0/P1.

### `/sre incident-postmortem <incident>`
Blameless postmortem.
- Inputs: incident timeline, contributing factors, action items.
- Outputs: postmortem doc (template below):
  ```markdown
  # Postmortem: <incident title>
  **Date**: <date>
  **Severity**: S<N>
  **IC**: <name>
  **Status**: Resolved

  ## Summary
  <2-3 sentences: what happened, who was affected, how long.>

  ## Impact
  - User impact: <X users / Y% of traffic / $Z revenue>
  - Duration: <X min from first user impact to full resolution>
  - SLO impact: <budget consumed %>

  ## Timeline (UTC)
  - HH:MM <event>
  - HH:MM <event>
  ...

  ## Root cause
  <What actually caused the issue, in system terms.>

  ## Contributing factors
  - Latent bug in <code path>
  - Insufficient test coverage in <area>
  - Alert noise → on-call silenced the warning before escalation
  - Runbook missed a check
  - Architecture coupling between <service A> and <service B>

  ## What went well
  - <Detected within <5 min via <alert>>
  - <Mitigation playbook followed cleanly>
  - <Comms to customers was timely>

  ## What went poorly
  - <Detection latency > MTTA target>
  - <Rollback blocked by <reason>>
  - <Status page update lag>

  ## Action items
  | # | Action | Type | Owner | Due |
  |---|---|---|---|---|
  | 1 | Add pagination to /v1/users | Prevention | @eng | 2w |
  | 2 | Add alert on DB connection pool saturation | Detection | @sre | 1w |
  | 3 | Update runbook for payment outage | Detection | @sre | 3d |
  ```
- Action item types: **Prevention** (prevents recurrence) / **Detection** (faster detection) / **Process** (better response).
- Rule: never blame individuals. Always cite systems + decisions + contributing factors. Action items are about changing the system, not the people.

### `/sre oncall <service_or_team>`
Set up or rotate the on-call rotation.
- Inputs: team, primary + secondary, schedule (weekly / daily / rotation length), timezone coverage, escalation policies.
- Outputs:
  - **Primary**: 1 week rotation. First responder. Pages go here first.
  - **Secondary**: same rotation. Escalation target if primary doesn't ack in 5 min.
  - **Manager**: tertiary escalation. After secondary 5 min.
  - **Handover doc**: open incidents, recent deploys, upcoming changes, known issues, runbook updates.
- Tools: PagerDuty / Opsgenie / Grafana OnCall / ilert.
- Rule: max 7 days per shift. Min 2 people in rotation. Handover explicit.

### `/sre pager-hygiene <service_or_team>`
Audit and reduce pager volume.
- Inputs: service / team, page volume per week, alert rules.
- Outputs: alert audit:
  - Pages per on-call per week (target ≤ 4 in steady state).
  - Alert categories: actionable / informational / noisy / broken.
  - For each non-actionable alert: tighten condition / raise threshold / convert to dashboard-only.
  - Grouping + inhibition review (does one noisy alert trigger 20 derived pages?).
  - Maintenance windows aligned with deploy schedule (avoid pages during deploy).
- Pair: `/observe alert` for the rules side; `/sre pager-hygiene` for the volume side.

### `/sre runbook <alert_or_journey>`
Maintain a runbook.
- Inputs: alert / journey / recurring task, on-call feedback.
- Outputs: Markdown runbook (template in `/observe runbook`). Verified quarterly by running the first-check commands on a recent incident.
- Rule: runbook lives with the service. Linked from alert annotations. Updated after every incident that used it. Stale runbooks are P1 incidents waiting to happen.

### `/sre capacity-plan <service>`
Plan capacity for the next quarter (or next 6 months).
- Inputs: current load (peak QPS, p99 latency, CPU/mem utilization, growth rate), upcoming events (launches, marketing, seasonal), headroom requirement.
- Outputs: capacity report —
  ```markdown
  # Capacity Plan: <service> — Q4 2026

  ## Current state
  - Peak QPS: 12k (last month), headroom 4× vs ceiling 50k
  - p99 latency: 230ms (target < 500ms)
  - CPU utilization: 45% peak, 25% p50
  - Memory: 60% peak
  - Database connections: 80/100 (headroom 20%)

  ## Forecast (next quarter)
  - Growth rate: 15% MoM (driven by <reason>)
  - Projected peak QPS: 18k end-of-quarter
  - Projected CPU: 55% peak
  - Required headroom for launches + seasonal: 2× current → 36k QPS ceiling

  ## Gaps & actions
  1. [Q4-W1] Add 4 nodes to cluster (current 8 → 12) for headroom
  2. [Q4-W3] Migrate DB to larger instance (current 8 vCPU → 16 vCPU) before <launch>
  3. [Q4-W6] Add Redis cluster shard to keep below 70% memory
  4. [Q4-W8] Review: traffic projection actual vs forecast, recalibrate for Q1
  ```
- Rule: capacity is boring if you do it quarterly. Capacity is a P0 incident if you don't.

### `/sre release <service>`
Release engineering — progressive rollout + change discipline.
- Inputs: change description, risk class (low / normal / high / emergency), rollout strategy.
- Outputs: rollout plan —
  | Risk class | Example | Approval | Rollout | Monitoring |
  |---|---|---|---|---|
  | Standard | Dependency bump | PR + 1 reviewer | Auto via GitOps | HPA + SLO panel |
  | Normal | New feature flag | PR + 2 reviewers | Canary 5% → 50% → 100% | Add canary dashboard |
  | High | Schema migration breaking | PR + 2 reviewers + SRE + product | Canary 1% → 10% → 50% → 100% with feature kill switch | Synthetic checks + SLO burn |
  | Emergency | Live security patch | IC + SRE | Out-of-band, direct push + comms | Manual verification |
- Pair: `/k8s deploy` for the actual rollout mechanics; `/sre release` is the discipline around it.

### `/sre change <change_id>`
Change management — risk class + approvals + audit.
- Inputs: change ID, description, risk class, rollback plan, owner.
- Outputs: change record —
  - **CAB ticket** for normal+ changes (some orgs require CAB approval).
  - **Auto-approved** standard changes via PR + CI + GitOps.
  - **Audit log**: who approved, when deployed, when completed, SLO impact (if any).
- Rule: every prod change has a recorded risk class + approval + rollback plan. No exceptions for emergencies — even emergency changes get an after-the-fact record.

### `/sre risk-register <service_or_org>`
Maintain the risk register.
- Inputs: service / org, top known risks, likelihood (1-5), impact (1-5), mitigation status.
- Outputs: register table —
  | # | Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner | Status |
  |---|---|---|---|---|---|---|---|
  | 1 | Single-region DB, no replication | 4 | 5 | 20 | Multi-region replica + read replica failover | @sre | In progress |
  | 2 | No rate limiting on /api/v1/users | 3 | 4 | 12 | Add token bucket per user_id | @eng | Backlog |
  | 3 | On-call single person (bus factor 1) | 2 | 4 | 8 | Hire 2 more SREs + cross-train | @sre | Open |
  | 4 | Secrets in env vars (not Vault) | 3 | 5 | 15 | Migrate to External Secrets | @sre | In progress |
- Rule: top 10 risks per service, reviewed monthly. New risks from incidents → register → mitigation → close.

### `/sre game-day <scenario>`
Plan + execute a game day / chaos drill.
- Inputs: scenario (single pod kill / DB failover / network partition / DNS failure / cloud region loss), blast radius (staging / canary in prod / full prod), duration.
- Outputs:
  - **Pre-game**: scenario doc, blast radius, abort criteria, comms, observers.
  - **Inject**: use Chaos Mesh / Litmus / Gremlin / AWS Fault Injection Service / kubectl delete pod / iptables rule.
  - **Observe**: latency / error rate / SLO burn / how many on-call actions / how many confused operators.
  - **Post-game**: write-up in same format as incident postmortem. Action items: detection gaps, automation gaps, runbook gaps, training gaps.
- Rule: schedule a game day per tier-0 service per quarter. Don't go big first — start with single-pod kill in staging, scale up.

### `/sre prr <service>`
Production readiness review.
- Inputs: service about to ship to production (or already shipped, retroactive).
- Outputs: PRR checklist with status:
  ```markdown
  # PRR: <service> — Date: <date>

  ## Functional
  - [ ] User-facing journeys defined and tested
  - [ ] Failure modes identified + handled
  - [ ] Feature flags wired (kill switch for risky code paths)
  - [ ] Rollback plan documented + tested

  ## Reliability
  - [ ] SLOs defined with rationale + budget policy
  - [ ] Error budget currently healthy
  - [ ] Capacity plan in place + headroom ≥ 2×
  - [ ] Chaos / game day completed for last quarter

  ## Observability
  - [ ] Metrics + logs + traces all flowing
  - [ ] Dashboards for SRE + service owner + business
  - [ ] Alerts wired to on-call, runbook linked, runbook tested
  - [ ] SLO burn alerts active + tuned

  ## Operations
  - [ ] On-call rotation populated + handover documented
  - [ ] Runbooks current + verified
  - [ ] Deploy automation (GitOps) tested
  - [ ] Database migrations rehearsed + reversible

  ## Security
  - [ ] Threat model documented
  - [ ] Image scan clean (HIGH/CRITICAL)
  - [ ] Image signed
  - [ ] Secrets via External Secrets / Vault (not env files)
  - [ ] NetworkPolicy default-deny + explicit allow
  - [ ] TLS everywhere
  - [ ] Audit logging on (auth, data access)

  ## Decision
  - [ ] APPROVED for production rollout
  - [ ] DEFERRED (with list of blockers + dates)
  - [ ] REJECTED (with re-review schedule)
  ```
- Rule: PRR is a blocking gate. No service ships to production without a green PRR or an explicit sign-off from SRE + product + engineering leads.

### `/sre arch-review <design>`
Architecture review for reliability.
- Inputs: proposed architecture / significant change, current load profile, growth profile.
- Outputs: review notes against reliability principles:
  - **Single points of failure**: every component has a backup or acceptable degradation mode.
  - **Failure domain isolation**: failures in one tenant / region / AZ can't cascade.
  - **Capacity headroom**: 2× current peak at all tiers.
  - **Backpressure + queueing**: downstream slow → upstream backed off, not crashed.
  - **Timeouts + retries + circuit breakers**: every external call has them, with sane defaults.
  - **Idempotency**: every write that's retried is safe to retry.
  - **Statelessness / recoverable state**: stateless workloads scaled horizontally; state is in durable stores.
  - **Observability built in**: tracing + metrics + logs by default.
  - **Graceful degradation**: when downstreams are slow, what does the user see? Document.
- Rule: reliability concerns raised early (design phase) cost 10× less than late (post-deploy). The review is the cheapest insurance.

### `/sre toil <team_or_service>`
Identify and reduce toil.
- Inputs: team / service, recent ops activities (from on-call notes, ticket queues, manual runbook steps).
- Outputs: toil inventory + automation plan:
  | Task | Frequency | Time / occurrence | Total / quarter | Automatable? | Priority |
  |---|---|---|---|---|---|
  | Restart stuck pods manually | 5/week | 15 min | 65 h | Yes (PDB + DisruptionBudget + readiness tuning) | High |
  | Invalidate CDN cache | Daily | 30 min | 22 h | Yes (CI hook + scripted run) | Medium |
  | Onboard new SRE to runbooks | Quarterly | 8 h | 32 h | Partial (wiki template, mentor rotation) | Medium |
  | Triage disk-full alerts | Weekly | 1 h | 13 h | Yes (logrotate + retention tuning) | High |
- Rule: Google SRE rule of thumb — if toil > 50% of engineering time, the team is under-staffed or under-automated. Track toil percentage; reduce it.

### `/sre reliability-metrics <service_or_org>`
Track the four SRE metrics.
- Inputs: service / org, time window.
- Outputs: dashboard + report:
  - **MTTA** (Mean Time To Acknowledge): target ≤ 5 min (P2+ pages).
  - **MTTR** (Mean Time To Resolve): P2 ≤ 60 min, P1 ≤ 4 hours, S1 ≤ 1 hour.
  - **MTBF** (Mean Time Between Failures): how often the same alert / same service fires.
  - **Change failure rate**: % of deploys causing a rollback or incident (target < 15%).
  - **SLO compliance**: % of days in-budget over the period (target = SLO target).
  - **Toil percentage**: hours on ops vs hours on engineering (target < 30%).
- Pair: `/observe dashboard` for instrumentation; `/sre reliability-metrics` is the meta-analysis.

### `/sre audit <service_or_org>`
Audit an existing SRE practice. See §6.

### `/sre deploy <topology>`
Production cutover with SRE gates.
- Inputs: service, topology (single host / k8s / cloud-managed), pre-launch SRE checklist.
- Outputs: SRE-gated deploy runbook:
  - **Pre-deploy**: PRR green, SLOs defined, alerts wired, on-call rotation populated for the next 7 days, rollback plan tested, communications plan ready.
  - **During**: progressive rollout (canary 5% → 25% → 50% → 100%), SLO burn rate monitored at each stage (abort criteria: burn > 1× in 30m window), dashboards live.
  - **Post-deploy**: 60-min soak window, error budget check, customer-impact check, sign-off from SRE.
  - **Rollback criteria** (any of): SLO burn rate > 2× in 5m, error rate > 5% of traffic, customer-reported issues, IC declares rollback.
- Rule: rollout is interruptible. Any step can abort + rollback. The cost of a 5-min canary that aborts is << the cost of a full rollout that needs a 4-hour incident.

## 4. Execution Order (Full SRE Engagement)

For a new service / team / org entering SRE practice:

1. `/sre slo-design <service>` → SLIs + SLOs + budget policy
2. `/observe slo <service>` → SLO implementation + burn-rate alerts
3. `/observe dashboard <audience>` → SRE + service-owner + business
4. `/observe alert <condition>` → symptom + saturation + burn-rate alerts
5. `/observe runbook <alert>` → runbooks for every page alert
6. `/sre runbook <alert_or_journey>` → verified quarterly
7. `/sre oncall <team>` → rotation + escalation + handover
8. `/sre pager-hygiene <team>` → audit + reduce noise
9. `/sre prr <service>` → PRR for the service before launch
10. `/sre capacity-plan <service>` → Q1 capacity forecast
11. `/sre risk-register <service>` → top 10 risks with mitigation owners
12. `/sre release <service>` → progressive rollout policy + CI/CD gates
13. `/sre change <change_id>` → change management + audit log
14. `/sre reliability-metrics <service>` → dashboard + monthly report
15. `/sre toil <team>` → toil inventory + automation plan
16. `/sre arch-review <design>` → reliability review for any new design
17. `/sre game-day <scenario>` → quarterly chaos drill
18. `/sre audit <service>` → pre-launch review
19. Incident lifecycle (any time): `/sre incident-declare` → `/sre incident-respond` → `/sre incident-mitigate` → `/sre incident-resolve` → `/sre incident-postmortem`
20. `/sre deploy <topology>` → production cutover with SRE gates

> 🛑 **No production rollout without:** PRR green, SLOs defined with budget policy, dashboards live, alerts wired to on-call with runbooks tested, on-call rotation populated for at least 7 days post-launch, capacity headroom ≥ 2× projected peak, rollback plan tested, deploy reviewed for change class + risk + communications.

## 5. Output Location
All artifacts written under `sre/` by default. `slo/`, `runbooks/`, `incidents/`, `postmortems/`, `risk-register/`, `capacity/`, `prr/`, `game-days/`, `audit/`. Project-level docs in `/<project>/platform/sre/` or `/<project>/team/sre/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing SRE practice:

1. **SLO coverage**: every user-facing service has 1-3 SLOs with explicit target + window + budget policy. SLIs are user-perceived (not internal). Multi-window burn-rate alerts active.
2. **Error budget discipline**: budget state visible per service (healthy / caution / critical / exhausted). Policy enforced (deploy gates pause when exhausted). Reported in monthly reviews.
3. **Incident lifecycle discipline**: incidents declared at the right severity. IC + scribe + comms roles assigned. Timeline captured. Status page updated. Postmortem within 5 business days for P0/P1. Action items tracked to closure.
4. **On-call rotation**: max 7 days per shift. Min 2 people per rotation (or single + manager). Handover documented. Pager tested quarterly.
5. **Pager hygiene**: pages per on-call per week ≤ 4 (steady state). Every page has runbook linked. Maintenance windows aligned with deploys. Inhibitions + silencing in place. Alert review quarterly.
6. **Runbook quality**: every page alert has a runbook. Runbook verified quarterly (first-check commands actually run). Updated after every incident that uses it. Stale runbooks flagged.
7. **Postmortem quality**: blameless tone. Systems + decisions + contributing factors, not individuals. Action items have type (prevention / detection / process), owner, due date, completion tracked.
8. **Reliability metrics tracked**: MTTA / MTTR / MTBF / change failure rate / SLO compliance / toil percentage. Per service. Reviewed monthly. Trends visible.
9. **Capacity planning**: per service, per quarter. Forecast vs actual. Headroom ≥ 2× current peak. Capacity additions scheduled before saturation.
10. **Change management**: risk class + approval + rollback recorded for every prod change. Standard changes auto-approved via GitOps. Normal+ changes need PR + review. Emergency changes get after-the-fact record.
11. **Risk register maintained**: top 10 risks per service. Reviewed monthly. Likelihood × impact scored. Mitigation status visible. New risks from incidents fed in.
12. **Game days / chaos drills**: at least one per quarter per tier-0 service. Post-drill write-up in postmortem format. Action items fed back.
13. **PRR process**: every new service / major change goes through PRR. Checklist signed off. Blocking gate, not advisory. Retroactive PRR for existing services.
14. **Architecture reliability review**: every significant design reviewed for SPOFs, isolation, headroom, backpressure, timeouts, idempotency, graceful degradation.
15. **Toil budget**: tracked per team / service. Target < 30% of engineering time. Above 50% → automation is highest-priority work (or hire). Toil inventory reviewed quarterly.
16. **Communication discipline**: status page updates during incidents. Customer-facing comms drafted and reviewed. Internal comms via incident channel.
17. **Tooling**: PagerDuty / Opsgenie / Grafana OnCall for paging. Incident.io / FireHydrant / Blameless / incident-response Slack bots for incident lifecycle. Status page hosted (Statuspage / Instatus / Better Uptime).
18. **Training + drills**: on-call onboarding doc. Pager test quarterly. Game day quarterly. Postmortem reading / write-shops for ongoing learning.
19. **Feedback loops**: incident trends → risk register updates → game day scenarios → onboarding updates → SLO adjustments.
20. **Cultural health**: blameless culture maintained. No blame-to-person in incident comms. Action items are about systems + decisions, not people. Leadership models the behavior.

Output: a report with `Aligned` components and `Violation` instances, each tagged with severity (`P0` blocks launch / `P1` must-fix this quarter / `P2` nice-to-have), a concrete fix, and an effort estimate.

## 7. Hard Rules
- **Never** ship a user-facing service without at least one SLO + error budget policy.
- **Never** allow error budget exhaustion without an enforced response (deploy freeze, escalation, root-cause work).
- **Never** declare an incident without an IC + scribe + comms channel.
- **Never** under-declare an incident to avoid attention. Declare early, demote later.
- **Never** blame an individual in a postmortem. Cite systems + decisions + contributing factors.
- **Never** ship a page alert without a tested runbook.
- **Never** page an on-call for an alert that isn't actionable. Convert to dashboard-only or ticket.
- **Never** run an on-call shift longer than 7 days straight.
- **Never** ship a major change without a documented + tested rollback plan.
- **Never** let toil exceed 50% of engineering time — that's a hiring / automation problem, not dedication.
- **Never** ship a service to production without a green PRR (or explicit sign-off from SRE + product + engineering leads).
- **Never** skip the change record for emergency changes. After-the-fact record still required.
- **Never** continue a rollout that's burning error budget > 2× in 5min. Pause or rollback.
- **Never** ignore an incident trend. Every recurring incident → risk register → game day → mitigation.
- **Always** IC + scribe + comms roles in every incident. Roles explicit in the channel.
- **Always** declare severity within 5 minutes of detection. Update severity as facts change.
- **Always** mitigate before root-causing. Stop the bleeding first.
- **Always** communicate via status page (customer-facing) + incident channel (internal) at least every 30 min during S1.
- **Always** track MTTA / MTTR / MTBF / change failure rate / SLO compliance per service.
- **Always** record risk class + approval + rollback for every prod change.
- **Always** update runbooks after every incident that used them.
- **Always** feed incident action items into the risk register + game day calendar.
- **Always** escalate when an incident isn't progressing in 15 min. Pull in another pair of eyes.
- **Always** verify the runbook. First-check commands must actually work on a recent incident.
- **Always** cap on-call at 7 days per shift, with min 2 people per rotation.

---

# Reference — SLO / Error Budget

## Design conversation template

For a new service, the design conversation walks through:

1. **Who are the users?** (internal employees? paying customers? free tier?)
2. **What journeys matter?** (the 3-5 user-facing paths that, if broken, hurt the most)
3. **What does "good" mean for each journey?** (availability? latency? freshness?)
4. **What's the floor?** (what SLI value, if violated, the user notices)
5. **What's the ceiling?** (what the system can deliver with 10× headroom for incidents + experiments)
6. **What's the target?** (somewhere between floor and ceiling, with margin for product risk)
7. **What's the window?** (typically 30 days, sometimes 7d for fast feedback)
8. **What's the budget policy?** (what happens when budget is exhausted)

## Target selection

| Service tier | Availability target | Latency target | Examples |
|---|---|---|---|
| Tier 0 — Critical | 99.99% (52.6 min / year) | p99 < 100ms | Auth, payments, search |
| Tier 1 — Important | 99.95% (4.38 h / year) | p95 < 300ms | Core APIs, checkout |
| Tier 2 — Standard | 99.9% (8.77 h / year) | p95 < 500ms | Internal tools, dashboards |
| Tier 3 — Best-effort | 99% (3.65 d / year) | best-effort | Reports, exports |

## Error budget arithmetic

- **SLO 99.9% / 30d**: 30 × 24 × 3600 × 0.001 = 4,320 seconds of allowed downtime per 30d.
- **SLO 99.99% / 30d**: 432 seconds (7.2 min).
- **SLO 99% / 30d**: 43,200 seconds (12 hours).

## Burn rate → alert thresholds (Google SRE workbook)

For SLO 99.9% over 30d, page if:
- 5m window, 14.4× burn → 2% of monthly budget in 5 min → page in 2 min
- 30m window, 6× burn → 1% of monthly budget in 30 min → page in 5 min

For SLO 99.99% over 30d, same multiples apply — tighter budget, lower absolute tolerance.

## Common pitfalls

- **Targets without a budget policy** = aspirational SLAs without teeth.
- **SLIs the team can't measure** = embarrassment in PRRs ("we have an SLO, but we can't compute it").
- **User-perceived SLI vs internal SLI**: pick the former. Internal SLIs are inputs to investigations, not commitments.
- **Over-counting availability**: if your SLI formula treats `null` (missing) as `bad`, you'll be perpetually out of budget. Define the SLI unambiguously.
- **Noisy burn alerts**: page only on the multi-window combinations that matter. Ticket on the slower ones.

---

# Reference — Incident Lifecycle

## Phases

| Phase | What happens | SRE actions |
|---|---|---|
| Detect | Alert fires, customer report, internal observation | Acknowledge within 5 min (MTTA) |
| Triage | Severity assigned, IC + scribe + comms named | Open incident channel, declare severity |
| Investigate | Hypothesis tree, dashboards, logs, traces | Update timeline continuously |
| Mitigate | Stop bleeding (rollback, scale, isolate) | Verify with metrics |
| Resolve | System back to baseline | Declare resolved, monitor 30-60 min |
| Learn | Postmortem within 5 days | Action items with owners + dates |

## IC responsibilities

- Drive investigation (delegate technical work; own the timeline).
- Decisions (rollback yes/no, escalate yes/no, comms yes/no).
- Comms to stakeholders (status page, exec, customer success).
- Hand-off cleanly (don't run an IC shift longer than 4 hours for S1/S2; take a break).

## Scribe responsibilities

- Timeline accuracy (every meaningful action in the channel).
- Decisions captured (with reasoning).
- Links captured (dashboards, logs, traces, PRs).
- Time to resolution captured for retrospective analysis.

## Communication cadence

| Severity | Customer-facing status page update | Internal exec update |
|---|---|---|
| S1 | Every 30 min | Every 30 min |
| S2 | Every 60 min | Every 60 min |
| S3 | At declare + resolve | At declare + resolve |
| S4 | At resolve | None |

## Common IC patterns

- **Suspected bad deploy?** Mitigate via rollback; investigate causes afterward.
- **Resource exhaustion?** Mitigate via scale-out + capacity plan; investigate saturation later.
- **Dependency failure?** Mitigate via degraded mode / feature flag; engage vendor support.
- **Security incident?** Mitigate via isolation + credential rotation + evidence preservation; engage security team.

---

# Reference — Postmortem Mechanics

## Google's blameless postmortem principles

1. **Focus on systems, not people**: "the deploy pipeline didn't run the canary step" not "Alice forgot to enable canary".
2. **Decisions, not actions**: "we decided to skip canary because the change was small" — the decision can be examined, the assumption can be falsified.
3. **Contributing factors, not root causes**: most incidents have 3-5 contributing factors; finding one root cause is misleading.
4. **Action items target systems**: "add automated canary check" not "Bob should remember to enable canary".
5. **Action items have type**: Prevention (prevents recurrence) / Detection (faster detection) / Process (better response).

## Action item template

```
| # | Action | Type | Owner | Due | Impact (predicted) |
|---|--------|------|-------|-----|---------------------|
| 1 | Add pagination to /v1/users | Prevention | @eng | 2w | Eliminates 5xx storms on large accounts |
| 2 | Alert on DB connection pool > 80% | Detection | @sre | 1w | MTTA < 1 min for DB saturation |
| 3 | Update runbook for payment outage | Detection | @sre | 3d | Faster root-cause, less IC time |
```

## Timeline template

```
HH:MM  ALERT  SLO 99.9% burn rate exceeds 14.4× (5m window)
       [auto-page to @oncall-primary]
HH:MM  ACK    @alex ack
HH:MM  JOIN   @sam joins (IC), @lee joins (scribe)
HH:MM  DECIDE Suspected recent deploy r1234; rollback in progress
HH:MM  ACTION argocd app rollback --revision r1233
HH:MM  VERIFY Error rate back to 0.1%; dashboards green
HH:MM  STATUS Status page: "Investigating elevated errors"
HH:MM  STATUS Status page: "Identified cause; rolling back"
HH:MM  RESOLVE Rollback complete; verified; burn rate normal
HH:MM  STATUS Status page: "Resolved"
```

## Postmortem lifecycle

1. **Draft** (within 48h): IC + scribe write first draft in shared doc.
2. **Review** (3-5 days): team reviews in dedicated meeting (timeline accuracy, contributing factors, action items).
3. **Action items** (before close): every action item has owner + type + due date + predicted impact.
4. **Track** (ongoing): action items tracked in risk register / backlog. Closure verified (was the change shipped? did it work?).
5. **Share** (always): postmortem public across the org (or org level). Patterns emerge from reading many postmortems.

---

# Reference — On-Call Mechanics

## Rotation design

| Aspect | Recommendation | Why |
|---|---|---|
| Shift length | 1 week (Mon 9am → Mon 9am local) | Bounded fatigue, clean handover |
| Min headcount | 2 (primary + secondary) | Bus-factor; primary vacation |
| Timezone coverage | Same TZ across rotation | OR (primary + secondary in different TZs) |
| Hand-off | Documented, 30-min overlap | Open incidents, recent changes, runbook updates |
| Manager escalation | After secondary 5 min no-ack | Top of escalation chain (5 + 5 + 5 = 15 min) |
| Compensation | On-call pay for after-hours pages | Industry norm; reduce attrition |
| Vacation | Re-route pages, don't expect on-call to be on vacation | Don't mix |

## Pager test (quarterly)

```bash
# Test page goes out within 60s of injection
# Test page reaches the right person (not someone out of office)
# Test ack < 5 min
# Test runbook link works
```

## Handover document template

```markdown
# On-call handover — <date>

## Outgoing: @<name>
## Incoming: @<name>

## Open incidents
- None

## Recent deploys (last 7 days)
- 2025-08-15 r1234 (rollback) — payment service, see postmortem INC-456
- 2025-08-12 r1220 (forward) — checkout, normal rollout

## Upcoming changes (next 7 days)
- 2025-08-18 schema migration to orders-service (high-risk)
- 2025-08-20 marketing event expected 3× traffic

## Known issues
- DB replica lag on weekends (known + ticket open)
- Search latency p99 elevated (acknowledged, monitor)

## Runbook updates
- Updated payment-failure runbook 2025-08-14 (tested; works)

## Anything else
- On call AMIs / customer success coverage (next 4 hours)
```

## Pager-hygiene playbook

1. **Audit**: pull pages by alertname by week. Categorize: actionable / informational / noisy / broken.
2. **Tune**: for noisy alerts, tighten condition, raise threshold, or convert to dashboard.
3. **Group + inhibit**: make sure one root-cause alert is the page, derived alerts are children (inhibit rules).
4. **Maintenance windows**: silence during planned deploys (via `amtool silence add`).
5. **Re-audit**: pages per on-call per week should trend down. Target ≤ 4/week.
6. **Reward**: don't reward high page counts (signals bad alerts, not dedication).

---

# Reference — Capacity Planning

## Inputs

```promql
# Peak QPS (last 30 days)
max_over_time(sum(rate(http_requests_total[5m]))[30d:5m])

# p99 latency (last 30 days)
max_over_time(histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))[30d:5m])

# CPU utilization (peak)
max_over_time(rate(container_cpu_usage_seconds_total[5m])[30d:5m])

# Memory utilization (peak)
max_over_time(container_memory_working_set_bytes / container_spec_memory_limit_bytes [30d:5m])
```

## Forecast

```
projected_qps = current_peak × (1 + monthly_growth_rate)^months
required_headroom = max(2× current_peak, 1.5× projected_qps)
required_capacity = projected_qps / headroom_multiple
```

## Headroom requirements by SLO

| SLO target | Required headroom (vs peak load) |
|---|---|
| 99.9% | 2× |
| 99.95% | 2.5× |
| 99.99% | 3× |

(Without headroom, you can't survive a node failure + a peak event simultaneously.)

## Capacity actions

| Gap | Action | Lead time |
|---|---|---|
| Cluster at 80% CPU | Add nodes (cluster autoscaler / Karpenter) | Minutes to hours |
| DB at 80% connections / CPU | Larger instance / read replicas | Days |
| Single-shard Redis at 80% mem | Add cluster shard | Hours |
| Cross-AZ bandwidth saturated | Multi-region traffic management | Weeks |

---

# Reference — Game Day / Chaos Drills

## Scenarios (start simple, escalate)

| Scenario | Tool | Risk |
|---|---|---|
| Kill one pod | `kubectl delete pod` | Low |
| Kill N pods to test anti-affinity | `kubectl delete pod ...` | Low |
| Node failure (drain) | `kubectl drain` | Medium |
| DB primary failover | Cloud provider failover API | Medium |
| Network partition (one AZ) | `tc qdisc` / Calico policy | High |
| Cloud region failure | Region failover test | Very high |
| Secret rotation under load | Vault rotate | Medium |

## Game day doc template

```markdown
# Game Day: <scenario>

**Date**: <date>
**Service**: <service>
**Blast radius**: staging / canary / prod
**Abort criteria**: SLO burn > 1×, customer-reported impact, manual abort

## Scenario
<What we're injecting.>

## Hypothesis
<What we think will happen.>

## Observers
- IC (not involved): @<name>
- Injector: @<name>
- Observers: @<name>, @<name>

## Steps
1. T-N: Communicate to engineering channel (#eng)
2. T-5min: Confirm dashboards + alerts + on-call ready
3. T-0: Inject fault
4. T+N: Observe (don't fix unless safety triggers)
5. T+M: Decide continue / abort
6. T+P: Roll back to original state

## Success criteria
- Detection < 5 min (MTTA target)
- Mitigation < 30 min (MTTR target)
- Runbook usable
- No customer impact (if staging) or contained impact (if canary)

## Action items
<Same format as postmortem.>
```

## Tooling

- **Chaos Mesh**: in-cluster fault injection (pod kill, network delay, IO).
- **LitmusChaos**: Kubernetes-native experiments.
- **Gremlin**: SaaS chaos engineering (paid).
- **AWS Fault Injection Service (FIS)**: cloud-level experiments.
- **Killercoda / Kube DOOM**: K8s-friendly learning tools.

---

# Reference — Four Golden SRE Metrics

## Definitions

| Metric | Definition | Target |
|---|---|---|
| **MTTA** (Mean Time To Acknowledge) | Page fired → on-call acknowledges | ≤ 5 min |
| **MTTR** (Mean Time To Resolve) | Acknowledged → resolved (S1) | ≤ 1 h |
| **MTTR** for S2 | Acknowledged → resolved (S2) | ≤ 4 h |
| **MTBF** (Mean Time Between Failures) | Time between S1+ incidents on same service | ≥ 30 days for tier-0 |
| **Change failure rate** | % of deploys causing rollback or incident | ≤ 15% |
| **SLO compliance** | % of days in-budget (SLO error budget) | ≥ target |

## Dashboard queries

```promql
# MTTA (page → ack) — average across S1+ incidents over 30d
# Usually tracked in incident tooling, not PromQL.
# For PromQL-surrogatable: time from alert_state=alert to alerting_across_team in PagerDuty webhook.

# MTTR (page → resolved)
# Captured in incident tooling (PagerDuty / Incident.io)

# Change failure rate (deploys that caused incidents)
# Source: deploy timestamp ↔ incident timestamp join from incident database

# SLO compliance
sum_over_time(
  (sli_query >= (1 - slo_target))[30d:1d]
) / 30
```

## Reporting cadence

- **Weekly**: page volume + MTTA / MTTR trends + ongoing incidents.
- **Monthly**: full SRE metrics report (all four metrics + SLO compliance + toil %).
- **Quarterly**: SLO review + capacity plan + risk register + game-day plan.

---

# Reference — PRR Checklist (detailed)

## Functional
- User-facing journeys defined + tested end-to-end.
- Failure modes identified: empty state, slow downstream, partial failure, full outage.
- Feature flags / kill switches wired for risky code paths.
- Rollback plan documented + rehearsed (test rollback in staging once).
- Database migrations tested + reversible.

## Reliability
- SLOs (1-3 per service) with explicit target + window + budget policy.
- Error budget currently healthy (>50% remaining) OR risk explicitly accepted.
- Capacity plan in place with headroom ≥ 2× projected peak.
- Recent game day / chaos drill (within 90 days).
- Architecture review completed (single points of failure, isolation, graceful degradation).

## Observability
- Three pillars flowing (metrics + logs + traces).
- ServiceMonitor / scrape config in place; service.name consistent across pillars.
- Dashboards for SRE + service owner + business.
- Alerts: symptom + saturation + SLO burn. Every page has runbook.
- OTel SDK or vendor agent installed + auto-instrumented.
- Cardinality bounded; retention tiered; cost attributed to service.

## Operations
- On-call rotation populated for at least 7 days post-launch.
- Runbooks current + verified (first-check commands run).
- Deploy automation tested (GitOps or pipeline); no manual deploys.
- Schema migrations rehearsed on production-shaped data.
- Secrets via External Secrets / Vault (not env files).

## Security
- Threat model documented.
- Image scan clean (Trivy HIGH/CRITICAL exit 0).
- Image signed (cosign).
- NetworkPolicy default-deny + explicit allow per workload.
- TLS for ingress + service-to-service.
- PII handling reviewed + encryption-at-rest verified.

## Decision
- APPROVED for production rollout.
- DEFERRED (with explicit blockers + dates).
- REJECTED (with re-review schedule).

---

# Reference — Incident Anti-Patterns (to recognize and fix)

| Anti-pattern | Why it's bad | Fix |
|---|---|---|
| "Stay calm" tone at the top of the channel | Slows acknowledgement | Assign IC + scribe within 2 min |
| Mitigating + diagnostic mixing | Both are slower | Mitigate first, investigate after green |
| Single-person investigation | Single point of failure | Pair up early; pair-program even on infra |
| Status page updates lag | Customer trust lost | Page status every 30min S1; delegate |
| Hero worship after the incident | Blame-back-door | Blameless review; system-level action items |
| Runbook never tested | Stale in the moment you need it | Quarterly first-check-command test |
| Error budget exhaustion ignored | SLO becomes theater | Enforced policy + deploy gates |
| On-call pager noise tolerated | Burnout + alert blindness | Quarterly pager-hygiene audit |
| Toil tracked as "dedication" | Under-staffing in disguise | Track toil %; fix the system, not the people |
| "We'll add SLOs later" | Aspirations without teeth | SLOs are pre-launch, not post-launch |
| Architecture review skipped | Reliability bolted on late | Reliability is design-time, not retrofit |