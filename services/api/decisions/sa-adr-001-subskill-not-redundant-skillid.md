# SA-ADR-001: StudySession references SubSkill only, not Skill directly

**Status:** Accepted
**Date:** 2026-07-07
**Scope:** code-level (`apps/api/prisma/schema.prisma`) — not a system-level concern, no `/ea adr` needed.

## Context
`pm/prd_mvp.md` Epic 1 describes `StudySession` with both a `skillId` and a `subSkillId` field. Storing both literally means every write must guarantee `subSkill.skillId === session.skillId` — an invariant that lives across two foreign keys on the same row, checkable only with an extra read (or a DB trigger) on every insert/update, and silently violable if any future code path ever forgets the check.

## Options considered
1. **Store both `skillId` and `subSkillId` on `StudySession`** (PRD's literal field list). Requires an explicit invariant check on every write path, forever, to prevent the two from disagreeing.
2. **Store only `subSkillId`; derive skill via `subSkill.skill` relation.** Removes the invariant entirely — there is no second FK to disagree with the first. Costs one join (`subSkill.skill`) wherever the skill is needed, e.g. Epic 3's per-skill aggregation.

## Decision
Option 2. `StudySession` stores `subSkillId` only (`apps/api/prisma/schema.prisma`). Skill is reached via `subSkill.skill`.

## Consequences
- **Positive:** an entire class of data-consistency bugs (mismatched skill/sub-skill pair) is unrepresentable, not just checked-for. One less application-layer validation to write, test, and keep correct across every future write path (including ones not yet built, e.g. a future bulk-import feature).
- **Negative:** every query that needs the skill (Epic 3 dashboard, Epic 4 adherence-by-skill) must join through `subSkill`. Verified acceptable: confirmed via the schema round-trip check that `subSkill.skill.slug` resolves correctly and the indexing plan in `persistence_patterns.md` already covers `subSkillId` lookups, so this join is cheap.
- Frontend/API contracts should expose `skill` as a nested/derived field on a session read model (e.g. `session.subSkill.skill`), not flatten it — flattening in the API layer is fine, flattening in the *schema* is what this ADR avoids.

## Reversibility
Reversible, but not free: adding a redundant `skillId` back would require a migration, a backfill (`skillId = subSkill.skillId` for existing rows), and reintroducing the exact invariant this decision avoids. Low likelihood of needing to reverse — no known future requirement (Phase 4/5 weakness detection, Phase 6+ anything) needs `StudySession.skillId` to exist independently of the relation.
