/**
 * Server-only FocusForge API client. FOCUSFORGE_API_TOKEN must never reach
 * the client bundle, so this module is only ever imported from Server
 * Components / Server Actions, never from a "use client" file.
 */

export type SubSkill = {
  id: number;
  skillId: number;
  slug: string;
  name: string;
};

export type Skill = {
  id: number;
  slug: string;
  name: string;
  subSkills: SubSkill[];
};

export type StudySession = {
  id: number;
  subSkillId: number;
  durationMinutes: number;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  subSkill: SubSkill & { skill: Pick<Skill, "id" | "slug" | "name"> };
};

export type CreateStudySessionInput = {
  subSkillId: number;
  durationMinutes: number;
  occurredAt: string;
  notes?: string;
};

export type UpdateStudySessionInput = Partial<CreateStudySessionInput>;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiUrl = process.env.FOCUSFORGE_API_URL;
  const apiToken = process.env.FOCUSFORGE_API_TOKEN;
  if (!apiUrl || !apiToken) {
    throw new Error("FOCUSFORGE_API_URL / FOCUSFORGE_API_TOKEN are not configured");
  }

  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FocusForge API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function getSkills() {
  return apiFetch<Skill[]>("/skills");
}

export function getStudySessions() {
  return apiFetch<StudySession[]>("/study-sessions");
}

export function createStudySession(input: CreateStudySessionInput) {
  return apiFetch<StudySession>("/study-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStudySession(id: number, input: UpdateStudySessionInput) {
  return apiFetch<StudySession>(`/study-sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteStudySession(id: number) {
  return apiFetch<void>(`/study-sessions/${id}`, { method: "DELETE" });
}
