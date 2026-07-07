import { Result, ok, err } from "./result";

export interface ValidSkillNameInput {
  name: string;
  slug: string;
}

const MAX_NAME_LENGTH = 60;

/**
 * Skill/SubSkill invariants for user-created categories (extends the
 * seeded-only model in aggregates.md): non-empty, bounded length, and
 * must slugify to something non-empty (a name of pure punctuation would
 * otherwise produce an empty slug and collide with every other one).
 *
 * Shared between Skill and SubSkill — same rule, same call site shape,
 * see FF-1's "no feature ever stores a skill as free text" note; this is
 * the one validated boundary that guarantees that even for user input.
 */
function validateName(rawName: string): Result<ValidSkillNameInput> {
  const name = rawName.trim();
  if (name.length === 0) {
    return err("NAME_EMPTY", "Name cannot be empty");
  }
  if (name.length > MAX_NAME_LENGTH) {
    return err("NAME_TOO_LONG", `Name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }
  const slug = slugify(name);
  if (slug.length === 0) {
    return err("NAME_INVALID", "Name must contain at least one letter or number");
  }
  return ok({ name, slug });
}

export function validateNewSkillName(rawName: string): Result<ValidSkillNameInput> {
  return validateName(rawName);
}

export function validateNewSubSkillName(rawName: string): Result<ValidSkillNameInput> {
  return validateName(rawName);
}

/**
 * Custom categories/sub-skills created this way do NOT get a bespoke
 * Tailwind domain color — apps/web's domainClassName() falls back to
 * bg-foreground-muted for any slug outside the 5 seeded domains
 * (apps/web/src/lib/domain-colors.ts). That's deliberate: Tailwind can
 * only generate utility classes for statically-written strings, so an
 * arbitrary user-typed category can't get its own generated class.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
