"use server";

import { revalidatePath } from "next/cache";
import { createStudySession, deleteStudySession, updateStudySession } from "@/lib/api";

export type SessionFormState = { ok: boolean; error?: string };

function parseSessionInput(formData: FormData) {
  const subSkillId = Number(formData.get("subSkillId"));
  const durationMinutes = Number(formData.get("durationMinutes"));
  const occurredAt = String(formData.get("occurredAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!subSkillId || !durationMinutes || !occurredAt) {
    throw new Error("Skill, sub-skill, duration, and date are required.");
  }

  return {
    subSkillId,
    durationMinutes,
    occurredAt,
    notes: notes.length > 0 ? notes : undefined,
  };
}

export async function logSessionAction(
  _prevState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  try {
    await createStudySession(parseSessionInput(formData));
    revalidatePath("/log");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to log session." };
  }
}

export async function updateSessionAction(
  id: number,
  formData: FormData,
): Promise<SessionFormState> {
  try {
    await updateStudySession(id, parseSessionInput(formData));
    revalidatePath("/log");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update session." };
  }
}

export async function deleteSessionAction(id: number): Promise<void> {
  await deleteStudySession(id);
  revalidatePath("/log");
}
