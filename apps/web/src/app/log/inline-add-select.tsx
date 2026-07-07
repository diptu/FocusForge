"use client";

import { useState, useTransition } from "react";

const ADD_NEW_VALUE = "__add_new__";

export function InlineAddSelect({
  name,
  value,
  options,
  onSelect,
  onCreate,
  addLabel,
  namePlaceholder,
  emptyLabel,
  required,
  onAddingChange,
}: {
  /** Form field name (omit for selects that aren't submitted directly, e.g. Skill). */
  name?: string;
  value: string;
  options: { id: number; name: string }[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<{ ok: boolean; error?: string; id?: number }>;
  addLabel: string;
  namePlaceholder: string;
  emptyLabel: string;
  required?: boolean;
  onAddingChange?: (adding: boolean) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function startAdding() {
    setAdding(true);
    setError(undefined);
    onAddingChange?.(true);
  }

  function cancelAdding() {
    setAdding(false);
    setNewName("");
    setError(undefined);
    onAddingChange?.(false);
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === ADD_NEW_VALUE) {
      startAdding();
      return;
    }
    onSelect(e.target.value);
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
        onSelect(result.id.toString());
        setAdding(false);
        setNewName("");
        setError(undefined);
        onAddingChange?.(false);
      } else {
        setError(result.error ?? "Failed to add.");
      }
    });
  }

  if (adding) {
    return (
      <div className="flex flex-col gap-1">
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
            placeholder={namePlaceholder}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="shrink-0 rounded-full bg-brand px-3 py-2 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-60"
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
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <select
      name={name}
      value={value}
      onChange={handleSelectChange}
      required={required}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
    >
      {options.length === 0 && (
        <option value="" disabled>
          {emptyLabel}
        </option>
      )}
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
      <option value={ADD_NEW_VALUE}>{addLabel}</option>
    </select>
  );
}
