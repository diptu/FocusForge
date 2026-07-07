# FocusForge — MVP User Stories

**Version:** 1.0 · **Date:** 2026-07-07 · **Owner:** dip (PM/CTO/Eng — solo)
**Related:** [`pm/prd_mvp.md`](prd_mvp.md) (epics + summary, not repeated here)

Backlog-ready decomposition of `pm/prd_mvp.md`'s four epics. Each story: ID, statement, Given/When/Then acceptance criteria, size (S/M/L — rough effort, not a sprint commitment for a backlog of one), dependencies. Ready for `/pm sprint-plan`.

---

## Epic 1 — Foundation
Enabler stories — no end-user-facing "so that," the "so that" is "so the rest of the backlog is buildable."

### FF-1 — Define Skill & SubSkill schema
As the builder, I want `Skill` and `SubSkill` as related Prisma models seeded with the five domains and their sub-skills, so no feature ever stores a skill as free text.
- **Given** an empty database, **when** `prisma migrate dev` + seed run, **then** all 5 skills exist with ≥1 sub-skill each, queryable by skill.
- **Size:** S. **Depends on:** the sub-skill taxonomy list itself (flagged open in `pm/prd_mvp.md`) — blocked until that's provided.

### FF-2 — Define StudySession schema
As the builder, I want a `StudySession` model (`skillId`, `subSkillId`, `durationMinutes`, `occurredAt`, `notes`, `createdAt`), so every later feature reads one consistent shape.
- **Given** the schema is migrated, **when** a session is inserted with a past `occurredAt`, **then** reading it back returns the same date, unaffected by timezone shifts.
- **Size:** S. **Depends on:** FF-1.

### FF-3 — Define PlannedTarget schema
As the builder, I want a `PlannedTarget` model (`skillId`, `weekStartDate`, `targetMinutes`), so Epic 4 doesn't require a second migration round later.
- **Given** the schema is migrated, **when** a target is set for a skill/week, **then** at most one target exists per (skill, week) — upsert, not duplicate rows.
- **Size:** S. **Depends on:** FF-1.

### FF-4 — Single-user auth
As the builder, I want a static-token session (no signup, no password reset, no OAuth), so auth doesn't consume MVP time it isn't scoped for.
- **Given** a request without the token, **when** it hits any API route, **then** it's rejected; **given** a request with the correct token, **then** it succeeds.
- **Size:** S. **Depends on:** nothing (parallel to FF-1–3).

### FF-5 — Migration pipeline
As the builder, I want every schema change to go through `prisma migrate dev`, so there's never hand-edited schema drift.
- **Given** a fresh clone, **when** `prisma migrate deploy` runs, **then** the schema matches production with no manual SQL steps.
- **Size:** S. **Depends on:** FF-1–3.

---

## Epic 2 — Daily Study Logger

### FF-6 — Log a study session
As the learner, I want to log a session (skill, sub-skill, duration, optional notes) in one short flow, so logging doesn't feel like a chore.
- **Given** the logger form, **when** I select a skill, sub-skill, duration, and submit, **then** a `StudySession` is created and I see a confirmation within the same view (no full page reload).
- **Given** a returning user who knows the flow, **when** they time themselves start-to-confirmed-saved, **then** it's under 15 seconds — this is the PRD's hard exit criterion, test it with a stopwatch, not a guess.
- **Size:** M. **Depends on:** FF-1, FF-2, FF-4.

### FF-7 — Backdate a session
As the learner, I want to log a session against an earlier date, so I can catch up on a day I forgot.
- **Given** the logger form, **when** I pick a date before today, **then** the session saves with that `occurredAt`, not today's date.
- **Size:** S. **Depends on:** FF-6.

### FF-8 — View session history
As the learner, I want to see past sessions newest-first, so I can review what I've actually logged.
- **Given** ≥1 logged session, **when** I open the history view, **then** sessions are listed newest-first with skill, sub-skill, duration, date visible per row.
- **Size:** S. **Depends on:** FF-6.

### FF-9 — Edit a logged session
As the learner, I want to correct a mis-logged session, so a typo doesn't permanently skew my analytics.
- **Given** an existing session, **when** I edit any field and save, **then** the change is reflected immediately in history without a full reload.
- **Size:** S. **Depends on:** FF-8.

### FF-10 — Delete a logged session
As the learner, I want to remove a session I logged by mistake, so it doesn't count toward analytics or adherence.
- **Given** an existing session, **when** I delete it, **then** it's gone from history and excluded from every downstream aggregate (Epic 3, 4) on next view.
- **Size:** S. **Depends on:** FF-8.

### FF-11 — Empty state
As a first-time user, I want the history view to explain what to do when there are no sessions yet, so I'm not staring at a blank list.
- **Given** zero logged sessions, **when** I open history, **then** I see guidance pointing at the logger, not an empty table.
- **Size:** S. **Depends on:** FF-8.

---

## Epic 3 — Skill-wise Analytics Dashboard

### FF-12 — Time-per-skill, current week
As the learner, I want total logged time per skill for the current week, so I know where my time went without manually tallying.
- **Given** sessions logged this week, **when** I open the dashboard, **then** each of the 5 skills shows summed minutes for the current week, computed from real `StudySession` rows.
- **Size:** M. **Depends on:** FF-2, FF-6.

### FF-13 — Time-per-skill, current month
As the learner, I want the same view rolled up to the current month, so I can see the bigger pattern, not just this week's noise.
- **Given** sessions logged this month, **when** I switch the dashboard to month view, **then** totals update without a full page reload.
- **Size:** S. **Depends on:** FF-12.

### FF-14 — Week-over-week comparison
As the learner, I want to compare this week's per-skill time to last week's, so I can tell if a domain is gaining or losing attention.
- **Given** sessions logged in both weeks, **when** I view the comparison, **then** each skill shows both weeks' totals side by side (or delta), not just the current one.
- **Size:** M. **Depends on:** FF-12.

### FF-15 — Domain color coding
As the learner, I want each skill visually distinguishable on the dashboard, so I can scan it at a glance.
- **Given** the dashboard renders, **when** skills are displayed, **then** each uses its assigned token (`bg-domain-quant`, `-ielts`, `-js`, `-stats`, `-dl` from `apps/web/src/styles/tokens.css`) and no ad-hoc color.
- **Size:** S. **Depends on:** FF-12 (already unblocked by the existing token layer).

---

## Epic 4 — Planned vs Actual Tracking

### FF-16 — Set weekly target per skill
As the learner, I want to set a target number of minutes per skill for the week, so I have something concrete to hold myself to.
- **Given** the planning view, **when** I set a target for a skill this week, **then** a `PlannedTarget` is upserted (setting twice updates, doesn't duplicate).
- **Size:** S. **Depends on:** FF-3.

### FF-17 — View adherence %
As the learner, I want to see actual-vs-planned as a percentage per skill, updated as I log, so I know mid-week if I'm on track.
- **Given** a target and logged sessions for the week, **when** I view the dashboard, **then** adherence % = actual minutes ÷ target minutes, recomputed live, no manual refresh/recompute step.
- **Size:** M. **Depends on:** FF-16, FF-12.

### FF-18 — Adherence trend across weeks
As the learner, I want to see adherence over the last several completed weeks, not just this week, so I can tell if the trend is improving — this is what the product's North Star metric is actually computed from.
- **Given** ≥2 completed weeks with targets and sessions, **when** I view the trend, **then** each week's adherence % is shown in sequence.
- **Size:** M. **Depends on:** FF-17.

---

## Backlog summary
18 stories, all `[MVP-CORE]`. Suggested build order: FF-1→FF-5 (Foundation) → FF-6→FF-11 (Logger) → FF-12→FF-15 (Dashboard) → FF-16→FF-18 (Planned vs Actual) — this is a strict dependency chain, not a priority call; nothing in Epic 3 or 4 is buildable before Epic 2 produces real session data to read.

## Revision log
- 2026-07-07 — v1.0 initial backlog decomposition of `pm/prd_mvp.md`.
