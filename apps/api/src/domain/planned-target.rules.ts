import { Result, ok, err } from "./result";
import { weekStartMonday } from "./date-utils";

export interface ValidPlannedTargetInput {
  targetMinutes: number;
  weekStartDate: Date;
}

/**
 * PlannedTarget invariants (services/api/architecture/aggregates.md):
 *   - targetMinutes > 0
 *   - weekStartDate normalized to the Monday of its week, so the
 *     (skillId, weekStartDate) unique constraint means what it says.
 */
export function validatePlannedTargetInput(
  input: { targetMinutes: number; weekStartDate: Date },
): Result<ValidPlannedTargetInput> {
  if (!Number.isFinite(input.targetMinutes) || input.targetMinutes <= 0) {
    return err("TARGET_NOT_POSITIVE", "targetMinutes must be greater than 0");
  }
  return ok({
    targetMinutes: input.targetMinutes,
    weekStartDate: weekStartMonday(input.weekStartDate),
  });
}

export function computeAdherencePercent(actualMinutes: number, targetMinutes: number): number {
  if (targetMinutes <= 0) return 0;
  return Math.round((actualMinutes / targetMinutes) * 100);
}
