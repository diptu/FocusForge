"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createGoalAction,
  createGoalCategoryAction,
  generatePlansAction,
  selectPlanAction,
} from "./actions";
import { TargetSkillsPicker } from "./target-skills-picker";
import type { Goal, GoalPlanOption, Skill } from "@/lib/api";

const TILE_GRADIENTS = [
  "var(--gradient-sunset)",
  "var(--gradient-ocean)",
  "var(--gradient-mint)",
] as const;

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

type Status = "idle" | "creating" | "generating" | "applying";

export function GoalPlanner({ initialSkills }: { initialSkills: Skill[] }) {
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [scores, setScores] = useState<{ label: string; score: string }[]>([]);
  const [skills, setSkills] = useState(initialSkills);
  const [targetSkillIds, setTargetSkillIds] = useState<number[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();

  function addScoreRow() {
    setScores((prev) => [...prev, { label: "", score: "" }]);
  }

  function updateScoreRow(index: number, field: "label" | "score", value: string) {
    setScores((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeScoreRow(index: number) {
    setScores((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    const weeks = Number(durationWeeks);
    if (!description.trim() || !Number.isInteger(weeks) || weeks < 1) {
      setError("Enter a goal description and a valid number of weeks.");
      return;
    }
    const cleanedScores = scores
      .map((s) => ({ label: s.label.trim(), score: s.score.trim() }))
      .filter((s) => s.label.length > 0 && s.score.length > 0);

    setStatus("creating");
    const created = await createGoalAction({
      description: description.trim(),
      durationWeeks: weeks,
      currentScores: cleanedScores.length > 0 ? cleanedScores : undefined,
      targetSkillIds: targetSkillIds.length > 0 ? targetSkillIds : undefined,
    });
    if (!created.ok || !created.goal) {
      setError(created.error ?? "Failed to create goal.");
      setStatus("idle");
      return;
    }

    setStatus("generating");
    const generated = await generatePlansAction(created.goal.id);
    if (!generated.ok || !generated.goal) {
      setError(generated.error ?? "Failed to generate plans.");
      setStatus("idle");
      return;
    }

    setGoal(generated.goal);
    setStatus("idle");
  }

  async function handleSelect(optionId: number) {
    if (!goal) return;
    setError(undefined);
    setStatus("applying");
    const result = await selectPlanAction(goal.id, optionId);
    if (!result.ok || !result.goal) {
      setError(result.error ?? "Failed to apply plan.");
      setStatus("idle");
      return;
    }
    setGoal(result.goal);
    setStatus("idle");
  }

  if (goal?.selectedPlanOption) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-success">Plan applied</h2>
        <p className="text-sm text-foreground-muted">
          The {goal.selectedPlanOption.weeklyHours}h/week plan is now your weekly target across
          the next {goal.durationWeeks} week{goal.durationWeeks === 1 ? "" : "s"} for every skill it
          covers.
        </p>
        <Link
          href="/plan"
          className="w-fit rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard"
        >
          View plan vs actual
        </Link>
      </div>
    );
  }

  if (goal && goal.planOptions.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Goal: <span className="font-medium text-foreground">{goal.description}</span> ·{" "}
            {goal.durationWeeks} week{goal.durationWeeks === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => setGoal(null)}
            className="text-xs text-foreground-muted hover:text-foreground"
          >
            Start over
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          {goal.planOptions.map((option, i) => (
            <PlanCard
              key={option.id}
              option={option}
              gradient={TILE_GRADIENTS[i % TILE_GRADIENTS.length]}
              onChoose={() => handleSelect(option.id)}
              disabled={status === "applying"}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleGenerate}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 shadow-sm"
    >
      <label className="flex flex-col gap-1 text-sm text-foreground-muted">
        Goal
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="e.g. Complete GRE and IELTS"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">
          Target categories (optional — pin exact skills, or let the goal description above imply
          them)
        </span>
        <TargetSkillsPicker
          skills={skills}
          selectedIds={targetSkillIds}
          onChange={setTargetSkillIds}
          onSkillCreated={(skill) => setSkills((prev) => [...prev, skill])}
          onCreate={createGoalCategoryAction}
        />
      </div>

      <label className="flex max-w-xs flex-col gap-1 text-sm text-foreground-muted">
        Timeframe (weeks)
        <input
          type="number"
          min={1}
          max={52}
          value={durationWeeks}
          onChange={(e) => setDurationWeeks(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-muted">Current mock scores (optional)</span>
          <button
            type="button"
            onClick={addScoreRow}
            className="text-xs font-bold uppercase tracking-wide text-brand hover:underline"
          >
            + Add score
          </button>
        </div>
        {scores.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={s.label}
              onChange={(e) => updateScoreRow(i, "label", e.target.value)}
              placeholder="e.g. GRE"
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <input
              type="text"
              value={s.score}
              onChange={(e) => updateScoreRow(i, "score", e.target.value)}
              placeholder="e.g. 310"
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => removeScoreRow(i)}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status !== "idle"}
          className="rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
        >
          {status === "creating" && "Creating goal…"}
          {status === "generating" && "Generating plans (this can take a minute)…"}
          {status === "idle" && "Generate my plans"}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}

function PlanCard({
  option,
  gradient,
  onChoose,
  disabled,
}: {
  option: GoalPlanOption;
  gradient: string;
  onChoose: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised shadow-sm">
      <div
        style={{ backgroundImage: gradient }}
        className="flex flex-col gap-1 rounded-t-lg p-4 shadow-glow"
      >
        <span className="text-lg font-bold text-white">{option.weeklyHours}h / week</span>
        <p className="text-sm text-white/90">{option.plan.summary}</p>
      </div>

      <div className="flex flex-col gap-2 px-4">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Weekly breakdown
        </span>
        <ul className="flex flex-col gap-1.5">
          {option.plan.skills.map((skill) => (
            <li key={skill.name} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {skill.name}
                {skill.isNewCategory && (
                  <span className="ml-1.5 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground-muted">
                    New
                  </span>
                )}
              </span>
              <span className="text-foreground-muted">{formatMinutes(skill.weeklyMinutes)}</span>
            </li>
          ))}
        </ul>
      </div>

      {option.tentativeScores.length > 0 && (
        <div className="flex flex-col gap-2 px-4">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Tentative projected scores
          </span>
          <ul className="flex flex-col gap-1.5">
            {option.tentativeScores.map((score) => (
              <li key={score.label} className="text-sm">
                <span className="font-medium text-foreground">{score.label}: </span>
                <span className="text-foreground-muted">
                  {score.current} → {score.projected}
                </span>
                {score.note && <p className="text-xs text-foreground-muted">{score.note}</p>}
              </li>
            ))}
          </ul>
          <p className="text-xs italic text-foreground-muted">
            AI estimate only — not a guarantee of actual results.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onChoose}
        disabled={disabled}
        className="mx-4 mb-4 mt-2 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
      >
        Choose this plan
      </button>
    </div>
  );
}
