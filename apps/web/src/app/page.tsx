const domains = [
  { name: "Quant", className: "bg-domain-quant" },
  { name: "IELTS", className: "bg-domain-ielts" },
  { name: "JS", className: "bg-domain-js" },
  { name: "Stats", className: "bg-domain-stats" },
  { name: "Deep Learning", className: "bg-domain-dl" },
] as const;

const capabilities = [
  {
    title: "Daily study logger",
    body: "Log a session — skill, subskill, duration, notes — in under 15 seconds.",
  },
  {
    title: "Skill-wise analytics",
    body: "Time per skill and subskill, rolling week and month trends.",
  },
  {
    title: "Planned vs. actual",
    body: "Set a weekly target per skill, see adherence % against what you actually logged.",
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-14 px-6 py-20">
      <header className="flex flex-col gap-4">
        <span className="text-sm font-medium text-foreground-muted">
          FocusForge
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          See where your study time actually goes.
        </h1>
        <p className="max-w-xl text-base text-foreground-muted">
          Get told what&apos;s slipping before you would&apos;ve noticed
          yourself. FocusForge turns a week of logged sessions into a
          specific, trusted signal for what to drill next.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {domains.map((d) => (
            <span
              key={d.name}
              className={`rounded-full px-3 py-1 text-sm font-medium text-white ${d.className}`}
            >
              {d.name}
            </span>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-foreground">
          The loop this closes
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-4"
            >
              <h3 className="text-sm font-medium text-foreground">
                {c.title}
              </h3>
              <p className="text-sm text-foreground-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-border-strong bg-surface-raised p-4 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">
          North star metric
        </h2>
        <p className="text-sm text-foreground-muted">
          Weekly plan adherence, trending up over consecutive weeks — proof
          the system is changing behavior, not just archiving it.
        </p>
      </section>
    </main>
  );
}
