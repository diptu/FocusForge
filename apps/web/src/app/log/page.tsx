import type { Metadata } from "next";
import { getSkills, getStudySessions } from "@/lib/api";
import { LogSessionForm } from "./log-session-form";
import { SessionHistory } from "./session-history";

export const metadata: Metadata = {
  title: "Log a session — FocusForge",
};

export default async function LogPage() {
  const [skills, sessions] = await Promise.all([getSkills(), getStudySessions()]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Log a session
        </h1>
        <p className="text-sm text-foreground-muted">
          Skill, sub-skill, duration, optional notes — saved in one step.
        </p>
      </header>

      <LogSessionForm skills={skills} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">History</h2>
        <SessionHistory sessions={sessions} skills={skills} />
      </section>
    </main>
  );
}
