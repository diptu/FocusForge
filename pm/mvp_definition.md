# FocusForge — MVP Definition

**Version:** 1.0 · **Date:** 2026-07-07 · **Owner:** dip (PM/CTO/Eng — solo)
**Phase:** 1 — Vision → MVP Definition (exit artifact)
**Related:** [`pm/product_vision.md`](product_vision.md) · [`pm/roadmap.md`](roadmap.md) · [`cto/tech_vision.md`](../cto/tech_vision.md)

This is the freeze line for v1: everything below "Scope IN" ships before FocusForge is called an MVP; everything in "Explicitly cut" does not, regardless of how tempting it is mid-build. Maps 1:1 to `pm/roadmap.md` Phases 0–3, all tagged `[MVP-CORE]` there.

## Scope IN
1. **Foundation** — skill taxonomy (Quant / IELTS / JS / Stats / Deep Learning + sub-skills), `StudySession` schema, single-user auth (static token/local session, no external provider).
2. **Daily Study Logger** — log a session (skill, subskill, duration, notes) and see history.
3. **Skill-wise analytics dashboard** — time-per-skill/sub-skill, rolling week/month trend.
4. **Planned vs actual tracking** — set a weekly target per skill, see adherence % against logged actuals.

That's the whole MVP. No weakness detection, no reports — the loop stays open at "you can see the numbers," and closes in Phase 4–5, deliberately after the MVP, once there's real logged data to detect weakness *from*.

## Explicitly cut (not MVP — do not pull forward)
- **Weakness detection engine** (rule-based or otherwise) — `pm/roadmap.md` Phase 4. Needs weeks of real session data to mean anything; building it against no data is guessing.
- **Weekly intelligence reports** — Phase 5. Depends on weakness detection existing first.
- **Anything in Phase 6** — scoring models, forecasting, quiz integration. Unscoped, revisit after MVP is in daily use.
- **Every non-goal in `cto/tech_vision.md`** — multi-user, content platform, mobile-native, microservices, real-time sync. Not deferred, not planned — out.

If mid-build a "quick weakness flag" or "just email me the report" urge shows up: that's scope creep on Phase 4/5 work, not a small addition to Phase 1–3. Note it, don't build it.

## MVP exit criteria (all must hold to call this frozen and shipped)
- A study session can be logged end-to-end — UI → API → Postgres — in **under 15 seconds**, matching the logging-friction bet in `cto/tech_vision.md`.
- The dashboard shows time-per-skill/sub-skill for at least a rolling week and a rolling month, computed from real logged sessions (not seed/mock data).
- A weekly plan can be set per skill, and adherence % is computed and displayed against actual logged time.
- All schema changes went through Prisma migrations — zero hand-edited schema, zero drift.
- `pnpm lint` and `pnpm exec tsc --noEmit` are clean on the frontend; equivalent checks clean on the NestJS backend once it exists.
- Used for **two consecutive real weeks** by the actual target user (dip) before being called "done" — this is a solo product with a sample size of one, so the only validation that matters is real use, not a demo.

## Why this cut line
Phases 0–3 are pure infrastructure for seeing the truth (what did I study, how much, against what plan). Phases 4–5 are infrastructure for *acting* on the truth. Shipping the first without the second is still a complete, useful product — a better spreadsheet, honestly. Shipping the second without the first is impossible; there's nothing to detect weakness in. The cut line follows that hard dependency, not a feature-importance guess.

## Revision log
- 2026-07-07 — v1.0 initial MVP definition, written pre-code beyond the `apps/web` token/scaffold layer.
