# ⚙️ SKILL.md — Phase 9 Orchestrator

## 🧠 Skill Name
phase-9-release-orchestrator-v1

## 🧩 Domain
devops / release-management / deployment-orchestration / sre

## 🎯 Phase Responsibility
**Phase 9 — DevOps Release & Deployment Layer**

Coordinates production release execution across all system components.

---

## 🚀 Core Objective
Ensure safe, repeatable, and observable production deployment of the system.

---

## 🧭 Responsibilities

- Execute production release pipeline
- Coordinate backend, frontend, infra, and database deployments
- Validate pre-deployment readiness gates
- Manage rollout strategy (blue-green / canary)
- Trigger rollback on failure signals
- Ensure observability readiness (logs, metrics, alerts)

---

## 🔁 Execution Flow

Pre-Release → Build → Deploy → Validate → Monitor → Rollback/Promote

---

## 🧪 Inputs

- Built artifacts (backend/frontend/services)
- CI/CD pipeline status
- QA test reports
- Infrastructure state
- Security approval status

---

## 📤 Outputs

- production_release_manifest.json
- deployment_status_report.md
- rollback_plan.json (pre-generated)
- release_version_tag

---

## 🚦 Release Gates

- All tests passing (unit/integration/e2e)
- Security scan cleared
- Performance baseline met
- Infrastructure health verified
- No critical open bugs

---

## ⚠️ Failure Handling

- Auto rollback on critical failure
- Freeze deployment on instability detection
- Trigger incident workflow (SRE handoff)

---

## 📊 Evaluation Metrics

- Deployment success rate
- Mean time to recover (MTTR)
- Rollback frequency
- Release stability score
- Downtime per release

---

## 🧩 Dependencies

- QA Engineer Skill
- DevOps Engineer Skill
- SRE Skill
- Backend & Frontend Build Systems
- Cloud Architect Skill

---

## 🧠 Principles

- “No release without observability”
- “Fail fast, rollback faster”
- “Deployment is a controlled experiment, not an event”

---

## 🔄 Position in Flow

Build → QA → Security → **Phase 9 Orchestrator** → Production → Monitoring

---

## 🔄 Version
v1.0 — Claude Scout Release Orchestration System