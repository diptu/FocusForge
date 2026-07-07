# FocusForge — PRD: MVP

**Version:** 1.0 · **Date:** 2026-07-07 · **Owner:** dip (PM/CTO/Eng — solo)
**Status:** Draft, not yet frozen
**Related:** [`pm/product_vision.md`](product_vision.md) · [`pm/mvp_definition.md`](mvp_definition.md) · [`pm/roadmap.md`](roadmap.md) · [`cto/tech_vision.md`](../cto/tech_vision.md)

This PRD covers the four MVP-CORE epics as one unit, not four separate PRDs — they're sequential and interdependent (each depends on data the previous one produces), and splitting them would just duplicate the same schema and scope discussion four times. Vision, non-goals, and the cut list are **not** repeated here — see the linked docs.

## Summary
Build the closed loop's first half — the half that lets you see the truth about your study habits — for one user, across five domains (Quant, IELTS, JS, Stats, Deep Learning): log a session, see where the time went, see if you did what you planned.

## Users
One: dip, self-directed learner, primary usage pattern is a short logging touchpoint after each study session plus a weekly review sitting with the dashboard.

## Epics

### Epic 1 — Foundation (schema + auth)
Not user-facing; every other epic depends on this data model being right (per `cto/tech_vision.md` bet #1).

**Requirements**
- `Skill` entity: fixed taxonomy (Quant, IELTS, JS, Stats, Deep Learning) with sub-skills as a related entity, not free text — e.g. Quant → {Arithmetic, Algebra, Data Sufficiency, ...}. Sub-skill list per domain is configurable via seed data, not hardcoded in UI.
- `StudySession` entity: `skillId`, `subSkillId`, `durationMinutes`, `occurredAt` (date, not just created-at — backdating a forgotten log entry must be possible), `notes` (optional text), `createdAt`.
- `PlannedTarget` entity (needed by Epic 4, defined now so Epic 1 doesn't need a second migration round): `skillId`, `weekStartDate`, `targetMinutes`.
- Auth: single static-token session, no signup flow, no password reset, no third-party OAuth. This is a MVP-CORE non-negotiable simplification, not a shortcut to fix later — re-litigating auth is explicitly out of scope per `cto/tech_vision.md` non-goals (not multi-tenant).
- All schema changes via Prisma migrations from the first commit — no hand-edited schema, ever (MVP exit criterion).

**Acceptance criteria**
- A `StudySession` row can be created, read, updated, and deleted via the API, and reads back exactly what was written (round-trip correctness, esp. for `occurredAt`/timezone handling).
- Sub-skills are seeded per domain and retrievable per skill, not hardcoded in frontend code.
- `prisma migrate dev` runs clean from an empty database.

### Epic 2 — Daily Study Logger
The habit-forming surface. If this is slow or annoying, the whole loop starves (per North Star dependency in `pm/product_vision.md`).

**User stories**
- As the learner, I want to log a session (skill, sub-skill, duration, optional notes) in one short flow, so logging doesn't feel like a chore.
- As the learner, I want to backdate a session to an earlier date, so I can catch up on a day I forgot to log.
- As the learner, I want to see, edit, and delete past sessions, so a mis-logged entry doesn't corrupt my analytics permanently.

**Acceptance criteria**
- Logging a session end-to-end (open form → submit → confirmed saved) takes **under 15 seconds** for a returning user who already knows the flow — this is a hard MVP exit criterion, not an aspiration.
- Form defaults to "today" for date but allows picking any past date.
- History view lists sessions newest-first, each editable and deletable inline, no full-page reload required per edit.
- Empty state (no sessions logged yet) explains what to do next, rather than showing a blank list.

### Epic 3 — Skill-wise Analytics Dashboard
Turns raw sessions into a "what did I actually do" answer.

**User stories**
- As the learner, I want to see total time per skill (and per sub-skill) for the current week and current month, so I know where my time actually went without manually tallying.
- As the learner, I want to compare this week to last week per skill, so I can tell if a domain is getting more or less attention over time.

**Acceptance criteria**
- Dashboard aggregates are computed from real `StudySession` rows (never mock/seed data in the production path).
- Rolling week and rolling month views both available; switching between them doesn't require a full reload.
- Each of the five skill domains is visually distinguishable using the domain accent tokens already defined in `apps/web/src/styles/tokens.css` (`bg-domain-quant`, `-ielts`, `-js`, `-stats`, `-dl`) — no ad-hoc chart colors introduced outside that token set.
- Dashboard load is a real page, not a stub: reflects actual logged data the moment a new session is saved (no manual refresh-and-wait needed beyond a normal page nav).

### Epic 4 — Planned vs Actual Tracking
Closes the "did I do what I said I'd do" half of the loop — the last MVP piece, and the one the North Star metric (`pm/product_vision.md`) is actually computed from.

**User stories**
- As the learner, I want to set a target number of minutes per skill for the current week, so I have something concrete to hold myself to.
- As the learner, I want to see my adherence percentage (actual ÷ planned) per skill, updated as I log sessions, so I know mid-week whether I'm on track, not just after the week is over.

**Acceptance criteria**
- A weekly plan can be set per skill before or during the week (setting it late doesn't block adherence from being computed against whatever was set).
- Adherence % is computed correctly against real logged sessions and updates without a manual recompute step.
- Adherence trend is visible across at least the last few completed weeks, not just the current one — the North Star metric is explicitly about the *trend*, not a single week's number.

## Non-functional requirements
- **Performance:** logging friction is a hard product requirement (Epic 2), not just a nice metric — treat it as a bug if violated.
- **Data integrity:** zero schema drift; all four epics share one Prisma schema evolved via migrations only.
- **Quality gate:** `pnpm lint` and `tsc --noEmit` clean on the frontend (already true for the current `apps/web` scaffold); equivalent lint/typecheck discipline required on the NestJS backend once it exists.
- **Accessibility:** dashboard charts and status colors must remain distinguishable without relying on color alone (WCAG baseline carried over from `.claude/skills/ui-ux-engineers` standards) — deferred to an explicit `/ui a11y` pass once Epic 3's dashboard is built, not assumed by default.

## Out of scope
See `pm/mvp_definition.md` § Explicitly cut — weakness detection, weekly reports, and every non-goal in `cto/tech_vision.md`. Not repeated here; if a requirement above starts implying any of those, that's scope creep on this PRD, not a detail to add.

## Success metrics
See `pm/product_vision.md` (North Star) and `pm/mvp_definition.md` (MVP exit criteria) — this PRD exists to satisfy those, not to define new ones.

## Open questions
- Backdating sessions (Epic 2) raises a question for Epic 4: does an adherence % recompute retroactively if a session is backdated into a prior week? Default assumption: yes, adherence is always computed live from whatever sessions exist for that week, not cached at week-close. Flag if that assumption turns out wrong once built.
- Sub-skill taxonomy per domain (Epic 1) is seed data dip needs to actually define before Epic 1 can be built — not yet enumerated in this PRD. Blocking item for implementation start.

## Revision log
- 2026-07-07 — v1.0 initial MVP PRD.
