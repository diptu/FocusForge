import Link from "next/link";
import type { AdherenceSkill } from "@/lib/api";
import { domainClassName } from "@/lib/domain-colors";

export function PlannedSummary({ skills }: { skills: AdherenceSkill[] }) {
  const planned = skills.filter((s) => s.targetMinutes != null);

  return (
    <section className="flex flex-1 flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Planned this week
        </h2>
        <Link
          href="/plan"
          className="rounded-full border border-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-brand hover:text-brand-foreground"
        >
          View plan
        </Link>
      </div>
      {planned.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No weekly targets set yet — set one on the Plan page to see it here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {planned.map((skill) => (
            <li
              key={skill.skillId}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${domainClassName(skill.slug)}`}
                />
                <span className="text-sm font-medium text-foreground">{skill.name}</span>
              </div>
              <span className="text-sm text-foreground-muted">
                {skill.actualMinutes} / {skill.targetMinutes} min
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
