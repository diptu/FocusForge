# SA review — Epic 1 schema

**Version:** 1.0 · **Date:** 2026-07-07
**Scope:** `apps/api/prisma/schema.prisma` + seed + verification, against the checklist in `.claude/skills/software-architect/SKILL.md` §6/§7.

| Check | Result | Note |
|---|---|---|
| Aggregate boundaries — one root, owns its invariants | **Aligned** | `StudySession`, `PlannedTarget` — see `aggregates.md` |
| Dependency direction (domain imports no infra) | **N/A yet** | No application/domain code exists beyond the schema itself; re-check once Phase 6 NestJS modules are built |
| Anemic domain check | **N/A yet** | Same — Prisma models are data shape only; behavior (invariant checks) lands in Phase 6 application code, not modeled here |
| State machines used instead of status strings | **Aligned** | Neither aggregate has a lifecycle beyond CRUD; no status field was invented where none belongs |
| Errors as values for domain violations | **Deferred** | Documented as the intended pattern in `persistence_patterns.md`; not yet implemented since no application layer exists |
| Repository per aggregate root | **Aligned** | One per root; `Skill`/`SubSkill` correctly excluded (reference data, no invariants to protect) |
| N+1 prevention | **Aligned** | Grouped-query pattern specified in `persistence_patterns.md` for Epic 3/4 aggregations |
| Test coverage ≥80% on domain | **Not yet applicable** | No domain code (validation functions) written yet — schema only. `/sa test-strategy` should run before or alongside Phase 6 implementation, not now |
| Code-ADR coverage | **Aligned** | The one decision affecting multiple future call sites (sa-adr-001) is documented |

## Verified, not just designed
- `prisma validate` and `prisma format` pass.
- `prisma migrate dev` applied cleanly to a real Postgres 16 instance (Docker) from empty.
- Seed script populated 5 skills × 6 sub-skills each, idempotently (upsert-based).
- Round-trip check: a backdated `StudySession.occurredAt` survives exactly through write → read (FF-2's acceptance criterion), and `subSkill.skill` correctly resolves the owning skill through the relation (proving sa-adr-001's design actually works, not just reads well on paper).

## Verdict
**Approved for Phase 6 (NestJS implementation) to proceed on this schema.** Two items remain explicitly deferred, not forgotten:
1. Application-layer invariant enforcement (`durationMinutes > 0`, `occurredAt` not future, Monday-normalization) — write this as part of Phase 6, test it then; `/sa errors` can formalize the pattern first if Phase 6 wants that scaffolding before writing NestJS services.
2. `/sa test-strategy` for the eventual domain validation functions — run once there's actual code to strategize testing for.

No blockers on the schema itself.
