import type { AdherenceTrendResponse } from "@/lib/api";
import { domainClassName } from "@/lib/domain-colors";

function cellClassName(percent: number | null): string {
  if (percent == null) return "text-foreground-muted";
  if (percent >= 100) return "text-success";
  if (percent >= 70) return "text-warning";
  return "text-danger";
}

export function AdherenceTrend({ data }: { data: AdherenceTrendResponse }) {
  const weeks = data.skills[0]?.points.map((p) => p.weekStartDate) ?? [];

  if (weeks.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-strong p-6 text-center text-sm text-foreground-muted">
        No completed weeks yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-border bg-surface px-3 py-2 text-left font-medium text-foreground-muted">
              Skill
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className="border-b border-border bg-surface px-3 py-2 text-right font-medium text-foreground-muted"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.skills.map((skill) => (
            <tr key={skill.skillId}>
              <td className="border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${domainClassName(skill.slug)}`}
                  />
                  <span className="text-foreground">{skill.name}</span>
                </div>
              </td>
              {skill.points.map((point) => (
                <td
                  key={point.weekStartDate}
                  className={`border-b border-border px-3 py-2 text-right font-medium ${cellClassName(point.adherencePercent)}`}
                >
                  {point.adherencePercent == null ? "—" : `${point.adherencePercent}%`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
