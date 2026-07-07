"use client";

import { useState, useTransition } from "react";
import type { Skill } from "@/lib/api";

export function TargetSkillsPicker({
  skills,
  selectedIds,
  onChange,
  onSkillCreated,
  onCreate,
}: {
  skills: Skill[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onSkillCreated: (skill: Skill) => void;
  onCreate: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string; id?: number; slug?: string; name?: string }>;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function toggle(id: number) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  }

  function cancelAdding() {
    setAdding(false);
    setNewName("");
    setError(undefined);
  }

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await onCreate(trimmed);
      if (result.ok && result.id != null) {
        const created: Skill = {
          id: result.id,
          slug: result.slug ?? "",
          name: result.name ?? trimmed,
          subSkills: [],
        };
        onSkillCreated(created);
        onChange([...selectedIds, created.id]);
        cancelAdding();
      } else {
        setError(result.error ?? "Failed to add.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {skills.map((skill) => {
          const active = selectedIds.includes(skill.id);
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggle(skill.id)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-[var(--duration-fast)] ease-standard ${
                active
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface text-foreground-muted hover:text-foreground"
              }`}
            >
              {skill.name}
            </button>
          );
        })}

        {adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="e.g. GRE"
              className="w-32 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={cancelAdding}
              className="shrink-0 text-xs text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-border-strong px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface"
          >
            + Add new category
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
