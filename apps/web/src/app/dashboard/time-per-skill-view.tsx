"use client";

import { useState } from "react";
import type { TimePerSkillResponse } from "@/lib/api";
import { domainClassName } from "@/lib/domain-colors";

export function TimePerSkillView({
  week,
  month,
}: {
  week: TimePerSkillResponse;
  month: TimePerSkillResponse;
}) {
  const [range, setRange] = useState<"week" | "month">("week");
  const data = range === "week" ? week : month;
  const maxMinutes = Math.max(1, ...data.skills.map((s) => s.totalMinutes));

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Time per skill
        </h2>
        <div className="flex gap-1 rounded-full bg-surface p-1">
          {(["week", "month"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-current={range === r ? "true" : undefined}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors duration-[var(--duration-fast)] ease-standard ${
                range === r
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {r === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-foreground-muted">
        {data.range.from} – {data.range.to}
      </p>
      <ul className="flex flex-col gap-4">
        {data.skills.map((skill) => (
          <li key={skill.skillId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{skill.name}</span>
              <span className="text-foreground-muted">{skill.totalMinutes} min</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className={`h-full rounded-full ${domainClassName(skill.slug)}`}
                style={{ width: `${(skill.totalMinutes / maxMinutes) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
