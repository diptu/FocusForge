"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { logSessionAction, createSkillAction, createSubSkillAction, type SessionFormState } from "./actions";
import { InlineAddSelect } from "./inline-add-select";
import type { Skill } from "@/lib/api";
import { todayISO } from "@/lib/date";

const initialState: SessionFormState = { ok: false };

export function LogSessionForm({ skills: initialSkills }: { skills: Skill[] }) {
  const [state, formAction, isPending] = useActionState(logSessionAction, initialState);
  const [skills, setSkills] = useState(initialSkills);
  const [skillId, setSkillId] = useState(initialSkills[0]?.id.toString() ?? "");
  const [subSkillId, setSubSkillId] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubSkill, setIsAddingSubSkill] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const subSkills = skills.find((s) => s.id.toString() === skillId)?.subSkills ?? [];

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  // Sub-skills differ per skill, so switching skills always clears the pick.
  useEffect(() => {
    setSubSkillId("");
  }, [skillId]);

  async function handleCreateSkill(name: string) {
    const result = await createSkillAction(name);
    if (result.ok && result.skillId != null) {
      setSkills((prev) => [
        ...prev,
        { id: result.skillId!, slug: result.slug!, name: result.name!, subSkills: [] },
      ]);
      return { ok: true, id: result.skillId };
    }
    return { ok: false, error: result.error };
  }

  async function handleCreateSubSkill(name: string) {
    const parsedSkillId = Number(skillId);
    const result = await createSubSkillAction(parsedSkillId, name);
    if (result.ok && result.subSkillId != null) {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === parsedSkillId
            ? {
                ...s,
                subSkills: [
                  ...s.subSkills,
                  { id: result.subSkillId!, skillId: parsedSkillId, slug: result.slug!, name: result.name! },
                ],
              }
            : s,
        ),
      );
      return { ok: true, id: result.subSkillId };
    }
    return { ok: false, error: result.error };
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-foreground-muted">
          Skill
          <InlineAddSelect
            value={skillId}
            options={skills}
            onSelect={setSkillId}
            onCreate={handleCreateSkill}
            addLabel="+ Add new category…"
            namePlaceholder="e.g. Statistics"
            emptyLabel="No categories yet"
            onAddingChange={setIsAddingCategory}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground-muted">
          Sub-skill
          <InlineAddSelect
            name="subSkillId"
            value={subSkillId}
            options={subSkills}
            onSelect={setSubSkillId}
            onCreate={handleCreateSubSkill}
            addLabel="+ Add new sub-skill…"
            namePlaceholder="e.g. Linear Algebra"
            emptyLabel="No sub-skills yet — add one"
            required
            onAddingChange={setIsAddingSubSkill}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-foreground-muted">
          Duration (minutes)
          <input
            type="number"
            name="durationMinutes"
            min={1}
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground-muted">
          Date
          <input
            type="date"
            name="occurredAt"
            defaultValue={todayISO()}
            max={todayISO()}
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-foreground-muted">
        Notes (optional)
        <textarea
          name="notes"
          rows={2}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isAddingCategory || isAddingSubSkill}
          className="rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Log session"}
        </button>
        {state.ok && <span className="text-sm text-success">Saved.</span>}
        {state.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
