import type { Metadata } from "next";
import { getAdherenceForWeek, getTimePerSkill, getWeekOverWeek } from "@/lib/api";
import { AdherenceRing } from "@/components/adherence-ring";
import { TimePerSkillView } from "./time-per-skill-view";
import { WeekOverWeek } from "./week-over-week";
import { TopSkills } from "./top-skills";
import { PlannedSummary } from "./planned-summary";

export const metadata: Metadata = {
  title: "Dashboard — FocusForge",
};

export default async function DashboardPage() {
  const [week, month, weekOverWeek, adherence] = await Promise.all([
    getTimePerSkill("week"),
    getTimePerSkill("month"),
    getWeekOverWeek(),
    getAdherenceForWeek(),
  ]);

  const withTarget = adherence.skills.filter((s) => s.adherencePercent != null);
  const avgAdherence =
    withTarget.length === 0
      ? null
      : withTarget.reduce((sum, s) => sum + (s.adherencePercent ?? 0), 0) / withTarget.length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground-muted">
          Time per skill, computed from logged sessions — no manual tallying.
        </p>
      </header>

      <AdherenceRing percent={avgAdherence} action={{ href: "/plan", label: "View plan" }} />

      <TopSkills skills={week.skills} />

      <TimePerSkillView week={week} month={month} />

      <div className="flex flex-col gap-4 sm:flex-row">
        <PlannedSummary skills={adherence.skills} />
        <section className="flex flex-1 flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            This week vs last week
          </h2>
          <WeekOverWeek data={weekOverWeek} />
        </section>
      </div>
    </main>
  );
}
