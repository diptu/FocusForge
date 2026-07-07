---
name: engineering-audit
description: Production-grade engineering audit practice — holistic engineering health reviews across code, architecture, security, performance, reliability, process, tooling, cost, compliance, deps, tests, observability, IaC, documentation, and risk. Multi-audience scorecards (engineering leadership / executive / compliance / M&A / customer SOC2), evidence-based findings graded P0–P3 with effort estimates, maturity scoring (Reactive / Compliant / Managed / Optimized) tied to action items + owners + dates, recurring cadence (per-PR / per-release / quarterly / annual / pre-acquisition), compliance-mapped audits (SOC 2 / ISO 27001 / HIPAA / PCI / GDPR / FedRAMP / CCPA), due-diligence reports (TTV assessment, scale, retention, tech risk, key-person, bus factor), and continuous health dashboards. The audit default in the engineering cluster. Pairs with `devops-sre` (reliability + SLO health), `devops-terraform` (IaC maturity), `devops-documentation` (doc health), `devops-observability` (instrumentation health), `devops-ci` (pipeline health), `devops-docker` (supply chain + image hygiene), `devops-kubernetes` (workload health), `backend-fastapi` + every stack-specific skill (per-stack code + arch health), `security-appsec` (deep security), `data-engineering` (data pipeline health), `compliance-soc2` (control evidence), `finops` (cost).
---

- **Execution**: Run `/audit <action> [args]`. Actions: `scorecard`, `health`, `code`, `arch`, `security`, `performance`, `reliability`, `cost`, `deps`, `license`, `compliance`, `compliance-soc2`, `compliance-iso27001`, `compliance-hipaa`, `compliance-pci`, `compliance-gdpr`, `process`, `delivery`, `due-diligence`, `mda-prep`, `exit-readiness`, `test`, `observability`, `drift`, `doc`, `iac`, `incident-trends`, `metrics`, `risk-register`, `cohort-compare`, `talent`, `retention`, `bus-factor`, `audit-chain`, `evidence`, `roadmap`, `finding`, `maturity`, `trend`, `benchmark`.

# Engineering Audit Protocol

## 1. Mission
Build an engineering audit practice that is **holistic, evidence-based, severity-graded, action-tracked, repeat-cycle-friendly, multi-audience, and trend-revealing**. The skill owns the conventions a team standardizes on — so audits don't devolve into one-off checklists that contradict each other, or executive reports that contain only reassurance.

> **Core principle:** Audit is a thermometer, not a verdict. The point is to surface truth (maturity per area, top risks, top opportunities) and feed it into the next quarter's roadmap. Audits fail when they (a) produce findings without owners, (b) score without evidence, (c) repeat without trending, (d) grade taste instead of behavior. Audit succeeds when executives can read a 1-page scorecard, engineering can read a 10-page finding list, and compliance can read an evidence trail — all from one run.

## 2. Standards
Every audit artifact MUST follow these rules:

- **Repeatable framework**: each domain has a published rubric (maturity levels + evidence criteria). Same input → same grading. Two auditors reading the same evidence should land within ±1 level.
- **Evidence before grade**: every grade cites evidence (link, command output, metric, document). No "feels like a 3" — show the metric.
- **Severity-graded findings**: P0 (blocks ship / customers / compliance) / P1 (must-fix this quarter) / P2 (should-fix this quarter) / P3 (backlog). Each finding has an owner, an effort estimate (S / M / L / XL), and a target close date.
- **Multi-audience reports**: the same raw findings render into 3 views: (1) exec 1-pager (scorecard + top risks + roadmap), (2) engineering scoreboard (findings + actions per domain), (3) compliance / customer evidence pack (controls + tests + samples).
- **Cadence-typed audits**: per-PR (lightweight, lint-driven), per-release (medium), quarterly (engineering-team health), annual (organization-wide), pre-M&A / pre-acquisition (deep, multi-team), compliance-driven (SOC 2 period).
- **Trended over time**: every scorecard carries a delta vs last period. "We moved from 2 → 3 in test coverage" beats "we have tests".
- **Maturity scoring**: 4 levels — **Reactive** (ad-hoc, no measurement) / **Compliant** (defined processes, minimal measurement) / **Managed** (instrumented + measured + tracked) / **Optimized** (trending + automated improvement + iterating). Domain-by-domain.
- **Action-driven**: each finding closes via a tracked ticket (Jira / Linear / GitHub issue) with owner + due. Audit without follow-through is theater.
- **Tooling over opinion**: where a tool exists (CodeQL / SonarQube / Snyk / Trivy / Infracost / Prowler / ScoutSuite / tfsec / Checkov / OpenCost / DORA metrics), use it. Where it doesn't, write a script.
- **Risk register is canonical**: top 10 risks land on the register; audit findings feed the register; the register feeds the roadmap.
- **Bus factor tracked**: each owned surface has a primary + secondary owner. Bus factor = 1 surfaces flagged.
- **Compliance mapping**: SOC 2 / ISO 27001 / HIPAA / PCI / GDPR controls each have a control owner + evidence path + test cadence.
- **No grading yourself**: any audit > quarterly gets an external reviewer (peer team / consultant) calibrated against the rubric.
- **Cohort comparability**: scores normalize to the same scale regardless of team size (per-engineer ratios: tests/PER, PR/PER, dep vulns/PER).
- **Findings have intent**: every finding recommends a *direction*, not just a fix. "Add tests" → "Add 200 tests of the auth flow that exercised the last 3 production incidents" (closer to actionable).
- **Trend visibility**: per-quarter dashboards show scorecard + finding closure rate + new findings. No lag.
- **Tooling maturity is auditable**: which tools are configured, which are running, which are blocking. Tooling ≠ use; tooling with enforcement = maturity.

## 3. Workflow Actions

### `/audit scorecard [scope]`
Generate the executive scorecard.
- Inputs: scope (org / business unit / team / service), period (quarter / year / pre-acquisition), audience focus.
- Outputs:
  ```markdown
  # Engineering Scorecard: <org> — Q<Y>

  **Scope**: 12 services, ~80 engineers, $14M ARR
  **Period**: <YYYY Q?-MM-DD → -MM-DD>
  **Methodology**: <rubric link>
  **Auditor**: <team or external>

  ## 1-pager

  ### Maturity per domain (4 = Optimized, 3 = Managed, 2 = Compliant, 1 = Reactive)
  | Domain | Score | Δ vs last Q | Trend |
  |---|---|---|---|
  | Code health | 2.4 | +0.2 | up |
  | Architecture | 2.7 | +0.1 | flat |
  | Security | 3.1 | +0.4 | up |
  | Reliability (SRE) | 3.2 | +0.6 | up |
  | Performance | 2.5 | +0.0 | flat |
  | Test health | 2.6 | +0.3 | up |
  | Documentation | 1.8 | +0.1 | up |
  | CI/CD | 3.0 | +0.0 | flat |
  | IaC (Terraform) | 2.9 | +0.4 | up |
  | Observability | 3.3 | +0.5 | up |
  | Process | 2.5 | +0.1 | flat |
  | Cost | 2.0 | -0.1 | down |
  | **Composite** | **2.66** | **+0.22** | **up** |

  ## Top risks (top 5)
  1. P0 ... [risk register ID, link]
  2. P0 ...
  ...

  ## Top opportunities (sequence by ROI)
  1. ... [owner, target date]
  ...

  ## Closing rate
  - Findings raised last Q: 47
  - Closed: 31 (66%)
  - Open P0/P1: 4

  ## Cross-team deltas
  - Team A: +0.5 (lots of new tests)
  - Team B: -0.3 (drift)
  ```
- Rule: the scorecard is single-page-readable in 60 seconds.

### `/audit health [scope]`
Quick engineering health check.
- Inputs: scope, depth (1 = smoke / 2 = standard / 3 = deep).
- Outputs:
  - Smoke (~ 1h): static signals (CI green % / coverage / high vuln count / on-call rotation status / runbook coverage / cost ratio per SLO).
  - Standard (~ 1 day): full 13-domain scorecard with evidence.
  - Deep (~ 1 week): standard + per-service deep-dive + cohort comparison + roadmap.

### `/audit code [repo]`
Code-health audit.
- Inputs: repo / scope, rubric version.
- Outputs:
  | Metric | Target | Actual | Source |
  |---|---|---|---|
  | Cyclomatic complexity (avg / max) | ≤ 10 / ≤ 20 | ... | lizard / scc |
  | Duplicate code | ≤ 5% | ... | jscpd / cpd |
  | Coverage (line + branch) | ≥ 80% / 70% | ... | coverage.py / jest / go test |
  | Dead code | ≤ 3% | ... | vulture / ts-prune |
  | Files > 500 LOC | 0 | ... | cloc |
  | Functions > 50 LOC | 0 | ... | cloc |
  | TODO / FIXME | trend down | ... | ripgrep |
  | Lint errors | 0 | ... | eslint / golangci-lint |
  | Type errors | 0 | ... | tsc --noEmit / mypy strict |
  | Spelling errors | 0 | ... | codespell |
  | Test-to-code ratio | ≥ 1.0 | ... | coverage + cloc |
  | Public APIs docstringed | 100% | ... | pdoc / typedoc |
  | Dependency freshness | ≤ 6 months behind | ... | dependabot / renovate |
  ```
- Maturity:
  - Reactive: no coverage reported, lint rarely runs in CI.
  - Compliant: coverage reported, lint in CI but warnings only.
  - Managed: coverage gates PR, type-check strict, lint errors block.
  - Optimized: trend dashboards, automatic refactor suggestions, complexity budget enforced.

### `/audit arch [service_or_system]`
Architecture audit.
- Inputs: scope, level (system / service / module), methodology (ATAM / quick review / full review).
- Outputs:
  - Architecture-characteristics scoring (modifiability / performance / availability / security / testability / deployability / scalability):
    | Characteristic | Score (0-3) | Evidence | Trend |
    |---|---|---|---|
    | Modifiability | 2 | cycle time PR, refactor PR rate | up |
    | Performance | 3 | p99 SLO compliance | flat |
    | Availability | 3 | SLO compliance 99.95% | up |
    | Security | 2 | threat model coverage | flat |
    | Testability | 2 | mutation test score | down |
    | Deployability | 3 | lead time for change | up |
    | Scalability | 2 | headroom test | flat |
  - Coupling / cohesion (forward + reverse dependency graph).
  - ADR coverage: significant decisions captured.
  - Module health: module churn, fan-in/fan-out.
  - Pair: `/doc arch` for the artifact; `/audit risk` for the surface.

### `/audit security [scope]`
Security audit (full / scope-limited). Pairs with `security-appsec`.
- Inputs: scope (app / infra / org / specific surface), depth.
- Outputs:
  ```markdown
  # Security Audit: <scope>

  ## Surface
  - Applications: <list>
  - Infrastructure: <cloud accounts, regions>
  - Data: <PII / PHI / PCI scope>
  - Identity: <IdP, MFA, SSO>
  - CI/CD: <tools, runners, secrets>

  ## Maturity (per S2 / ISO 27001 / OWASP)
  | Area | Score | Evidence | Trend |
  |---|---|---|---|
  | SAST | 3 | CodeQL + SonarQube in CI | up |
  | DAST | 2 | OWASP ZAP monthly | flat |
  | Dependency scan | 3 | Snyk + Dependabot, block on HIGH | up |
  | Image scan | 3 | Trivy in registry + admission | up |
  | IaC scan | 2 | tfsec weekly | flat |
  | Cloud posture | 2 | Prowler quarterly | flat |
  | Secrets hygiene | 3 | Vault / SOPS, no env literals | up |
  | IAM least privilege | 2 | quarterly access review | flat |
  | MFA + SSO | 3 | enforced org-wide | up |
  | Logging + detection | 2 | SIEM, 24h MTTD | down |
  | Incident response | 3 | runbooks tested | up |
  | Threat modeling | 1 | 3 services model; backlog 9 | down |
  | Data encryption | 3 | at-rest + in-transit | up |
  | PII handling | 2 | field-level audit | flat |

  ## Findings
  | # | Finding | Severity | OWASP / Control | Owner | Effort | Due |
  |---|---|---|---|---|---|---|
  | 1 | Threat models missing for 9 services | P1 | A05 | @appsec-lead | M | 30d |
  | 2 | IAM over-privileged roles on 4 services | P0 | CC6.1 | @platform | S | 7d |
  | 3 | Outdated encryption on EBS volume (legacy) | P1 | CC6.7 | @infra | M | 30d |

  ## Compliance map
  - SOC 2: covered (see `/audit compliance-soc2`)
  - ISO 27001: covered (see `/audit compliance-iso27001`)
  - GDPR: partial — see `/audit compliance-gdpr`
  ```

### `/audit performance [system]`
Performance audit.
- Inputs: scope, load profile (avg / peak / projected).
- Outputs:
  - **Latency**: p50 / p95 / p99 / p99.9; trend.
  - **Throughput**: req/s, target ratio (actual / capacity).
  - **Resource utilization**: CPU / memory / network / connection pools.
  - **Bottleneck identification**: profile flame graph, slow query log, sync-vs-async boundary analysis.
  - **Caching**: cache hit rate; over-fetch; redundant calls.
  - **Page weight**: bundle size, image size, third-party cost.
  - **Cost-per-request**: GPU/$ / API call/$ ratio.
  - **Headroom vs peak**: how much capacity for next launch.
  - Findings: P0 (SLO breach) / P1 (latency regression) / P2 (over-utilization).
  - Maturity:
    - Reactive: no perf data; "feels slow".
    - Compliant: p95 dashboards; no per-user budget.
    - Managed: per-route SLO; load-tested pre-release.
    - Optimized: chaos-tested perf boundaries; auto-tuned; rolling p99 in dashboards.

### `/audit reliability [system_or_team]`
Reliability audit. Pairs with `devops-sre`.
- Inputs: scope, time window.
- Outputs:
  - **4 SRE metrics**:
    | Metric | Target | Actual | Trend |
    |---|---|---|---|
    | MTTA | ≤ 5 min P2+ | ... | trend |
    | MTTR (S1) | ≤ 60 min | ... | trend |
    | MTBF (tier-0) | ≥ 30 days | ... | trend |
    | Change failure rate | ≤ 15% | ... | trend |
    | SLO compliance | ≥ target | ... | trend |
  - **DORA metrics**: lead time / deploy freq / MTTR / change-fail rate.
  - **Toil %**: per team.
  - **Pager hygiene**: pages/on-call/week; alert audit.
  - **SLO coverage**: % services with SLO + budget policy.
  - **PRR coverage**: % tier-0 services with current PRR.
  - **Game-day coverage**: tier-0 chaos drills last 90 days.
  - Findings: P0 (no SLO + no on-call for prod) / P1 (budget exhausted and not paused) / P2 (toil > 30%).
  - Pair: `/sre audit` for deeper driver.

### `/audit cost [scope]`
Cost audit. Pairs with `finops`.
- Inputs: scope, time window.
- Outputs:
  - **Spend by service / team / environment** with delta vs last period.
  - **Cost-per-customer / cost-per-request / cost-per-feature**.
  - **Waste**: idle instances, over-provisioned RDS, unattached volumes, unused EIPs, dev envs running 24/7.
  - **Unit economics**: cost-to-serve per active customer.
  - **Trends**: 30 / 90 / 365-day deltas.
  - **Findings**: P0 (zombie infra > $X) / P1 (forecast overrun > $Y) / P2 (untagged spend).
  - Maturity:
    - Reactive: monthly bill only; no breakdown.
    - Compliant: per-team dashboard; reviewed monthly.
    - Managed: per-feature cost; budget alarms; cost-aware PRs (Infracost).
    - Optimized: rightsizing auto; cost-as-engineering-metric; FinOps team.

### `/audit deps [repo_or_service]`
Dependency audit (software supply chain).
- Inputs: repo / service / org.
- Outputs:
  - Manifest inventory (package.json / go.mod / requirements.txt / Cargo.toml / Pipfile.lock).
  - Direct vs transitive depth.
  - Vuln status: count by severity (CVE database via OSV / Snyk / GitHub Advisory).
  - License status: per dep, license type, allowed/forbidden.
  - Freshness: last release date per dep; newer alternatives.
  - Unmaintained: no release in 12+ months.
  - Replaceable: do we use a feature that's now in the runtime?
  - **SBOM** generated (CycloneDX / SPDX).
  - **SLSA provenance** check (build provenance chain).
  - Findings: P0 (RCE CVE with no patch) / P1 (deprecated + vulnerable) / P2 (unmaintained).
  - Maturity:
    - Reactive: deps installed ad-hoc; no scans.
    - Compliant: scan weekly; no enforcement.
    - Managed: PR bot (Renovate/Dependabot) + scan gates + SBOM each release.
    - Optimized: vendor + supply chain attestation (Sigstore / in-toto).

### `/audit license [scope]`
License compliance audit.
- Inputs: scope, license policy (allowed list, copyleft policy).
- Outputs:
  - Per-dependency license + compatibility (incoming + outgoing).
  - GPL/LGPL/AGPL presence (with usage analysis).
  - Notice + attribution requirements.
  - Findings: P0 (forbidden license copyleft in proprietary product) / P1 (attribution missing) / P2 (license update required).
  - Pair: `/legal review` if scope crosses regulated surface (medical, gov).

### `/audit compliance [framework]`
Compliance audit. Routes to framework-specific actions.
- Inputs: framework (SOC 2 / ISO 27001 / HIPAA / PCI / GDPR / FedRAMP / CCPA / custom).
- Outputs:
  - **Controls matrix** (Trust Services Criteria for SOC 2; ISO Annex A for ISO 27001).
  - **Per control**: status (Implemented / Partial / Gap / N/A) + evidence path + owner + last-tested.
  - **Deviations**: with severity, remediation plan.
  - **Audit window readiness**: what's missing before external auditor arrives.
  - Pair: `/audit compliance-soc2`, `/audit compliance-iso27001`, etc., for the controls + evidence pack.

### `/audit compliance-soc2`
SOC 2 audit.
- Outputs (per Trust Services Criterion):
  - **CC1 — Control Environment**: code of conduct, security training, background checks.
  - **CC2 — Communication**: policies published, incidents reported, change advisory board.
  - **CC3 — Risk Assessment**: risk register, threat modeling, third-party risk.
  - **CC4 — Monitoring**: internal controls tested; deviations logged; alerting.
  - **CC5 — Control Activities**: policy enforcement, separation of duties, least privilege.
  - **CC6 — Logical + Physical Access**: IAM, MFA, encryption, key management.
  - **CC7 — System Operations**: change mgmt, capacity mgmt, backup + restore.
  - **CC8 — Change Management**: PR review, CI gates, rollback tested.
  - **CC9 — Risk Mitigation**: third-party vendor reviews, business continuity.
  - Each: `status`, `evidence`, `tested-by`, `last-tested`, `deviations`, `comments`.

### `/audit compliance-iso27001`
ISO 27001 audit.
- Outputs (per Annex A control):
  - **A.5 Organizational**: policies, roles, classification.
  - **A.6 People**: screening, awareness, training.
  - **A.7 Physical**: facility, equipment.
  - **A.8 Technological**: access control, crypto, operations, comms, system acquisition.
  - **A.9 People (legacy numbering)**: see A.6.
  - **A.10 Cryptographic**: key management, algorithm choice.
  - **A.11 Physical (legacy numbering)**: see A.7.
  - **A.12 Operations**: change, capacity, backup.
  - **A.13 Communications**: network controls.
  - **A.14 System acquisition**: SDLC, secure coding, test coverage.
  - **A.15 Supplier**: third-party risk.
  - **A.16 Incident**: detection, response, learning.
  - **A.17 Business continuity**: planning, testing.
  - **A.18 Compliance**: legal, regulatory, audit.

### `/audit compliance-hipaa`
HIPAA audit (US healthcare).
- Outputs (per Security Rule):
  - **Administrative safeguards**: risk analysis, workforce training, contingency plan, evaluation.
  - **Physical safeguards**: facility access, workstation use, device controls.
  - **Technical safeguards**: access control, audit controls, integrity, transmission security.
  - **Breach notification**: process + test.
  - **BAA inventory**: with each PHI processor.

### `/audit compliance-pci`
PCI DSS audit.
- Outputs (12 requirements): networks, cardholder data protection, vulnerability management, access control, monitoring, security policy.

### `/audit compliance-gdpr`
GDPR audit.
- Outputs:
  - **Lawful basis** per processing activity.
  - **Records of processing activities (RoPA)**.
  - **Data subject rights**: access / rectification / erasure / portability / objection.
  - **Breach notification**: 72-hour process.
  - **DPIA**: high-risk processing.
  - **Cross-border transfer mechanisms**: SCC, BCRs, adequacy decisions.
  - **DPO + privacy by design**.

### `/audit process [scope]`
Engineering process audit.
- Inputs: scope (team / org).
- Outputs:
  - **DORA metrics**: lead time / deploy freq / MTTR / change-fail rate.
  - **PR review hygiene**: median time-to-first-review; median time-to-merge; review depth (LOC / comment ratio).
  - **PR size distribution**: target PR < 400 LOC.
  - **Trunk-based vs long-lived branches**.
  - **Feature flag usage**: rollout safety.
  - **Postmortem culture**: P0/P1 PM rate; action item closure.
  - **On-call health**: rotation depth, alert noise, vacation coverage.
  - **Doc freshness** (delegated to `/doc freshness`).
  - Findings: P1 (PR review lagging / no flag rollout) / P2 (postmortem action item backlog).

### `/audit delivery [service]`
Delivery-readiness audit. Pre-release gate.
- Outputs:
  - **Functional**: journeys tested; failure modes handled; feature flags; rollback rehearsed.
  - **Reliability**: SLOs + budget policy; capacity ≥ 2× projected; recent game day.
  - **Observability**: three pillars flowing; dashboards; alerts wired with runbook.
  - **Operations**: on-call populated; runbooks tested; deploy automation; migrations rehearsed.
  - **Security**: threat model; image scan clean; image signed; secrets via manager; NetworkPolicy default-deny; TLS everywhere; audit logging.
  - **Decision**: APPROVED / DEFERRED (with list + dates) / REJECTED.
  - Pair: `/doc prr`, `/sre prr`.

### `/audit due-diligence [target]`
Pre-M&A / pre-investment engineering due diligence.
- Inputs: target company, scope (entire org / specific area), depth.
- Outputs:
  ```markdown
  # Tech Due Diligence: <target>

  ## Executive summary
  - TTV (tech team valuation): $X (vs ask $Y, delta Z%)
  - Top 5 risks: <...>
  - Top 5 opportunities: <...>
  - Year-1 carry-forward estimate: $A to fix P0s + P1s.
  - Year-2 platform investment: $B for maturing practice.

  ## Maturity scorecard (4 levels, 13 domains)
  <full table; cohort-graded per industry / size>

  ## Code health
  - Coverage: <%> (target 80%) — vs cohort 65%
  - Tech debt ratio: <%> — vs cohort <%>
  - Test-to-code ratio: <X>
  - Last refactor: <date>
  - Code ownership: <bus factor per major surface>

  ## Architecture
  - Services + boundaries + monolith/repo shape.
  - Coupling heatmap.
  - ADR coverage.
  - Modularity score.
  - Tech radar fit (ThoughtWorks).

  ## Scale + performance
  - Top user journeys: p50 / p95 / p99.
  - Peak load test result.
  - Capacity headroom.
  - Cost-per-1M-requests.
  - Scale curve (linear / sub-linear / non-linear).

  ## Reliability
  - 4 SRE metrics + trend.
  - Incident history (last 24 months): count, MTTR, severity mix.
  - On-call depth.
  - Error budget discipline.

  ## Security
  - Vulnerability posture (high / critical count + trend).
  - Last pen-test: <date> + result.
  - Compliance attestation: SOC 2 / ISO / etc.
  - IAM hygiene.
  - Threat model coverage.

  ## People + process
  - Engineering headcount, tenure, distribution.
  - Bus factor per major area.
  - Hiring velocity + attrition.
  - Process maturity (PR review / DORA / runbook hygiene).

  ## Cost
  - Cloud spend + trend + cost-to-serve.
  - License costs (perpetual + SaaS).
  - Year-1 cloud spend forecast.

  ## Tech risk register
  | Risk | Likelihood | Impact | Score | Mitigated? |
  |---|---|---|---|---|
  | Single DB primary, no replica | 4 | 5 | 20 | no |
  | Dep on unmaintained lib X | 3 | 4 | 12 | partial |
  | Key eng leaving soon | 4 | 5 | 20 | no |
  | License non-compliance | 2 | 5 | 10 | unknown |

  ## Synergies + retention risk
  - Tech overlap with acquirer.
  - Key engineers retention offer needed.
  - Migration cost estimate.

  ## Recommendation
  - Adjust offer by $X to reflect tech risk + remediation.
  - Or: proceed at ask, with explicit Y-year plan on tech gaps.
  ```
- Rule: DD is signed off by an experienced auditor; rubrics calibrated.

### `/audit mda-prep`
Mutual due diligence (defensive).
- Inputs: scope, target audience (acquirer / investor).
- Outputs: the inverse — a polished, evidence-anchored self-assessment that withstands scrutiny.
- Pair: `/audit due-diligence` for the offensive pattern.

### `/audit exit-readiness [business]`
Acquisition / IPO readiness.
- Outputs:
  - SOC 2 Type II readiness (12-month window).
  - ISO 27001 readiness.
  - GDPR / CCPA readiness.
  - DR + BCP evidence.
  - Engineering KPIs (DORA + 4 SRE metrics) over the audit window.
  - Key-person dependencies.
  - Multi-tenant / customer concentration risk.

### `/audit test [repo]`
Test health audit.
- Outputs:
  | Metric | Target | Actual |
  |---|---|---|
  | Coverage (line) | ≥ 80% | ... |
  | Coverage (branch) | ≥ 70% | ... |
  | Test-to-code ratio | ≥ 1.0 | ... |
  | Unit / integration / e2e ratio | 70/20/10 | ... |
  | Flake rate (CI) | ≤ 1% | ... |
  | MTTR (failed test) | ≤ 24h | ... |
  | Mutation score | ≥ 60% | ... |
  | Test isolation | 100% | ... |
  | Test speed (unit suite) | ≤ 5 min | ... |
  | Test speed (e2e suite) | ≤ 30 min | ... |
  | Skipped tests | trending down | ... |
  ```
- Findings: P0 (critical path untested) / P1 (e2e > 30 min, flake > 3%) / P2 (low mutation).
- Maturity:
  - Reactive: tests are partial; CI runs only some.
  - Compliant: tests exist; coverage reported.
  - Managed: coverage gates; mutation; flake budget.
  - Optimized: test pyramid tuned; auto-refactor; chaos test infra.

### `/audit observability [system]`
Observability health audit. Pairs with `devops-observability`.
- Outputs:
  - **Three pillars coverage**: metrics / logs / traces flowing.
  - **RED/USE/SLO dashboards present** + linked from runbooks.
  - **Cardinality bounded**: high-cardinality labels flagged.
  - **Alert noise**: pages/on-call/week; alert audit.
  - **Onboarding time** for a new engineer to debug (target < 1 shift).
  - **High-cardinality cost**: spend on logs / metrics; per-team.
  - **Runbook linkage**: every page has a runbook.
  - Findings: P0 (no metrics on prod) / P1 (no runbooks) / P2 (high cardinality).
  - Maturity: Reactive (logs only) / Compliant (logs + metrics) / Managed (+ traces + SLO) / Optimized (chaos-instrumented; auto-remediation).

### `/audit drift [scope]`
Configuration + infrastructure drift audit.
- Inputs: scope.
- Outputs:
  - Resources in cloud but not in state (orphan).
  - Resources in state but not in cloud (phantom).
  - Manual console changes since last apply.
  - Tag-completeness across resources.
  - Findings: P0 (data store drift) / P1 (unintended creation) / P2 (untagged).
  - Pair: `/tf drift`, `/tf audit`.

### `/audit doc [scope_or_repo]`
Documentation health audit. Pairs with `devops-documentation`.
- Inputs: scope.
- Outputs:
  - Coverage per service (README + Tutorial + How-To + Reference + Architecture + ADR + Runbook).
  - Owner coverage (per `/doc ownership`).
  - Freshness (per `/doc freshness`).
  - Lint pass (per `/doc lint`).
  - Broken links (per `/doc broken-links`).
  - Diagram source coverage.
  - AI readiness (per `/doc ai-ready`).
  - Findings: P1 (stale runbook, no owner) / P2 (lint drift).
  - Pair: `/doc audit`.

### `/audit iac [scope]`
IaC maturity audit. Pairs with `devops-terraform`.
- Outputs: state hygiene / module discipline / variable contract / provider pinning / plan discipline / apply gates / drift detection / secrets handling / policy as code / security scanning / tagging / cost visibility / tests / CI/CD isolation / backup-restore / upgrade cadence / refactor hygiene / documentation.
- Pair: `/tf audit`.

### `/audit incident-trends [period]`
Incident trend review.
- Outputs:
  - Incidents per period (count by severity, by service).
  - MTTA / MTTR distribution (P50 / P90 / P99).
  - Repeat-cause frequency (top 10 contributors).
  - Action item closure rate.
  - Drift in SLO compliance.
  - Escalation patterns (L1 → L2 → L3 time).
  - Findings: P1 (recurring incident class > 3 / quarter) / P2 (action items stuck > 90d).

### `/audit metrics [period]`
DORA + 4 SRE + Space metrics consolidation.
- Outputs:
  | Metric | Value | Trend | Benchmark |
  |---|---|---|---|
  | Lead time for change (median) | ... | trend | DORA Elite: < 1h |
  | Deploy frequency | ... | trend | Elite: on-demand |
  | Change failure rate | ... | trend | Elite: ≤ 15% |
  | MTTR (S1) | ... | trend | Elite: ≤ 1h |
  | MTTA (P2+) | ... | trend | ≤ 5 min |
  | Reliability (SLO compliance) | ... | trend | varies |
  | Toil % | ... | trend | ≤ 30% |
  - Pair: `/audit reliability`.

### `/audit risk-register [scope]`
Risk register maintenance + audit.
- Outputs:
  - Top 10 risks per area (likelihood × impact; mitigation status).
  - Risks closing this period; new risks opened.
  - Aging: risks open > 90 days.
  - Findings: P1 (top risk unowned) / P2 (aging risk).
  - Pair: `/sre risk-register`, with engineering-risk overlay (key-person, vendor, EOL tech).

### `/audit cohort-compare [team_or_org]`
Benchmark vs cohort.
- Inputs: team / org; cohort (industry / size / stage).
- Outputs:
  - Maturity scores normalized to cohort.
  - DORA / SRE metrics percentile.
  - Findings: P2 (sub-cohort) / strengths to highlight.

### `/audit talent [team]`
Engineering talent + organization audit.
- Outputs:
  - Headcount by level + tenure distribution.
  - Hiring velocity + time-to-fill + acceptance rate.
  - Attrition last 4 quarters (regrettable + non-regrettable).
  - Performance review coverage.
  - Calibration distribution.
  - Promotion velocity.
  - Engagement survey (eNPS) trend.
  - Diversity / inclusion metrics (where applicable).
  - Findings: P1 (regrettable attrition > 12%) / P2 (calibration drift).

### `/audit retention [key_engineer]`
Individual retention risk + knowledge continuity.
- Outputs:
  - Tenure + role + impact.
  - Bus factor for surface they own.
  - Knowledge transfer readiness.
  - Comp band fit.
  - Findings: P0 (bus factor = 1 for tier-0 surface) / P1 (regrettable attrition signal).

### `/audit bus-factor [surface]`
Bus factor per surface.
- Outputs:
  - Per surface (services / repos / domains / on-call rotations):
    | Surface | Primary | Secondary | Bus factor |
    |---|---|---|---|
    | Payments service | @alice | @bob | 2 |
    | On-call rotation A | @alice | @bob | 2 |
    | SSO integration | @eve | — | **1** |
  - Risk score: surfaces with bus factor = 1 get P0.
  - Mitigation: cross-training, doc, runbook updates.

### `/audit audit-chain [scope]`
Audit trail (chain of audits over time).
- Outputs:
  - Last 12 audits on this scope, with scorecard + delta + finding closure.

### `/audit evidence [control_or_finding]`
Compile + index evidence pack.
- Inputs: control / finding, period.
- Outputs:
  - Pulled artifacts: PRs (with hashes), review comments, CI logs, dashboards (PNG / links), runbooks, postmortems, ADRs, design docs, ticket threads.
  - Hash-stamped (optional) for tamper-evidence.
  - Bundle ready for external auditor / acquirer / customer.

### `/audit roadmap [period]`
Audit-driven roadmap.
- Inputs: open findings + risks, capacity, strategic priorities.
- Outputs:
  - Sequenced list with owner + quarter + dependency:
    | Initiative | Driver | Quarter | Owner | Effort | Impact |
    |---|---|---|---|---|---|
    | Bring all tier-0 SLOs to 99.95% | P0 finding | Q+1 | @sre | M | reliability, customer trust |
    | Migrate 9 services to threat-modeled | P1 finding | Q+1 | @appsec | L | SOC 2 readiness |
    | Deprecate unmaintained lib X | P1 finding | Q+1 | @platform | S | CVE exposure |

### `/audit finding [id]`
Track a single finding from open to close.
- Inputs: finding ID.
- Outputs:
  - Status: Open / In Progress / Verified / Closed / Won't Fix
  - Owner + due date + SLA from severity:
    | Severity | Close by |
    |---|---|
    | P0 | 7 days |
    | P1 | 30 days |
    | P2 | 90 days |
    | P3 | backlog |
  - Evidence of fix (PR / config change / doc link).
  - Verification (re-run rubric).
  - Trend across periods (recurring vs new).

### `/audit maturity [domain]`
Detailed maturity grading for a single domain.
- Inputs: domain (one of 13), scope, evidence.
- Outputs:
  - Score 1-4 per domain sub-area.
  - Evidence links.
  - Recommended next-level actions.
  - Comparison to last period.

### `/audit trend [metric]`
Single-metric trend review.
- Inputs: metric, period.
- Outputs:
  - Quarterly chart (e.g., coverage, deploy freq, change fail rate).
  - Annotations (launches / incidents / org changes).
  - Forecast where relevant.

### `/audit benchmark [scope]`
External benchmarking.
- Inputs: scope, cohort (industry).
- Outputs:
  - DORA / SRE percentile.
  - Maturity vs peers.
  - Insights + opportunities.

### `/audit matrix [matrix_id]`
Generate an audit matrix (controls-by-evidence).
- Inputs: matrix ID (e.g., `soc2-2026-q3`, `iso27001-audit-2026`).
- Outputs: ID + evidence per control; format ready for external auditor import.

---

## 4. Execution Order (Full Audit Engagement)

For a new org / service / team entering audit practice:

1. `/audit health` (smoke) — establish baseline.
2. `/audit scorecard` (full) — 13 domains, evidence-graded.
3. `/audit evidence` — bulk evidence collection.
4. `/audit risk-register` — risk register canonicalized.
5. Domain-specific audits — code, arch, security, performance, reliability, cost, deps, license, process, test, observability, doc, iac, incident-trends.
6. Compliance audits (driven by framework — SOC 2 / ISO 27001 / etc.).
7. `/audit bus-factor` — identify tier-0 surfaces at risk.
8. `/audit finding` workflow — open tickets per finding.
9. `/audit roadmap` — sequenced by impact, capacity, dependencies.
10. `/audit talent` + `/audit retention` — people dimension.
11. Trend prep — delta vs last period.
12. Cohort compare — bench external.
13. External calibration — peer review or consultant challenge.
14. `/audit scorecard` (final) — exec 1-pager ready.
15. `/audit evidence` (bundle) — for auditor / acquirer / customer.

Recurrence per scope:
- Smoke health: monthly.
- Standard scorecard: quarterly.
- Annual: full org-wide + compliance-mapped.
- Pre-acquisition / pre-IPO: deep, multi-team, external-validated.

> 🛑 **No release / sale / acquisition / compliance attestation without:** current audit scorecard signed off; P0/P1 findings have owners + dates; risk register current; evidence pack intact.

## 5. Output Location
- `audits/<period>/<scope>/` — per-period artifacts.
- `audits/<period>/<scope>/scorecard.md` — exec 1-pager.
- `audits/<period>/<scope>/findings.md` — engineering scoreboard.
- `audits/<period>/<scope>/evidence/` — hash-stamped bundle.
- `audits/matrices/` — control × evidence matrices.
- `audits/roadmap.md` — canonical roadmap (cross-period).
- `audits/rubrics/` — published grading rubrics.
- `.audit-config.yml` — tool + scope config (auditors use this).

Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing engineering org / repo / system:

1. **Scope**: confirm org boundary, service list, repositories, compliance frameworks in play.
2. **Methodology**: select rubric (Reactive / Compliant / Managed / Optimized), score definitions, evidence rules.
3. **Tools inventory**: SAST (CodeQL), secrets (gitleaks / trufflehog), deps (Snyk / Dependabot / Renovate), IaC (tfsec / Checkov), cloud (Prowler / ScoutSuite / Steampipe), performance (k6 / Locust / wrk), test coverage (codecov / sonarqube), DORA (LinearB / Sleuth / Swarmia / Allstacks), observability (datadog / grafana / honeycomb), code health (SonarQube / CodeScene / CodeClimate).
4. **Calibration**: 2 auditors independently score 2 sample services; reconcile differences; lock rubric.
5. **Evidence collection**: automated pull first (CI artifacts, dashboards), then targeted greps + interviews.
6. **Findings draft**: severity-graded with evidence + owner + effort; risk-register sync.
7. **Scorecard build**: 13-domain composite.
8. **Roadmap draft**: 30 / 60 / 90 with dependencies.
9. **Calibration round 2**: independent review of scorecard + findings.
10. **Exec presentation**: walk through with engineering leadership; resolve.
11. **Final delivery**: report + evidence pack.
12. **Trend**: ingest into dashboard.
13. **Closure cycle**: tickets created, due dates set.
14. **Re-audit**: next period.

Output: report with `Aligned` / `Compliance` / `At Risk` / `Critical` per domain, severities per finding, scorecard composite, executive summary, and risk-register update.

## 7. Hard Rules
- **Never** grade without evidence; every grade has at least one link or measurement.
- **Never** publish a finding without an owner.
- **Never** ship a P0 finding without an immediate action plan (7-day SLA).
- **Never** audit yourself for any compliance attestation without external counter-review.
- **Never** confuse "we have a tool" with "we use the tool"; enforcement is the rubric.
- **Never** ship a scorecard without trend deltas.
- **Never** ship a roadmap without sequencing + dependencies.
- **Never** label a domain "Optimized" if it has open P0s.
- **Never** consider a year passed without at least one deep audit.
- **Never** take a single data point as the truth; look at trend + cohort.
- **Never** skip the bus-factor review for tier-0 services.
- **Never** ship an audit without a calibration round.
- **Always** publish the rubric alongside the scorecard.
- **Always** cite evidence per grade.
- **Always** tag findings with severity + owner + effort + due.
- **Always** calculate trend (current period vs prior).
- **Always** cohort-normalize scores.
- **Always** include a risk register with audit findings as inputs.
- **Always** carry findings forward between audits until closed.
- **Always** bundle evidence pack for compliance / acquirer.
- **Always** include "what changed since last audit" in the scorecard narrative.
- **Always** drive a roadmap from findings, not from strategy decks alone.
- **Always** log audit metadata (auditor / period / rubric version / scope sha).
- **Always** treat a flat or down-trending scorecard as a signal to dig deeper, not to confirm "all good".

---

# Reference — Maturity Models

## 4-level generic

| Level | Name | Definition | Example signals |
|---|---|---|---|
| 1 | Reactive | Ad-hoc; no measurement | Coverage reported once; lint on local only; no on-call rotation |
| 2 | Compliant | Defined processes; minimal measurement | Coverage reported weekly; lint in CI warnings; on-call rotation with runbooks |
| 3 | Managed | Instrumented + measured + tracked | Coverage gates PR; lint errors block; on-call with paging tests and budget policies |
| 4 | Optimized | Trending + automated improvement; iterating | Mutation-score-tracked; auto-refactor suggestions; chaos-tested; SLO auto-tuned |

## Domain sub-rubrics (excerpt)

### Code health
| Level | Signals |
|---|---|
| 1 | Lint on local only; coverage unknown; no type-check |
| 2 | Lint in CI; coverage reported; type-check exists |
| 3 | Coverage gates PR; strict type-check; lint errors block |
| 4 | Mutation-tested; auto-refactor; complexity budget enforced |

### Architecture
| Level | Signals |
|---|---|
| 1 | No ADRs; no module boundaries; co-change pattern unknown |
| 2 | Some ADRs; obvious module boundaries; some coupling |
| 3 | ADR coverage > 80% significant decisions; reviewed; coupling graphs |
| 4 | Continuous architecture fitness function; CI blocks coupling regressions |

### Security
| Level | Signals |
|---|---|
| 1 | No SAST; no vuln scan; no MFA |
| 2 | SAST in CI; vuln scan weekly; MFA enforced |
| 3 | SAST gates; vuln scan gates on HIGH/CRIT; secrets via Vault; threat model per service |
| 4 | Mutation-tested security rules; SLSA L3 supply chain; chaos-security testing |

### Reliability (SRE)
| Level | Signals |
|---|---|
| 1 | No SLOs; ad-hoc on-call; no runbooks |
| 2 | SLOs on top services; on-call with runbooks; postmortems |
| 3 | All tier-0 SLOs with budget policy; multi-window burn alerts; quarterly game days |
| 4 | Error budget as deploy gate; chaos-engineering as standard; auto-mitigation |

### Cost
| Level | Signals |
|---|---|
| 1 | Monthly invoice only |
| 2 | Per-team dashboard; reviewed monthly |
| 3 | Per-feature cost; budget alarms; Infracost in PRs |
| 4 | Rightsizing auto; cost as KPI; FinOps team active |

### Test health
| Level | Signals |
|---|---|
| 1 | Some tests; CI runs some |
| 2 | Coverage reported; unit/integration tests |
| 3 | Coverage gates; mutation-tested; flake budget |
| 4 | Chaos-tested; test pyramid auto-tuned; AI-generated regression tests |

### IaC
| Level | Signals |
|---|---|
| 1 | Manual cloud console; copy-paste terraform |
| 2 | State remote + locked; lint in CI |
| 3 | Policy as Code; modules published; scan gates |
| 4 | Drift auto-reconciled; cost-in-PR enforced; continuous ADR-style evolution |

### Documentation
| Level | Signals |
|---|---|
| 1 | Wiki docs; no owner; PNG diagrams |
| 2 | Docs-as-code; lint passes; broken-link check |
| 3 | Every doc owned + freshness signal; AI-ready structure |
| 4 | Retrieval-quality measured; "no results" trending down; AI-agent answers 90% from docs |

## Reference models

| Model | Use |
|---|---|
| CMMI v2.0 | Org-wide maturity 1-5 |
| COBIT 2019 | IT governance + audit |
| ISO 27001 | InfoSec controls |
| SOC 2 TSC | Trust + privacy controls |
| NIST CSF | Security functions (Identify / Protect / Detect / Respond / Recover) |
| OWASP SAMM | Software security maturity |
| ThoughtWorks Tech Radar | Tech adoption discipline |
| DORA report | Engineering performance benchmarking |
| SPACE | Developer productivity (multi-dim) |

---

# Reference — Compliance Frameworks (controls snapshot)

## SOC 2 (Trust Services Criteria)

| Criterion | Topic | Evidence |
|---|---|---|
| CC1 | Control environment | Code of conduct; security training; background checks |
| CC2 | Communication | Policies published; change advisory board minutes |
| CC3 | Risk assessment | Risk register; threat models; third-party reviews |
| CC4 | Monitoring | Internal controls tested; deviations logged |
| CC5 | Control activities | Policy enforcement; separation of duties; least privilege |
| CC6 | Logical + physical access | IAM config; MFA; encryption |
| CC7 | System operations | Change mgmt; capacity mgmt; backup + restore tested |
| CC8 | Change management | PR review; CI gates; rollback |
| CC9 | Risk mitigation | BCP/DR plan; vendor reviews |

## ISO 27001 (Annex A snapshot)

| Control | Topic |
|---|---|
| A.5 | Organizational policies + classification |
| A.6 | People controls + screening |
| A.7 | Physical + environmental |
| A.8 | Technological (access, crypto, operations, comms) |
| A.9 | Logical access (legacy, see A.8) |
| A.10 | Cryptographic controls |
| A.12 | Operations (change, capacity, backup) |
| A.13 | Communications security |
| A.14 | SDLC + secure coding |
| A.15 | Supplier relationships |
| A.16 | Incident management |
| A.17 | Business continuity |
| A.18 | Compliance |

## HIPAA (Security Rule)

| Safeguard | Topic |
|---|---|
| Administrative | Risk analysis; training; contingency; evaluation |
| Physical | Facility; workstation; device |
| Technical | Access control; audit; integrity; transmission |
| BAA | With each PHI processor |
| Breach | 60-day notification process |

## PCI DSS (12 requirements)

1. Install + maintain network security controls.
2. Apply secure configurations.
3. Protect stored account data.
4. Encrypt transmission of cardholder data.
5. Protect from malicious software.
6. Develop + maintain secure systems.
7. Restrict access by need-to-know.
8. Identify users + authenticate access.
9. Restrict physical access.
10. Log + monitor.
11. Test security systems.
12. Support information security policy.

## GDPR (key obligations)

- Lawful basis per processing.
- Records of processing activities (RoPA).
- Data subject rights (access / rectify / erase / portability / object).
- DPIA for high-risk.
- 72-hour breach notification.
- Cross-border transfer mechanisms.
- Data Protection Officer where required.

---

# Reference — Tooling

## Code + SAST

- **CodeQL** — GitHub-native; CI query pack.
- **SonarQube** — self-host or SaaS; rules by language.
- **Semgrep** — fast; rules-as-code; custom rules.

## Deps + supply chain

- **Snyk / Dependabot / Renovate** — CVE + update PR.
- **Socket / FOSSA** — supply-chain + license.
- **Sigstore / Cosign / in-toto** — provenance.

## Secrets

- **gitleaks / trufflehog** — repo + history scan.
- **GitGuardian** — SaaS, broader detection.

## Container

- **Trivy** — image + filesystem + IaC.
- **Snyk Container** — image + runtime.

## IaC

- **tfsec / Checkov / Trivy config** — static.
- **Prowler / ScoutSuite / Steampipe** — cloud posture.
- **Infracost** — cost-in-PR.

## Cloud posture

- **Prowler** (AWS / GCP / Azure) — CIS benchmarks.
- **ScoutSuite** — multi-cloud.
- **Steampipe** — Cloud SQL over APIs, controls-as-code.

## Performance

- **k6 / Locust / wrk / vegeta** — load testing.
- **Continuous Profiling** — Pyroscope / Datadog / Grafana Phlare / Polar Signals.

## Tests

- **Codecov / Coveralls** — coverage.
- **Stryker / PIT / mutmut** — mutation.
- **fast-jest / pytest-xdist** — speed.

## DORA + SPACE

- **LinearB / Sleuth / Swarmia / Allstacks / Jellyfish** — DORA metrics.
- **Faros AI** — multi-source engineering analytics.

## Observability

- **Datadog / Grafana / Honeycomb / New Relic / Lightstep** — APM + logs + metrics.

## Compliance automation

- **Vanta / Drata / Secureframe / Tugboat / Sprinto** — SOC 2 / ISO continuous control monitoring.
- **Hyperproof / A-LIGN** — GRC.

---

# Reference — DORA + SPACE Metrics

## DORA (4 metrics)

| Metric | Elite | High | Medium | Low |
|---|---|---|---|---|
| Lead time for change (median) | < 1h | 1h-1d | 1d-1w | > 1w |
| Deploy frequency | on-demand (multiple/day) | weekly+ | monthly+ | > monthly |
| Change failure rate | ≤ 5% | ≤ 10% | ≤ 15% | > 15% |
| MTTR (S1) | ≤ 1h | ≤ 1d | ≤ 1w | > 1w |

## SPACE (5 dimensions)

| Dimension | Sample measure |
|---|---|
| Satisfaction + well-being | Survey; eNPS |
| Performance | Outcomes (e.g., incidents / features) |
| Activity | PRs / commits / reviews (high false positive) |
| Communication + collaboration | Cross-team reviews; comments/PR |
| Efficiency + flow | Lead time; review depth; rework ratio |

SPACE is multi-dim — single metrics (e.g., PR count) mislead.

---

# Reference — Common Audit Findings

## P0 (blocks ship / customer harm)

- Service in prod without SLO + on-call + runbook.
- Database with no backups tested.
- Critical path feature with no test coverage.
- Hardcoded credentials in code or env.
- IAM role with `*:*` permissions on production.
- PII data in unencrypted storage.
- EOL runtime in prod.
- Critical CVE with no patch and exploitable in prod.
- Drift on data store (state vs reality).
- Audit log disabled on regulated surface.

## P1 (must-fix this quarter)

- Threat models missing on tier-0 services.
- Runbooks stale > 90 days.
- Coverage < 50% on critical path.
- Default VPC / default SG use.
- Long-lived feature branches > 7 days.
- Manual console changes daily.
- Cost overrun > 20% budget.
- Repeat-incident class > 3 / quarter.
- Key-person dependency (bus factor = 1) on tier-0.
- License non-compliance with vendor obligations.

## P2 (should-fix this quarter)

- Cyclomatic complexity > 20 in hot path.
- Test flake > 1%.
- Doc freshness drift.
- Untagged resources.
- Coverage < 80% on non-critical.
- Coupling regression vs last quarter.
- PR size > 800 LOC median.

## P3 (backlog)

- Cosmetic style violations.
- Doc improvements.
- Optimization without measured benefit.
- Refactors without functional signal.

---

# Reference — Pre-Acquisition Tech DD Checklist

## Engineering maturity
- [ ] Engineering headcount, tenure, level distribution.
- [ ] Hiring velocity + attrition.
- [ ] Performance review cadence.
- [ ] Org structure (BUs / tribes / squads).

## Code + architecture
- [ ] Coverage, complexity, duplication, dead code, repo structure.
- [ ] ADR coverage + quality.
- [ ] Module boundaries (cross-team refactor rate).
- [ ] Tech debt ratio estimate.

## Reliability
- [ ] 4 SRE metrics + trend.
- [ ] Incident history (24 months).
- [ ] SLO coverage.
- [ ] On-call depth + alert quality.
- [ ] Game-day cadence.

## Security
- [ ] Vulnerability posture (count by severity, trend).
- [ ] Last pen-test date + findings.
- [ ] Threat model coverage.
- [ ] Compliance attestation (SOC 2 / ISO / HIPAA).
- [ ] IAM least privilege + MFA + SSO.
- [ ] Secrets handling.
- [ ] PII / data classification.
- [ ] Incident history (security).

## Scale + performance
- [ ] Capacity headroom.
- [ ] Cost-to-serve per customer.
- [ ] Load test result (peak / projected).

## Cost
- [ ] Cloud spend + trend.
- [ ] License costs.
- [ ] Cost-to-serve trends.

## People risk
- [ ] Bus factor per major surface.
- [ ] Comp band fit.
- [ ] Retention offers needed.
- [ ] Cultural / process compatibility.

## Tech risk register
- [ ] EOL tech.
- [ ] Single points of failure.
- [ ] Vendor concentration.
- [ ] License audit risk.

## Recommendation
- [ ] Tech risk-adjusted valuation.
- [ ] Year-1 remediation cost.
- [ ] Year-2 platform investment.
- [ ] Synergies / migration cost.

---

# Reference — Audit Cycle Cadence

| Audit type | Cadence | Owner | Depth |
|---|---|---|---|
| Smoke health | Monthly | Eng leadership | 1 day |
| Standard scorecard | Quarterly | Eng leadership | 1 week |
| Annual + compliance-mapped | Yearly | Internal + external | 1 month |
| Pre-acquisition / pre-IPO | Per event | External consultant | 4-8 weeks |
| Per-release delivery review | Per release | Eng + SRE | 1 day |
| Compliance (SOC 2 Type II) | Continuous + yearly attestation | Compliance | Ongoing |
| Risk register review | Monthly | Eng leadership | 1 hour |
| Bus-factor / key-person | Quarterly | HR + Eng leadership | 2 hours |
| Cohort benchmark | Yearly | Eng leadership | 1 week |

---

# Reference — Anti-Patterns (to recognize and fix)

| Anti-pattern | Why bad | Fix |
|---|---|---|
| Audit = "reassurance report" | Doesn't change anything | Findings → tickets; closure tracked |
| Audit graded on opinion | Bias, indefensible | Rubric + evidence per grade |
| Single data point | Lies (e.g., coverage this Q only) | Trend + cohort |
| Tool considered "maturity" | Tool ≠ use | Enforcement in CI is the rubric |
| Audit by self for compliance | Conflict of interest | External calibration |
| Same rubric for small + large | Misleading | Normalize per-cohort |
| Findings without owners | Nobody acts | Mandatory owner + due |
| Scorecard flatlined | Either perfect or apathetic | Audit robs itself of signal |
| Audit only quarterly | Stale too long | Smoke monthly + standard quarterly + annual deep |
| Bus factor ignored | One departure = incident | Always include in scorecard |
| Scorecard optimized | Incentives gaming | Trend + multi-domain + cohort + calibration |
| "Maturity 4" with P0 open | Score lying | P0 forces < Level 4 |
| Audit findings closed in bulk without test | False sense of safety | Verification required |
| Audit "we passed!" | Audit isn't pass/fail | Audit is thermometer + roadmap |
