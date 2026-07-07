import type { Metadata } from "next";
import { getSkills } from "@/lib/api";
import { GoalPlanner } from "./goal-planner";

export const metadata: Metadata = {
  title: "Goals — FocusForge",
};

export default async function GoalsPage() {
  const skills = await getSkills();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          LLM-guided weekly plan
        </h1>
        <p className="text-sm text-foreground-muted">
          Describe a goal and a timeframe — Claude drafts three candidate weekly plans (40h, 30h,
          20h) with a per-skill time breakdown. Pick one to set it as your weekly target for every
          week in range.
        </p>
      </header>

      <GoalPlanner initialSkills={skills} />
    </main>
  );
}
