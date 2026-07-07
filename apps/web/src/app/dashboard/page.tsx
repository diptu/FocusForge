import type { Metadata } from "next";
import { getTimePerSkill, getWeekOverWeek } from "@/lib/api";
import { TimePerSkillView } from "./time-per-skill-view";
import { WeekOverWeek } from "./week-over-week";

export const metadata: Metadata = {
  title: "Dashboard — FocusForge",
};

export default async function DashboardPage() {
  const [week, month, weekOverWeek] = await Promise.all([
    getTimePerSkill("week"),
    getTimePerSkill("month"),
    getWeekOverWeek(),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground-muted">
          Time per skill, computed from logged sessions — no manual tallying.
        </p>
      </header>

      <TimePerSkillView week={week} month={month} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">This week vs last week</h2>
        <WeekOverWeek data={weekOverWeek} />
      </section>
    </main>
  );
}
