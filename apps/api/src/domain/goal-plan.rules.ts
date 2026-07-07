import { Result, ok, err } from "./result";

export interface ValidGoalScore {
  label: string;
  score: string;
}

export interface ValidGoalInput {
  description: string;
  durationWeeks: number;
  currentScores: ValidGoalScore[];
}

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SCORE_LABEL_LENGTH = 60;
const MAX_SCORE_VALUE_LENGTH = 30;
const MAX_SCORES = 10;
const MIN_DURATION_WEEKS = 1;
const MAX_DURATION_WEEKS = 52;

/**
 * Goal invariants: non-empty bounded description, a plausible duration (a
 * "goal" isn't a single-day plan, and a multi-year duration stops being a
 * weekly plan), and well-formed optional current scores. Scores are kept as
 * free text (see schema.prisma) — GRE (260-340) and IELTS (0-9 bands) don't
 * share a scale, so validation only bounds length, not format.
 */
export function validateGoalInput(input: {
  description: string;
  durationWeeks: number;
  currentScores?: { label: string; score: string }[];
}): Result<ValidGoalInput> {
  const description = input.description.trim();
  if (description.length === 0) {
    return err("DESCRIPTION_EMPTY", "Goal description cannot be empty");
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return err(
      "DESCRIPTION_TOO_LONG",
      `Goal description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
    );
  }

  if (
    !Number.isInteger(input.durationWeeks) ||
    input.durationWeeks < MIN_DURATION_WEEKS ||
    input.durationWeeks > MAX_DURATION_WEEKS
  ) {
    return err(
      "DURATION_OUT_OF_RANGE",
      `durationWeeks must be an integer between ${MIN_DURATION_WEEKS} and ${MAX_DURATION_WEEKS}`,
    );
  }

  const rawScores = input.currentScores ?? [];
  if (rawScores.length > MAX_SCORES) {
    return err("TOO_MANY_SCORES", `Provide at most ${MAX_SCORES} current scores`);
  }

  const currentScores: ValidGoalScore[] = [];
  for (const raw of rawScores) {
    const label = raw.label.trim();
    const score = raw.score.trim();
    if (label.length === 0 || score.length === 0) {
      return err("SCORE_INCOMPLETE", "Each score needs both a label and a value");
    }
    if (label.length > MAX_SCORE_LABEL_LENGTH || score.length > MAX_SCORE_VALUE_LENGTH) {
      return err(
        "SCORE_TOO_LONG",
        `Score label/value exceeds the ${MAX_SCORE_LABEL_LENGTH}/${MAX_SCORE_VALUE_LENGTH} character limit`,
      );
    }
    currentScores.push({ label, score });
  }

  return ok({ description, durationWeeks: input.durationWeeks, currentScores });
}

export interface ValidGeneratedSkillAllocation {
  name: string;
  isNewCategory: boolean;
  subSkills: string[];
  weeklyMinutes: number;
}

export interface ValidGeneratedScore {
  label: string;
  current: string;
  projected: string;
  note: string;
}

export interface ValidGeneratedOption {
  weeklyHours: number;
  summary: string;
  skills: ValidGeneratedSkillAllocation[];
  tentativeScores: ValidGeneratedScore[];
}

const EXPECTED_WEEKLY_HOURS = [40, 30, 20];

/**
 * Defense-in-depth check on the LLM's structured-output JSON. The API
 * request already constrains this shape via output_config.format (json
 * schema), but a schema guarantees shape, not business invariants — this
 * confirms the three options are the expected weekly-hour tiers and each
 * has at least one real (positive-minute) skill allocation before any of
 * it is persisted or shown to the user.
 */
export function validateGeneratedOptions(raw: unknown): Result<ValidGeneratedOption[]> {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { options?: unknown }).options)) {
    return err("MALFORMED_RESPONSE", "Expected an object with an options array");
  }

  const options = (raw as { options: unknown[] }).options;
  if (options.length !== EXPECTED_WEEKLY_HOURS.length) {
    return err(
      "WRONG_OPTION_COUNT",
      `Expected ${EXPECTED_WEEKLY_HOURS.length} plan options, got ${options.length}`,
    );
  }

  const validated: ValidGeneratedOption[] = [];
  const seenHours = new Set<number>();

  for (const rawOption of options) {
    const option = rawOption as Partial<ValidGeneratedOption> & { skills?: unknown[] };
    if (
      typeof option.weeklyHours !== "number" ||
      !EXPECTED_WEEKLY_HOURS.includes(option.weeklyHours)
    ) {
      return err(
        "INVALID_WEEKLY_HOURS",
        `weeklyHours must be one of ${EXPECTED_WEEKLY_HOURS.join(", ")}`,
      );
    }
    if (seenHours.has(option.weeklyHours)) {
      return err("DUPLICATE_WEEKLY_HOURS", `Duplicate weeklyHours: ${option.weeklyHours}`);
    }
    seenHours.add(option.weeklyHours);

    if (typeof option.summary !== "string" || option.summary.trim().length === 0) {
      return err("MISSING_SUMMARY", "Each option needs a non-empty summary");
    }

    if (!Array.isArray(option.skills) || option.skills.length === 0) {
      return err("NO_SKILLS", "Each option needs at least one skill allocation");
    }

    const skills: ValidGeneratedSkillAllocation[] = [];
    for (const rawSkill of option.skills) {
      const skill = rawSkill as Partial<ValidGeneratedSkillAllocation>;
      if (typeof skill.name !== "string" || skill.name.trim().length === 0) {
        return err("SKILL_NAME_MISSING", "Every skill allocation needs a name");
      }
      if (typeof skill.weeklyMinutes !== "number" || skill.weeklyMinutes <= 0) {
        return err("SKILL_MINUTES_INVALID", `${skill.name}: weeklyMinutes must be > 0`);
      }
      skills.push({
        name: skill.name.trim(),
        isNewCategory: skill.isNewCategory === true,
        subSkills: Array.isArray(skill.subSkills)
          ? skill.subSkills.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          : [],
        weeklyMinutes: Math.round(skill.weeklyMinutes),
      });
    }

    const tentativeScores: ValidGeneratedScore[] = Array.isArray(option.tentativeScores)
      ? option.tentativeScores
          .filter(
            (s): s is ValidGeneratedScore =>
              !!s &&
              typeof (s as ValidGeneratedScore).label === "string" &&
              typeof (s as ValidGeneratedScore).current === "string" &&
              typeof (s as ValidGeneratedScore).projected === "string",
          )
          .map((s) => ({
            label: s.label,
            current: s.current,
            projected: s.projected,
            note: typeof s.note === "string" ? s.note : "",
          }))
      : [];

    validated.push({
      weeklyHours: option.weeklyHours,
      summary: option.summary.trim(),
      skills,
      tentativeScores,
    });
  }

  return ok(validated.sort((a, b) => b.weeklyHours - a.weeklyHours));
}
