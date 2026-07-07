import Link from "next/link";

function ringStyle(percent: number): React.CSSProperties {
  const midpoint = percent * 0.5;
  const mask =
    "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))";
  return {
    backgroundImage: `conic-gradient(from -90deg, #8b5cf6 0%, #ec4899 ${midpoint}%, #fb923c ${percent}%, transparent ${percent}% 100%)`,
    WebkitMask: mask,
    mask,
  };
}

export function AdherenceRing({
  percent,
  label = "Overall adherence",
  description = "Average across skills with a target set this week.",
  action,
}: {
  percent: number | null;
  label?: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  const clamped = percent == null ? 0 : Math.max(0, Math.min(100, percent));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <div className="absolute inset-0 rounded-full bg-surface" />
          <div className="absolute inset-0 rounded-full" style={ringStyle(clamped)} />
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
            {percent == null ? "—" : `${Math.round(percent)}%`}
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {label}
          </span>
          <span className="text-sm text-foreground-muted">{description}</span>
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 rounded-full border border-brand px-4 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-brand transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-brand hover:text-brand-foreground"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
