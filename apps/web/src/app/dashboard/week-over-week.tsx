import type { WeekOverWeekResponse } from "@/lib/api";
import { domainClassName } from "@/lib/domain-colors";

export function WeekOverWeek({ data }: { data: WeekOverWeekResponse }) {
  return (
    <ul className="flex flex-col gap-2">
      {data.skills.map((skill) => {
        const deltaLabel =
          skill.deltaMinutes === 0
            ? "±0 min"
            : skill.deltaMinutes > 0
              ? `+${skill.deltaMinutes} min`
              : `${skill.deltaMinutes} min`;
        const deltaClassName =
          skill.deltaMinutes > 0
            ? "text-success"
            : skill.deltaMinutes < 0
              ? "text-danger"
              : "text-foreground-muted";

        return (
          <li
            key={skill.skillId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface p-3"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${domainClassName(skill.slug)}`}
              />
              <span className="text-sm font-medium text-foreground">{skill.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <span>{skill.lastWeekMinutes} min last week</span>
              <span>{skill.thisWeekMinutes} min this week</span>
              <span className={`font-medium ${deltaClassName}`}>{deltaLabel}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
