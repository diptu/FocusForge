"use server";

import { revalidatePath } from "next/cache";
import {
  createGoal,
  generateGoalPlans,
  selectGoalPlanOption,
  type CreateGoalInput,
  type Goal,
} from "@/lib/api";

export type GoalActionState = { ok: boolean; error?: string; goal?: Goal };

export async function createGoalAction(input: CreateGoalInput): Promise<GoalActionState> {
  try {
    const goal = await createGoal(input);
    return { ok: true, goal };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create goal." };
  }
}

export async function generatePlansAction(goalId: number): Promise<GoalActionState> {
  try {
    const goal = await generateGoalPlans(goalId);
    return { ok: true, goal };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate plans.",
    };
  }
}

export async function selectPlanAction(
  goalId: number,
  optionId: number,
): Promise<GoalActionState> {
  try {
    const goal = await selectGoalPlanOption(goalId, optionId);
    revalidatePath("/plan");
    revalidatePath("/dashboard");
    return { ok: true, goal };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to apply plan." };
  }
}
