import type { Metadata } from "next";
import Link from "next/link";
import { getAdherenceForWeek, getAdherenceTrend } from "@/lib/api";
import { addDaysISO, todayISO, weekStartMondayISO } from "@/lib/date";
import { TargetRow } from "./target-row";
import { AdherenceTrend } from "./adherence-trend";

export const metadata: Metadata = {
  title: "Plan — FocusForge",
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: requestedWeek } = await searchParams;
  const [adherence, trend] = await Promise.all([
    getAdherenceForWeek(requestedWeek),
    getAdherenceTrend(6),
  ]);

  const prevWeek = addDaysISO(adherence.weekStartDate, -7);
  const nextWeek = addDaysISO(adherence.weekStartDate, 7);
  const isCurrentWeek = adherence.weekStartDate === weekStartMondayISO(todayISO());

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Plan vs actual</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/plan?week=${prevWeek}`}
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            ‹ Previous week
          </Link>
          <span className="text-sm font-medium text-foreground">
            Week of {adherence.weekStartDate}
          </span>
          <Link
            href={`/plan?week=${nextWeek}`}
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            Next week ›
          </Link>
          {!isCurrentWeek && (
            <Link href="/plan" className="text-sm text-brand hover:underline">
              This week
            </Link>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">Weekly targets &amp; adherence</h2>
        <ul className="flex flex-col gap-2">
          {adherence.skills.map((skill) => (
            <TargetRow
              key={`${adherence.weekStartDate}-${skill.skillId}`}
              skill={skill}
              weekStartDate={adherence.weekStartDate}
            />
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
