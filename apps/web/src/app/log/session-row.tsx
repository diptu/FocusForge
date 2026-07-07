"use client";

import { useState, useTransition } from "react";
import { deleteSessionAction, updateSessionAction } from "./actions";
import type { Skill, StudySession } from "@/lib/api";
import { domainClassName } from "@/lib/domain-colors";
import { todayISO } from "@/lib/date";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function SessionRow({ session, skills }: { session: StudySession; skills: Skill[] }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [skillId, setSkillId] = useState(session.subSkill.skill.id.toString());
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const subSkills = skills.find((s) => s.id.toString() === skillId)?.subSkills ?? [];

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSessionAction(session.id, formData);
      if (result.ok) {
        setError(undefined);
        setEditing(false);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleDelete() {
    if (!confirm("Delete this session?")) return;
    setIsDeleting(true);
    await deleteSessionAction(session.id);
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${domainClassName(session.subSkill.skill.slug)}`}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {session.subSkill.skill.name} · {session.subSkill.name}
            </span>
            <span className="text-sm text-foreground-muted">
              {session.durationMinutes} min · {formatDate(session.occurredAt)}
              {session.notes ? ` · ${session.notes}` : ""}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm text-danger hover:underline disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-border-strong bg-surface-raised p-3 shadow-sm">
      <form action={handleSubmit} className="flex flex-col gap-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
          <select
            key={skillId}
            name="subSkillId"
            defaultValue={session.subSkillId}
            required
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {subSkills.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="number"
            name="durationMinutes"
            min={1}
            defaultValue={session.durationMinutes}
            required
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
          <input
            type="date"
            name="occurredAt"
            defaultValue={session.occurredAt.slice(0, 10)}
            max={todayISO()}
            required
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </div>
        <textarea
          name="notes"
          rows={2}
          defaultValue={session.notes ?? ""}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            Cancel
          </button>
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      </form>
    </li>
  );
}
