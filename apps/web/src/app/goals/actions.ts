"use server";

import { revalidatePath } from "next/cache";
import {
  createGoal,
  createSkill,
  deleteSkill,
  generateGoalPlans,
  selectGoalPlanOption,
  type CreateGoalInput,
  type Goal,
} from "@/lib/api";

export type GoalActionState = { ok: boolean; error?: string; goal?: Goal };

export type CreateSkillActionState = {
  ok: boolean;
  error?: string;
  id?: number;
  slug?: string;
  name?: string;
};

export async function createGoalCategoryAction(name: string): Promise<CreateSkillActionState> {
  try {
    const skill = await createSkill({ name });
    revalidatePath("/goals");
    revalidatePath("/log");
    return { ok: true, id: skill.id, slug: skill.slug, name: skill.name };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to add category." };
  }
}

export type DeleteSkillActionState = { ok: boolean; error?: string };

export async function deleteGoalCategoryAction(id: number): Promise<DeleteSkillActionState> {
  try {
    await deleteSkill(id);
    revalidatePath("/goals");
    revalidatePath("/log");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete category.",
    };
  }
}

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
