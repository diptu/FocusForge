"use server";

import { revalidatePath } from "next/cache";
import { setPlannedTarget } from "@/lib/api";

export type TargetFormState = { ok: boolean; error?: string };

export async function setTargetAction(
  skillId: number,
  weekStartDate: string,
  formData: FormData,
): Promise<TargetFormState> {
  try {
    const targetMinutes = Number(formData.get("targetMinutes"));
    if (!Number.isFinite(targetMinutes) || targetMinutes <= 0) {
      throw new Error("Target minutes must be greater than 0.");
    }
    await setPlannedTarget({ skillId, weekStartDate, targetMinutes });
    revalidatePath("/plan");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to set target." };
  }
}
