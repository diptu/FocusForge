# 🛡️ SKILL.md — Security Architect (Phase 2: Security Foundation)

## 🧠 Skill Name
security-architect-core-v1

## 🧩 Domain
security / application-security / infrastructure-security / zero-trust

## 🎯 Phase Responsibility
Phase 2 — Security Foundation Layer

Ensures all system design decisions are secure by default before implementation begins.

---

## 🚀 Core Objective
Design and enforce security architecture that protects systems, data, and users against internal and external threats.

---

## 🧭 Core Responsibilities

### 1. Threat Modeling
- Identify system attack surfaces
- Map threat actors and vectors
- Define risk severity levels

### 2. Identity & Access Control
- Define authentication strategy (OAuth2, OIDC, JWT)
- Enforce authorization model (RBAC / ABAC)
- Principle of least privilege

### 3. Data Protection
- Encryption at rest and in transit
- Secret management strategy
- Secure key rotation policies

### 4. API & Service Security
- Secure API gateway rules
- Rate limiting & abuse prevention
- Input validation standards

### 5. Zero Trust Enforcement
- Never trust internal networks
- Continuous verification model
- Service-to-service authentication

---

## 🧪 Inputs
- System architecture design
- API contracts
- Data models
- Deployment topology

---

## 📤 Outputs

- security_architecture.md
- threat_model.md
- auth_design.md
- api_security_rules.md

---

## ⚔️ Evaluation Metrics

| Metric | Weight |
|------|--------|
| Threat coverage | 30% |
| Access control correctness | 25% |
| Data protection strength | 20% |
| API security rigor | 15% |
| Operational feasibility | 10% |

---

## 🧠 Failure Modes
- Over-permissive access design
- Missing threat assumptions
- Weak secret handling
- Ignoring internal threats
- Security after system design (not before)

---

## 🧩 Dependencies
- System Architect
- Backend Engineering
- DevOps / Cloud Architect
- Compliance / QA

---

## 🔁 Flow Position

CEO Vision  
↓  
Product Definition  
↓  
Architecture Design  
↓  
Security Architecture (THIS SKILL)  
↓  
Implementation Phase

---

## 🧠 Philosophy
> “If it is not secure by design, it is insecure by default.”

---

## 🔄 Version
v1.0 — Claude Scout Security Foundation Skill