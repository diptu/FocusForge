import type { Metadata } from "next";
import { getAdherenceForWeek, getAdherenceTrend } from "@/lib/api";
import { TargetRow } from "./target-row";
import { AdherenceTrend } from "./adherence-trend";

export const metadata: Metadata = {
  title: "Plan — FocusForge",
};

export default async function PlanPage() {
  const [adherence, trend] = await Promise.all([getAdherenceForWeek(), getAdherenceTrend(6)]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Plan vs actual</h1>
        <p className="text-sm text-foreground-muted">Week of {adherence.weekStartDate}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Weekly targets &amp; adherence</h2>
        <ul className="flex flex-col gap-2">
          {adherence.skills.map((skill) => (
            <TargetRow key={skill.skillId} skill={skill} weekStartDate={adherence.weekStartDate} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Adherence trend (last 6 weeks)</h2>
        <AdherenceTrend data={trend} />
      </section>
    </main>
  );
}
