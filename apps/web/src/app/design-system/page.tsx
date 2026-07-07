/**
 * Tailwind's scanner only detects statically-written class strings, so
 * dynamic template literals like `bg-${token}` would silently fail to
 * generate — every class below is written out in full for that reason.
 */
const domains = [
  { name: "Quant", className: "bg-domain-quant" },
  { name: "IELTS", className: "bg-domain-ielts" },
  { name: "JS", className: "bg-domain-js" },
  { name: "Stats", className: "bg-domain-stats" },
  { name: "Deep Learning", className: "bg-domain-dl" },
] as const;

const statuses = [
  { name: "Success", className: "bg-success" },
  { name: "Warning", className: "bg-warning" },
  { name: "Danger", className: "bg-danger" },
  { name: "Info", className: "bg-info" },
] as const;

const gradients = [
  { name: "sunset", var: "var(--gradient-sunset)" },
  { name: "ocean", var: "var(--gradient-ocean)" },
  { name: "mint", var: "var(--gradient-mint)" },
] as const;

const radii = [
  { name: "sm", className: "rounded-sm" },
  { name: "md", className: "rounded-md" },
  { name: "lg", className: "rounded-lg" },
  { name: "xl", className: "rounded-xl" },
] as const;

export default function DesignSystem() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          FocusForge design tokens
        </h1>
        <p className="text-base text-foreground-muted">
          Living usage examples for every token in{" "}
          <code className="rounded-sm bg-surface px-1.5 py-0.5 text-sm">
            src/styles/tokens.css
          </code>
          . No literal colors, spacing, or radii below — everything here is a
          Tailwind utility backed by a token.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Surfaces</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 rounded-md border border-border bg-background p-4 text-sm text-foreground shadow-sm">
            background
          </div>
          <div className="flex-1 rounded-md border border-border bg-surface p-4 text-sm text-foreground shadow-sm">
            surface
          </div>
          <div className="flex-1 rounded-md border border-border-strong bg-surface-raised p-4 text-sm text-foreground shadow-md">
            surface-raised
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">
          Brand &amp; status
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground">
            brand
          </span>
          {statuses.map((s) => (
            <span
              key={s.name}
              className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${s.className}`}
            >
              {s.name}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">
          Skill-domain accents
        </h2>
        <p className="text-sm text-foreground-muted">
          Used for chart series and skill tags on the analytics dashboard
          (pm/roadmap.md Phase 2) — kept visually distinct from each other and
          from the status colors above.
        </p>
        <div className="flex flex-wrap gap-2">
          {domains.map((d) => (
            <span
              key={d.name}
              className={`rounded-full px-3 py-1 text-sm font-medium text-white ${d.className}`}
            >
              {d.name}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Gradients</h2>
        <p className="text-sm text-foreground-muted">
          Three-stop mesh gradients for accent cards, badges, and the progress
          ring — consumed as{" "}
          <code className="rounded-sm bg-surface px-1.5 py-0.5 text-sm">
            bg-[image:var(--gradient-name)]
          </code>{" "}
          since a multi-stop gradient can&apos;t travel through the Tailwind
          color pipeline like a single color token can.
        </p>
        <div className="flex flex-wrap gap-2">
          {gradients.map((g) => (
            <div
              key={g.name}
              style={{ backgroundImage: g.var }}
              className="flex h-16 w-32 items-end rounded-lg p-2 shadow-glow"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-white">
                {g.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Radius</h2>
        <div className="flex flex-wrap gap-2">
          {radii.map((r) => (
            <div
              key={r.name}
              className={`flex h-16 w-16 items-center justify-center border border-border bg-surface text-xs text-foreground-muted ${r.className}`}
            >
              {r.name}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Motion</h2>
        <p className="text-sm text-foreground-muted">
          Hover to see <code>duration-fast</code> vs <code>duration-slow</code>
          . Respects <code>prefers-reduced-motion</code>.
        </p>
        <div className="flex gap-3">
          <button className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-brand hover:text-brand-foreground">
            fast
          </button>
          <button className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors duration-[var(--duration-slow)] ease-standard hover:bg-brand hover:text-brand-foreground">
            slow
          </button>
        </div>
      </section>
    </main>
  );
}
