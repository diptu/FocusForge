import type { Skill, StudySession } from "@/lib/api";
import { SessionRow } from "./session-row";

export function SessionHistory({
  sessions,
  skills,
}: {
  sessions: StudySession[];
  skills: Skill[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-strong p-6 text-center text-sm text-foreground-muted">
        No sessions logged yet — use the form above to log your first one.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} skills={skills} />
      ))}
    </ul>
  );
}
