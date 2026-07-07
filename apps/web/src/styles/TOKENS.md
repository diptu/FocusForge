# FocusForge design tokens

Source of truth: `src/styles/tokens.css`, imported by `src/app/globals.css`. Live usage examples: `src/app/page.tsx`.

Tailwind v4 has no `tailwind.config.js` — utilities are generated straight from CSS custom properties declared in `@theme`. That means the token file *is* the config. Rule for all component code: no literal hex, px, or ms — if a value isn't below, add it as a token first, don't inline it.

## Color

| Token | Utility | Use |
|---|---|---|
| `--background` | `bg-background` / `text-background` | Page background |
| `--surface` | `bg-surface` | Cards, subtle panels |
| `--surface-raised` | `bg-surface-raised` | Modals, popovers (pair with `shadow-md`/`shadow-lg`) |
| `--foreground` | `text-foreground` | Primary text |
| `--foreground-muted` | `text-foreground-muted` | Secondary/caption text |
| `--border` / `--border-strong` | `border-border` / `border-border-strong` | Dividers, input borders |
| `--brand` / `--brand-foreground` | `bg-brand` / `text-brand-foreground` | Primary actions |
| `--success` / `--warning` / `--danger` / `--info` | `bg-success` etc. | System status only |
| `--domain-quant` / `-ielts` / `-js` / `-stats` / `-dl` | `bg-domain-quant` etc. | Skill-domain accents — analytics charts, skill tags (see `pm/roadmap.md` Phase 2). **Never reuse these for status** — they're deliberately distinct hues from success/warning/danger/info. |

All color tokens flip automatically for dark mode via `@media (prefers-color-scheme: dark)` — no `dark:` variants needed in components for these.

## Spacing & breakpoints

Not overridden. Tailwind v4 defaults already are the project's scale:
- Spacing: `--spacing: 0.25rem` (4px base) — use standard `p-4`, `gap-2`, etc.
- Breakpoints: `sm` (640px) and `lg` (1024px) already line up with this project's mobile / tablet / desktop split. No prefix = mobile, `sm:`...`lg:` = tablet, `lg:`+ = desktop.

## Radius

`--radius-sm` (6px) / `--radius-md` (10px) / `--radius-lg` (16px) → `rounded-sm` / `rounded-md` / `rounded-lg`. Deliberately tighter than Tailwind's stock scale — this is a data-dense tool, not a marketing page.

## Shadow

`--shadow-sm` / `--shadow-md` / `--shadow-lg` → `shadow-sm` / `shadow-md` / `shadow-lg`. Flat by default; reserve `md`/`lg` for one level of real elevation (popovers, modals). Don't stack shadow utilities.

## Motion

`--ease-standard` → `ease-standard` (this one **is** a real Tailwind theme namespace).

Duration is different: Tailwind v4's `duration-*` utilities are numeric-only, they don't read named `--duration-*` keys the way color/radius/shadow/ease do. So durations are consumed via arbitrary-value syntax, still 100% token-driven:

```tsx
className="transition-colors duration-[var(--duration-fast)] ease-standard"
```

`--duration-fast` (100ms) / `--duration-base` (200ms) / `--duration-slow` (300ms). All three collapse under `prefers-reduced-motion: reduce` automatically — components never need to check that media query themselves, just use the token.

## What's next

This covers tokens only, per `/ui-ux-engineers design-system` scope decision — no component catalog yet. Next step is `/ui component <name>` once the first real screen (daily study logger, `pm/roadmap.md` Phase 1) defines which components are actually needed, rather than building a catalog speculatively.
