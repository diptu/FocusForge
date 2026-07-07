# API service — Persistence patterns (Epic 1)

**Version:** 1.0 · **Date:** 2026-07-07
**Related:** [`apps/api/prisma/schema.prisma`](../../../apps/api/prisma/schema.prisma) · [`aggregates.md`](aggregates.md)

## Repository shape
One Prisma model per aggregate root (`StudySession`, `PlannedTarget`), matching the "repository per aggregate root" rule — no repository is needed for `Skill`/`SubSkill` beyond simple reads, since they're reference data with no invariants to protect. For a solo NestJS backend this likely means one `StudySessionRepository`-equivalent service wrapping `prisma.studySession`, not a full repository-interface abstraction layer — that indirection buys nothing with one implementation and one consumer, and would be over-engineering per `cto/tech_vision.md`'s own bias against premature abstraction.

## Where invariants are enforced
Prisma/Postgres gives: uniqueness (`Skill.slug`, `SubSkill(skillId, slug)`, `PlannedTarget(skillId, weekStartDate)`), referential integrity (FKs), NOT NULL. It does **not** give: `durationMinutes > 0`, `occurredAt` not in the future, `weekStartDate` normalized to Monday — these are business rules, not structural ones, and are checked in the application layer immediately before a Prisma write (the single call site per operation, per FF-6/FF-16). This was a deliberate choice over hand-rolling Postgres `CHECK` constraints via raw migration SQL: Prisma 6's declarative schema doesn't have stable, non-preview support for arbitrary CHECK constraints, and reaching for raw SQL migrations to enforce what a three-line validation function already guarantees is exactly the kind of "optimizing for the rare case" the SA mission statement warns against. Revisit only if the data is ever written from somewhere other than this one application layer (it isn't, and isn't planned to be — no non-goal in `cto/tech_vision.md` implies a second writer).

## Indexing
- `StudySession(occurredAt)` — supports Epic 2's history view (list by date) and Epic 3's rolling week/month filtering.
- `StudySession(subSkillId)` — supports Epic 3's per-skill aggregation (join through `subSkill.skill`) and per-sub-skill breakdowns.
- `PlannedTarget(skillId, weekStartDate)` unique index doubles as the lookup index for Epic 4's adherence computation (`WHERE skillId = ? AND weekStartDate = ?`).

No composite/covering index beyond these for MVP — this is a single-user dataset, realistically thousands of rows over the project's lifetime, not millions. Query-plan tuning belongs to a `/sa persistence` revisit only if a real `EXPLAIN ANALYZE` shows a problem, not speculatively now.

## N+1 avoidance
Epic 3's "time-per-skill" aggregation must be a single grouped query (`groupBy` on `subSkillId` with a date-range filter, then map sub-skill → skill in application code using the already-seeded, small, cacheable Skill/SubSkill tables) — never "fetch sessions, then loop querying each session's skill." Same rule for Epic 4's adherence computation across multiple skills in one dashboard load: one query for targets, one grouped query for actuals, joined in application code, not N queries per skill.

## Local dev database
`apps/api/docker-compose.yml` runs Postgres 16 on the default port 5432 with `docker compose up -d`. (Verification for this document was run against port 5434 on this machine specifically, because another project's container already held 5432 locally — that's a this-machine detail, not a project default; a clean checkout uses 5432 as configured in `.env.example`.)
