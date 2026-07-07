# FocusForge — Product Roadmap

**Version:** 1.0 · **Date:** 2026-07-07 · **Owner:** dip (solo founder/PM/dev)
**Aligned to:** [`cto/tech_vision.md`](../cto/tech_vision.md)

## Context
Solo project, one user, no code yet (repo currently has only README + LICENSE). The roadmap below sequences FocusForge from an empty repo to the closed loop described in the tech vision: **log → analyze → detect weakness → replan → re-measure**. Phases are ordered by dependency, not calendar quarters — each phase is a working, usable increment, not a sprint of tickets.

Tags: **[MVP-CORE]** — needed before this is usable day-to-day · **[POST-MVP]** — the actual differentiator, build once logging habit is proven · **[FUTURE]** — explicitly deferred, not scoped yet.

---

## Phase 0 — Foundation `[MVP-CORE]`
**Goal:** a running skeleton with the data model that everything else depends on.
- Repo scaffold: Next.js + TS + Tailwind (frontend), NestJS + TS (backend), Prisma + Postgres (data).
- Core schema: `Skill` taxonomy (Quant, IELTS, JS, Stats, Deep Learning + sub-skills) and `StudySession` (skill, subskill, duration, date, notes, planned-vs-actual flag).
- Single-user auth — simplest thing that works (static token / local session). No multi-user, no OAuth provider.
- **Outcome:** a session can be created via API and read back from Postgres.
- **Why first:** this is the "get it right early" bet from the tech vision — every later feature reads this schema.

## Phase 1 — Daily Study Logger `[MVP-CORE]`
**Goal:** replace whatever you're using today (notes app / spreadsheet) to log study sessions.
- UI: log a session (skill, subskill, duration, notes) in one flow.
- History view: list of past sessions, editable/deletable.
- **Outcome metric:** time to log one session < 15s (from tech_vision). If this isn't true, nothing downstream gets fed real data — this is the gate for every later phase.

## Phase 2 — Skill-wise Analytics Dashboard `[MVP-CORE]`
**Goal:** see where time actually went, per skill, per week/month.
- Aggregate time-per-skill/sub-skill over rolling windows.
- Basic trend charts (this week vs last week, per domain).
- **Outcome:** at a glance, answer "what did I study this week, and how much?" without manual tallying.

## Phase 3 — Planned vs Actual Tracking `[MVP-CORE]`
**Goal:** close the first half of the loop — did you do what you said you'd do?
- Set a plan (target time/sessions per skill for the week).
- Compare plan vs logged actuals; surface an adherence %.
- **Outcome metric:** adherence % visible and trending over time (tech_vision success metric).
- **MVP line:** Phases 0–3 are the MVP. At this point FocusForge is a fully usable logger + planner, even with no intelligence yet.

---

## Phase 4 — Weakness Detection Engine `[POST-MVP]`
**Goal:** start being smarter than a spreadsheet.
- v1: rule-based heuristics (e.g., low session count + low adherence + self-rated confidence trending down → flag skill as weak). No ML yet — a scoring model is a `[FUTURE]` bet, not a `[POST-MVP]` one.
- Surface flags in the dashboard.
- **Outcome metric:** flagged weak skills match what you already suspect are weak (self-validated weekly, per tech_vision).

## Phase 5 — Weekly Intelligence Reports `[POST-MVP]`
**Goal:** the actual product — the loop closes here.
- Automated weekly summary: analytics + weakness flags + adherence trend + a suggested focus for next week.
- Delivery: in-app first; email/notification is a nice-to-have, not required for v1.
- **Outcome metric:** report is opened and acted on weekly — i.e., it changes what you study, not just what you read.

---

## Phase 6 — Compounding Bets `[FUTURE]`, unscoped
Deferred until Phases 0–5 are proven and used for a few weeks:
- Smarter weakness scoring (lightweight model instead of rules).
- Historical forecasting ("at this rate, IELTS readiness by date X").
- Self-test/quiz integration to get a ground-truth signal instead of only self-rated confidence.

## Explicitly out of scope (mirrors `cto/tech_vision.md`)
Not on this roadmap at any phase: multi-user/SaaS accounts, billing, content hosting/LMS features, native mobile apps, microservices, real-time sync. If any of these become real asks later, that's a new vision + roadmap decision, not a scope-creep addition to an existing phase.

## Prioritization rationale
Phases 0–3 are ordered strictly by dependency (schema → logging → viewing → planning) — none of them are debatable. Phases 4–5 are ordered by "cheapest smart thing first": rules before models, in-app before notifications. This keeps every phase shippable and usable on its own, so the project is never mid-rewrite with nothing working.

## Revision log
- 2026-07-07 — v1.0 initial roadmap, written pre-code.
