# API service — Aggregates (Epic 1)

**Version:** 1.0 · **Date:** 2026-07-07
**Related:** [`pm/prd_mvp.md`](../../../pm/prd_mvp.md) Epic 1 · [`pm/user_stories.md`](../../../pm/user_stories.md) FF-1/FF-2/FF-3 · [`apps/api/prisma/schema.prisma`](../../../apps/api/prisma/schema.prisma)

Scaled to the project: one backend, one developer, no distributed transactions. The DDD ceremony below is applied where it actually removes a bug class (see sa-adr-001), not decoratively.

## StudySession (aggregate root)
**Consistency boundary = transactional boundary = repository boundary:** one `StudySession` row, no child entities inside the aggregate.

- **Invariants** (enforced at the application layer before write — see `persistence_patterns.md`):
  - `durationMinutes > 0`
  - `occurredAt` is not in the future (sessions log the past; future intent is `PlannedTarget`'s job, a separate aggregate)
- **External references, by ID only:** `subSkillId`. Skill is reached transitively via `subSkill.skill` — StudySession does **not** hold its own `skillId`. See `sa-adr-001` for why.
- **No lifecycle / no state machine:** create, edit, delete — that's the entire lifecycle. No status field exists, so there's nothing for a state machine to model. Adding one would violate the SA hard rule against inventing lifecycle where none exists.
- **Domain events:** none for MVP. Nothing downstream (yet) needs to react asynchronously to a session being logged — Epic 3/4 read directly via query, not via event subscription. Revisit only if Phase 4/5 (weakness detection, reports) turns out to need eventing rather than a scheduled read.

## PlannedTarget (aggregate root)
Separate from `StudySession` — you can set a plan with zero sessions logged, and log sessions against a week with no plan set. No shared consistency requirement between the two beyond both ultimately being read together at query time (Epic 4's adherence %), which is an application-layer join, not an aggregate-spanning transaction.

- **Invariants:**
  - `targetMinutes > 0`
  - Exactly one target per `(skillId, weekStartDate)` — enforced by DB unique constraint, not just application logic, because "set the target again" (FF-16) must upsert, never duplicate.
  - `weekStartDate` is always normalized to the Monday of its week before write — an application-layer normalization step, not a DB constraint (Postgres can't validate "this DATE is a Monday" without an actual CHECK; not worth the ceremony for a rule the application already guarantees at the single call site that writes this field).
- **External references, by ID only:** `skillId` — scoped at the skill level, not sub-skill, matching FF-16 exactly ("target for a skill this week").
- **No lifecycle / no state machine**, same reasoning as `StudySession`.

## Skill / SubSkill (reference data, not aggregates)
Seeded, near-static (see `apps/api/prisma/seed.ts`), no invariants beyond uniqueness (`Skill.slug`, `(SubSkill.skillId, SubSkill.slug)`) and no behavior. Modeling these as aggregates would be the "anemic ceremony for its own sake" the SA hard rules warn against — they're correctly plain reference tables here, not DDD entities with behavior.

## What's deliberately not designed yet
Weakness detection and weekly reports (Phase 4/5) aren't modeled — no `WeaknessFlag` or `Report` entity exists. Per `pm/mvp_definition.md`'s cut line, building their schema now would be guessing ahead of real session data. Revisit with `/sa aggregate` once Phase 4 starts.
