import { Result, ok, err } from "./result";
import { isAfterDateOnly, toDateOnlyUTC, addDaysUTC } from "./date-utils";

export interface ValidStudySessionInput {
  durationMinutes: number;
  occurredAt: Date;
}

/**
 * "Not in the future" is checked against the server's UTC calendar date
 * with 1 day of slack, not an exact match. The server has no per-user
 * timezone (single-user app, FF-4 — no profile/settings exist to hold
 * one), so a user west of UTC can have a local "today" that's still
 * "tomorrow" in UTC terms depending on time of day. A tolerance of 1 day
 * covers every real UTC offset (-12 to +14) without letting genuinely
 * future dates through.
 */
const FUTURE_DATE_TOLERANCE_DAYS = 1;

/**
 * StudySession invariants (services/api/architecture/aggregates.md):
 *   - durationMinutes > 0
 *   - occurredAt is not in the future (see tolerance note above)
 * Enforced here, once, at the single call site that writes a session —
 * not as a DB CHECK constraint (see persistence_patterns.md).
 */
export function validateStudySessionInput(
  input: { durationMinutes: number; occurredAt: Date },
  now: Date = new Date(),
): Result<ValidStudySessionInput> {
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    return err("DURATION_NOT_POSITIVE", "durationMinutes must be greater than 0");
  }
  if (isAfterDateOnly(input.occurredAt, addDaysUTC(now, FUTURE_DATE_TOLERANCE_DAYS))) {
    return err("OCCURRED_AT_IN_FUTURE", "occurredAt cannot be in the future");
  }
  return ok({
    durationMinutes: input.durationMinutes,
    occurredAt: toDateOnlyUTC(input.occurredAt),
  });
}
