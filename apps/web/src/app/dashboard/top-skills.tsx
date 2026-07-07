import type { SkillTimeTotals } from "@/lib/api";

const TILE_GRADIENTS = [
  "var(--gradient-sunset)",
  "var(--gradient-ocean)",
  "var(--gradient-mint)",
] as const;

export function TopSkills({ skills }: { skills: SkillTimeTotals[] }) {
  const top = [...skills]
    .filter((s) => s.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 3);

  if (top.length === 0) {
    return (
      <div className="flex flex-1 items-center rounded-lg border border-dashed border-border-strong p-4 text-sm text-foreground-muted">
        No time logged this week yet — top skills will show up here once you do.
      </div>
    );
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
      {top.map((skill, i) => (
        <div
          key={skill.skillId}
          style={{ backgroundImage: TILE_GRADIENTS[i] }}
          className="flex flex-col justify-between gap-6 rounded-lg p-4 shadow-glow"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/25 text-sm font-bold text-white backdrop-blur"
          >
            {skill.name.charAt(0)}
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">{skill.name}</h3>
            <p className="text-sm text-white/90">{skill.totalMinutes} min this week</p>
          </div>
        </div>
      ))}
    </div>
  );
}
