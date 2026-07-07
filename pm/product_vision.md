# FocusForge — Product Vision

**Version:** 1.0 · **Date:** 2026-07-07 · **Owner:** dip (PM/CTO/Eng — solo)
**Phase:** 1 — Vision → MVP Definition
**Related:** [`cto/tech_vision.md`](../cto/tech_vision.md) (technical bets/non-goals) · [`pm/roadmap.md`](roadmap.md) (sequencing)

## Problem statement
Studying five domains at once (Quant, IELTS, JS, Stats, Deep Learning) generates a lot of ad-hoc signal — notes, gut feel about what's going badly, a rough sense of how much time went where — but none of it is captured anywhere durable. There's no single place that says, plainly, "here's what you actually did this week, here's what's slipping, here's what to fix." Effort and outcome stay disconnected, so weak spots get noticed late, usually right before they matter (an exam, an interview).

## Who this is for
One user: a self-directed learner running structured, simultaneous study across multiple unrelated domains, who wants to trust a number instead of a gut feeling about where they stand. Not designed for a team, a classroom, or a general audience — every scope call in this doc optimizes for that one user's actual daily habit, not a hypothetical broader market.

## Value proposition
**"See where your study time actually goes, and get told what's slipping before you would've noticed yourself."**

The differentiator is not the logging — a notes app or spreadsheet already does that adequately. It's closing the loop: turning a week of logged sessions into a specific, trusted "here's what to drill next" signal, per the flywheel bet in `cto/tech_vision.md` (§ weekly report is the actual product).

## North Star metric
**Weekly plan adherence, trending up over consecutive weeks.** This is the one number that proves the system is changing behavior, not just archiving it. Every other metric (logging friction, report engagement, weakness-detection accuracy) is a leading indicator that feeds this one.

## Non-goals
Inherited directly from `cto/tech_vision.md` — not re-litigated per phase:
- Not a multi-tenant SaaS (no accounts-for-others, no billing)
- Not a content platform / LMS
- Not mobile-native
- Not microservices
- Not real-time/collaborative

If any of these become real asks later, that's a new vision revision, not a scope addition to an existing phase.

## Revision log
- 2026-07-07 — v1.0 initial product vision (Phase 1 kickoff, pre-code beyond `apps/web` token scaffold).
