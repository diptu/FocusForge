"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { logSessionAction, type SessionFormState } from "./actions";
import type { Skill } from "@/lib/api";
import { todayISO } from "@/lib/date";

const initialState: SessionFormState = { ok: false };

export function LogSessionForm({ skills }: { skills: Skill[] }) {
  const [state, formAction, isPending] = useActionState(logSessionAction, initialState);
  const [skillId, setSkillId] = useState(skills[0]?.id.toString() ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const subSkills = skills.find((s) => s.id.toString() === skillId)?.subSkills ?? [];

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  if (skills.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground-muted">
        No skills configured yet — seed the API before logging a session.
      </p>
    );
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
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground-muted">
          Sub-skill
          <select
            key={skillId}
            name="subSkillId"
            defaultValue=""
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="" disabled>
              Choose…
            </option>
            {subSkills.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
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
          disabled={isPending}
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
