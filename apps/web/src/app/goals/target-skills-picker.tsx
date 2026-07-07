"use client";

import { useState, useTransition } from "react";
import type { Skill } from "@/lib/api";

export function TargetSkillsPicker({
  skills,
  selectedIds,
  onChange,
  onSkillCreated,
  onCreate,
  onSkillDeleted,
  onDelete,
}: {
  skills: Skill[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onSkillCreated: (skill: Skill) => void;
  onCreate: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string; id?: number; slug?: string; name?: string }>;
  onSkillDeleted: (id: number) => void;
  onDelete: (id: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number>();
  const [isDeleting, startDeleteTransition] = useTransition();

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

  function handleDelete(skill: Skill) {
    if (
      !confirm(
        `Delete the "${skill.name}" category? This can't be undone, and only works if no sessions are logged under it.`,
      )
    ) {
      return;
    }
    setError(undefined);
    setDeletingId(skill.id);
    startDeleteTransition(async () => {
      const result = await onDelete(skill.id);
      if (result.ok) {
        onSkillDeleted(skill.id);
        onChange(selectedIds.filter((id) => id !== skill.id));
      } else {
        setError(result.error ?? "Failed to delete category.");
      }
      setDeletingId(undefined);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {skills.map((skill) => {
          const active = selectedIds.includes(skill.id);
          const isDeletingThis = isDeleting && deletingId === skill.id;
          return (
            <span
              key={skill.id}
              className={`inline-flex items-center gap-1 rounded-full py-1.5 pl-3 pr-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-[var(--duration-fast)] ease-standard ${
                active
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface text-foreground-muted hover:text-foreground"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(skill.id)}
                aria-pressed={active}
                disabled={isDeletingThis}
                className="disabled:opacity-60"
              >
                {isDeletingThis ? "Deleting…" : skill.name}
              </button>
              {!isDeletingThis && (
                <button
                  type="button"
                  onClick={() => handleDelete(skill)}
                  aria-label={`Delete ${skill.name} category`}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none normal-case transition-colors duration-[var(--duration-fast)] ease-standard ${
                    active ? "hover:bg-white/20" : "hover:bg-border-strong"
                  }`}
                >
                  ×
                </button>
              )}
            </span>
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
