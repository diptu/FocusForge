"use client";

import { useState, useTransition } from "react";
import { setTargetAction } from "./actions";
import type { AdherenceSkill } from "@/lib/api";
import { domainClassName } from "@/lib/domain-colors";

function adherenceClassName(percent: number | null): string {
  if (percent == null) return "text-foreground-muted";
  if (percent >= 100) return "text-success";
  if (percent >= 70) return "text-warning";
  return "text-danger";
}

export function TargetRow({
  skill,
  weekStartDate,
}: {
  skill: AdherenceSkill;
  weekStartDate: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; error?: string } | undefined>();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await setTargetAction(skill.skillId, weekStartDate, formData);
      setStatus(result);
    });
  }

  const adherenceLabel =
    skill.adherencePercent == null ? "No target set" : `${skill.adherencePercent}% adherence`;
  const hasTarget = skill.targetMinutes != null;

  return (
    <li className="flex flex-col gap-2 rounded-lg bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${domainClassName(skill.slug)}`}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{skill.name}</span>
          <span className="text-sm text-foreground-muted">
            {skill.actualMinutes} min logged
            {skill.targetMinutes != null ? ` / ${skill.targetMinutes} min target` : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${adherenceClassName(skill.adherencePercent)}`}>
          {adherenceLabel}
        </span>
        <form action={handleSubmit} className="flex items-center gap-2">
          <input
            type="number"
            name="targetMinutes"
            min={1}
            defaultValue={skill.targetMinutes ?? undefined}
            placeholder="minutes"
            aria-label={`${hasTarget ? "Edit" : "Set"} weekly target minutes for ${skill.name}`}
            required
            className="w-24 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
          >
            {isPending ? "Saving…" : hasTarget ? "Update" : "Set"}
          </button>
        </form>
        {status?.ok && <span className="text-sm text-success">Saved.</span>}
        {status?.error && <span className="text-sm text-danger">{status.error}</span>}
      </div>
    </li>
  );
}
