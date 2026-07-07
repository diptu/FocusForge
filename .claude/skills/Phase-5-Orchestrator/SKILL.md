# ⚙️ SKILL.md — Phase 5 Orchestrator

## 🧠 Skill Name
phase-5-orchestrator-core-v1

## 🧩 Domain
platform / infrastructure / orchestration / delivery

## 🎯 Phase Responsibility
Phase 5 — Infrastructure, Security Foundation & Execution Orchestration Gate

---

## 🚀 Core Objective
To convert designed systems into **deployable, secure, and observable execution environments** by coordinating Cloud, DevOps, and Security layers into a single controlled delivery pipeline.

---

## 🧭 Primary Responsibilities

### 1. Execution Orchestration
- Sequence infrastructure + security + deployment tasks
- Ensure dependency order correctness (infra → security → CI/CD → deploy)
- Coordinate cross-team execution readiness

---

### 2. Environment Readiness Validation
- Verify cloud resources provisioned
- Validate CI/CD pipelines functional
- Confirm containerization and runtime compatibility

---

### 3. Security Gate Enforcement
- Ensure authN/authZ models are implemented
- Validate secrets management setup
- Enforce baseline security compliance (OWASP-aligned)

---

### 4. Deployment Coordination
- Align staging → production rollout strategy
- Define rollback mechanisms
- Validate release readiness checklist

---

### 5. Observability Bootstrapping
- Ensure logging, metrics, tracing are active
- Validate monitoring dashboards
- Confirm alerting rules configured

---

## 📥 Inputs
- Architecture Design (Phase 2)
- Data Models (Phase 3)
- Infrastructure Plan (Phase 4)
- Security Design (Phase 5 Security)

---

## 📤 Outputs
- deployment_readiness_report.md
- infrastructure_validation_report.md
- security_gate_report.md
- release_plan.md

---

## 🧠 Decision Principles
- No deployment without observability
- No production without security baseline
- No scaling without validated CI/CD
- Fail fast, rollback faster

---

## ⚔️ Evaluation Metrics

| Metric | Weight |
|------|--------|
| Deployment correctness | 30% |
| Security compliance | 25% |
| System readiness validation | 20% |
| Observability coverage | 15% |
| Execution reliability | 10% |

---

## 🧩 Dependencies
- Cloud Architect
- DevOps Engineer
- Security Architect
- SRE / Monitoring Systems

---

## 🔁 Flow Position

Architecture → Infra Setup → Security Setup → **Phase 5 Orchestration** → Backend/Frontend Execution

---

## 🏆 Success Criteria
- System is deployable without ambiguity
- Security baseline enforced before release
- CI/CD pipeline fully operational
- Observability enabled before traffic

---

## 🧠 Philosophy
> “If it cannot be safely deployed, it is not complete.”